import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import { homePathForRole } from "./roles";

export interface SessionProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

/**
 * المستخدم الحالي + ملفه الشخصي (من الكوكيز، بعد التحقق من التوكن لدى Supabase).
 * الحسابات المعطّلة تُعامل كأنها غير مسجلة.
 */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, disabled_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.disabled_at) return null;

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? "",
    full_name: profile.full_name ?? "",
    role: profile.role as UserRole,
  };
});

/** للصفحات: يعيد التوجيه إن لم يكن الدور مسموحاً */
export async function requireRole(allowed: UserRole[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (!allowed.includes(profile.role)) redirect(homePathForRole(profile.role));
  return profile;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403,
  ) {
    super(message);
  }
}

/** للـ Server Actions والـ Route Handlers: يرمي خطأ بدل إعادة التوجيه */
export async function assertRole(allowed: UserRole[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) throw new AuthError("يجب تسجيل الدخول أولاً", 401);
  if (!allowed.includes(profile.role)) throw new AuthError("ليست لديك صلاحية لتنفيذ هذا الإجراء", 403);
  return profile;
}
