"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertRole, AuthError } from "@/lib/auth/session";
import { CONTENT_ADMIN_ROLES, creatableRoles } from "@/lib/auth/roles";
import { SITE_URL } from "@/lib/seo";
import type { UserRole } from "@/types/database";

// إنشاء حسابات المحررين: لا يوجد أي مسار تسجيل عام لهذا الدور.
// الحساب يُنشأ هنا فقط، بعد التحقق من أن المستدعي admin أو super_admin،
// وقاعدة البيانات نفسها ترفض منح الدور من أي طريق آخر (trigger: cms_guard_profile_role).

const accountSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح").max(200),
  password: z.string().max(100).optional(),
});

const inputSchema = z.object({
  mode: z.enum(["password", "invite"]),
  role: z.enum(["editor", "admin"]),
  accounts: z.array(accountSchema).min(1, "أضف حساباً واحداً على الأقل").max(20, "20 حساباً كحد أقصى في المرة"),
});

export interface CreatedAccountResult {
  email: string;
  ok: boolean;
  error?: string;
  /** تظهر مرة واحدة فقط للمدير ليسلّمها للمحرر */
  tempPassword?: string;
  invited?: boolean;
}

function generatePassword(): string {
  // 18 حرفاً من أبجدية بلا رموز ملتبسة
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(18);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 6)}-${out.slice(6, 12)}-${out.slice(12)}`;
}

export async function createStaffAccountsAction(
  raw: unknown,
): Promise<{ ok: true; results: CreatedAccountResult[] } | { ok: false; error: string }> {
  try {
    const actor = await assertRole(CONTENT_ADMIN_ROLES);
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }
    const { mode, role, accounts } = parsed.data;

    if (!creatableRoles(actor.role).includes(role as UserRole)) {
      return { ok: false, error: "لا تملك صلاحية إنشاء حساب بهذا الدور" };
    }

    const admin = createAdminClient();
    const results: CreatedAccountResult[] = [];
    const seen = new Set<string>();

    for (const acc of accounts) {
      if (seen.has(acc.email)) {
        results.push({ email: acc.email, ok: false, error: "البريد مكرر في القائمة" });
        continue;
      }
      seen.add(acc.email);

      let userId: string | null = null;
      let tempPassword: string | undefined;

      if (mode === "password") {
        const password = acc.password?.trim() || generatePassword();
        if (password.length < 10) {
          results.push({ email: acc.email, ok: false, error: "كلمة المرور يجب ألا تقل عن 10 أحرف" });
          continue;
        }
        // ملاحظة: لا نضع الدور في user_metadata — الدور يُكتب في profiles فقط
        const { data, error } = await admin.auth.admin.createUser({
          email: acc.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: acc.full_name },
        });
        if (error || !data.user) {
          results.push({
            email: acc.email,
            ok: false,
            error: /already|registered|exists/i.test(error?.message ?? "")
              ? "هذا البريد مسجّل مسبقاً"
              : (error?.message ?? "تعذّر إنشاء الحساب"),
          });
          continue;
        }
        userId = data.user.id;
        tempPassword = password;
      } else {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(acc.email, {
          data: { full_name: acc.full_name },
          redirectTo: `${SITE_URL}/auth/confirm?next=/dashboard/account/password`,
        });
        if (error || !data.user) {
          results.push({
            email: acc.email,
            ok: false,
            error: /already|registered|exists/i.test(error?.message ?? "")
              ? "هذا البريد مسجّل مسبقاً"
              : (error?.message ?? "تعذّر إرسال الدعوة"),
          });
          continue;
        }
        userId = data.user.id;
      }

      const { error: profileError } = await admin.from("profiles").upsert(
        {
          id: userId,
          full_name: acc.full_name,
          email: acc.email,
          role,
          created_by: actor.id,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        // تراجع: لا نترك مستخدماً بلا ملف/دور
        await admin.auth.admin.deleteUser(userId);
        results.push({ email: acc.email, ok: false, error: `تعذّر حفظ الملف الشخصي: ${profileError.message}` });
        continue;
      }

      results.push({ email: acc.email, ok: true, tempPassword, invited: mode === "invite" });
    }

    revalidatePath("/dashboard/admin/editors");
    return { ok: true, results };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    console.error("[cms] createStaffAccountsAction:", err);
    return { ok: false, error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" };
  }
}

/** تعطيل/إعادة تفعيل حساب (المدير: المحررون فقط — المدير العام: المحررون والمديرون) */
export async function setStaffDisabledAction(
  userId: string,
  disabled: boolean,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const actor = await assertRole(CONTENT_ADMIN_ROLES);
    if (userId === actor.id) return { ok: false, error: "لا يمكنك تعطيل حسابك" };

    const admin = createAdminClient();
    const { data: target } = await admin.from("profiles").select("id, role").eq("id", userId).maybeSingle();
    if (!target) return { ok: false, error: "الحساب غير موجود" };
    if (!creatableRoles(actor.role).includes(target.role as UserRole)) {
      return { ok: false, error: "لا تملك صلاحية إدارة هذا الحساب" };
    }

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: disabled ? "876000h" : "none",
    });
    if (banError) return { ok: false, error: banError.message };

    const { error } = await admin
      .from("profiles")
      .update({ disabled_at: disabled ? new Date().toISOString() : null })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/admin/editors");
    return { ok: true, message: disabled ? "تم تعطيل الحساب" : "تمت إعادة تفعيل الحساب" };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : "حدث خطأ غير متوقع" };
  }
}
