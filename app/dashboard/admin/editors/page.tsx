import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_ADMIN_ROLES, creatableRoles } from "@/lib/auth/roles";
import { listStaff, namesByIds } from "@/lib/cms/queries";
import StaffPanel from "@/components/cms/StaffPanel";

export const metadata: Metadata = { title: "حسابات المحررين", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditorsPage() {
  const profile = await requireRole(CONTENT_ADMIN_ROLES);
  const staff = await listStaff();
  const creators = await namesByIds(staff.map((s) => s.created_by));
  const names: Record<string, string> = {};
  for (const [id, p] of Object.entries(creators)) names[id] = p.full_name || p.email;

  return <StaffPanel staff={staff} currentUserId={profile.id} creatable={creatableRoles(profile.role)} names={names} />;
}
