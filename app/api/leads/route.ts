import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = body.fullName || body.parentName;
    const email = body.email;
    const countryCode = body.countryCode || "";
    const phoneNumber = body.phoneNumber || body.phone || "";
    const courseName = body.courseName || body.preferredCourse;

    const fullPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `${countryCode} ${phoneNumber}`.trim();

    if (!fullName || !email || !phoneNumber || !courseName) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // 1. حفظ بيانات الطالب في Supabase
    const { data: leadData, error: dbError } = await supabase
      .from("leads")
      .insert([
        {
          parent_name: fullName,
          full_name: fullName,
          email: email,
          phone: fullPhone,
          country: countryCode || "Unknown",
          student_count: 1,
          preferred_course: courseName,
          status: "new",
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 2. إرسال الإشعار البريدي عبر Resend مع فحص دقيق للنتيجة
    const targetEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "lonelywolf1452@gmail.com";

    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ Warning: RESEND_API_KEY is not defined in environment variables.");
    } else {
      console.log(` Attempting to send email via Resend to: ${targetEmail}`);

      const emailResponse = await resend.emails.send({
        from: "Fazakkir Academy <info@fazakkir.com>",
        to: targetEmail,
        subject: `🎓 New Free Trial Request: ${fullName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #064e3b; margin-top: 0;">New Free Trial Registration</h2>
            <p style="color: #475569;">A new student just submitted the registration form:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Name:</td>
                <td style="padding: 8px 0; color: #334155;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Email:</td>
                <td style="padding: 8px 0; color: #334155;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">WhatsApp / Phone:</td>
                <td style="padding: 8px 0; color: #334155;">${fullPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Selected Course:</td>
                <td style="padding: 8px 0; color: #334155;">${courseName}</td>
              </tr>
            </table>
            <a href="https://wa.me/${fullPhone.replace(/[^0-9]/g, "")}" style="display: inline-block; background-color: #25d366; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Chat on WhatsApp
            </a>
          </div>
        `,
      });

      if (emailResponse.error) {
        console.error("❌ Resend API Error:", emailResponse.error);
      } else {
        console.log("✅ Email sent successfully! ID:", emailResponse.data?.id);
      }
    }

    return NextResponse.json({ success: true, lead: leadData });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit lead" },
      { status: 500 }
    );
  }
}