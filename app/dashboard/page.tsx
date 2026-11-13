import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/roles";

// /dashboard => الصفحة الرئيسية المناسبة لدور المستخدم
export default async function DashboardIndex() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  redirect(homePathForRole(profile.role));
}
