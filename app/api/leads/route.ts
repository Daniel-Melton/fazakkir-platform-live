import { NextRequest, NextResponse } from "next/server";
import { leadSchema } from "@/lib/validations/lead";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// إعداد Supabase مع مفتاح الخدمة لتخطي الـ RLS بعد التدقيق
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// إعداد Rate Limiting (3 محاولات لكل دقيقة لكل IP)
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "60 s"),
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    if (ratelimit) {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
      }
    }

    const body = await req.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { fullName, email, countryCode, phoneNumber, courseName, turnstileToken } = result.data;

    // 1. التحقق من Cloudflare Turnstile
    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: turnstileToken,
        remoteip: ip,
      }),
    });
    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      return NextResponse.json({ error: "Bot detection failed." }, { status: 403 });
    }

    // 2. الإدراج في قاعدة البيانات
    const { data: lead, error: dbError } = await supabase
      .from("leads")
      .insert({
        full_name: fullName,
        email,
        country_code: countryCode,
        phone_number: phoneNumber,
        course_name: courseName,
        turnstile_verified: true,
      })
      .select("id")
      .single();

    if (dbError) throw dbError;

    // 3. إرسال تنبيه عبر Resend لإدارة الأكاديمية
// 3. إرسال تنبيه عبر Resend لإدارة الأكاديمية (باستخدام بريد الاختبار المعتمد)
    if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFICATION_EMAIL) {
      const emailResult = await resend.emails.send({
        from: "Fazakkir Academy <onboarding@resend.dev>",
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Lead: ${fullName} - ${courseName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #0f172a;">
            <h2 style="color: #059669; margin-bottom: 16px;">New Free Trial Request</h2>
            <p><strong>Student / Parent:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${countryCode} ${phoneNumber}</p>
            <p><strong>Program:</strong> ${courseName}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 12px; color: #64748b;">Fazakkir Academy Lead Engine</p>
          </div>
        `,
      });
      console.log("Resend email response:", emailResult);
    }

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err: any) {
    console.error("Lead processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}