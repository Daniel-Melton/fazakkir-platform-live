// تعريف الأدوار والصلاحيات — ملف "نقي" بلا أي اعتماد على السيرفر
// ليُستخدم في الـ Proxy/Middleware والمكونات والـ Server Actions معاً.
import type { UserRole } from "@/types/database";

export const ROLE_LABELS_AR: Record<UserRole, string> = {
  super_admin: "مدير عام",
  admin: "مدير",
  editor: "محرر محتوى",
  academic_supervisor: "مشرف أكاديمي",
  tutor: "معلم",
  parent_student: "ولي أمر",
};

/** من يراجع ويعتمد المحتوى وينشئ حسابات المحررين */
export const CONTENT_ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
/** من يدخل مساحة عمل المحتوى */
export const CONTENT_STAFF_ROLES: UserRole[] = ["super_admin", "admin", "editor"];

export const isContentAdmin = (role?: string | null): boolean =>
  !!role && (CONTENT_ADMIN_ROLES as string[]).includes(role);

export const isContentStaff = (role?: string | null): boolean =>
  !!role && (CONTENT_STAFF_ROLES as string[]).includes(role);

/** الأدوار التي يحق لصاحب الدور إنشاء حسابات بها */
export function creatableRoles(role?: string | null): UserRole[] {
  if (role === "super_admin") return ["editor", "admin"];
  if (role === "admin") return ["editor"];
  return [];
}

/** الصفحة الرئيسية المناسبة لكل دور بعد تسجيل الدخول */
export function homePathForRole(role?: string | null): string {
  switch (role) {
    case "super_admin":
    case "academic_supervisor":
      return "/dashboard/supervisor/enrollments";
    case "admin":
      return "/dashboard/admin/approvals";
    case "editor":
      return "/dashboard/content";
    case "parent_student":
      return "/dashboard/parent";
    default:
      return "/dashboard/sessions";
  }
}

/**
 * قواعد حماية المسارات (تُطبَّق في proxy.ts ثم يُعاد التحقق منها داخل كل صفحة وكل Server Action).
 * أول قاعدة مطابقة هي التي تُطبّق.
 */
export const ROUTE_RULES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/dashboard/admin", roles: CONTENT_ADMIN_ROLES },
  { prefix: "/dashboard/content", roles: CONTENT_STAFF_ROLES },
  { prefix: "/api/cms", roles: CONTENT_STAFF_ROLES },
  { prefix: "/dashboard/supervisor", roles: ["super_admin", "academic_supervisor"] },
];

export function rolesForPath(pathname: string): UserRole[] | null {
  const rule = ROUTE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  return rule ? rule.roles : null;
}
