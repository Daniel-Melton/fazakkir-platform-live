import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/roles";
import PasswordForm from "@/components/cms/PasswordForm";
import { Card } from "@/components/cms/ui";

export const metadata: Metadata = { title: "كلمة المرور", robots: { index: false, follow: false } };

export default async function PasswordPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  return (
    <div dir="rtl" className="mx-auto max-w-md text-right">
      <Card title="تعيين كلمة المرور" description={`الحساب: ${profile.email}`}>
        <PasswordForm home={homePathForRole(profile.role)} />
      </Card>
    </div>
  );
}
