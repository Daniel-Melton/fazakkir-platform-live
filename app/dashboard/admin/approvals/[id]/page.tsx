import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_ADMIN_ROLES } from "@/lib/auth/roles";
import { getLive, getRevision, namesByIds } from "@/lib/cms/queries";
import ReviewView from "@/components/cms/ReviewView";

export const metadata: Metadata = { title: "مراجعة طلب", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(CONTENT_ADMIN_ROLES);

  const rev = await getRevision(id);
  if (!rev) notFound();

  const [live, names] = await Promise.all([
    rev.status === "pending_approval" && rev.entity_id ? getLive(rev.entity_type, rev.entity_id) : Promise.resolve(null),
    namesByIds([rev.submitted_by, rev.reviewed_by]),
  ]);

  return <ReviewView rev={rev} live={live} names={names} />;
}
