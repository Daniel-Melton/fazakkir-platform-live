import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_STAFF_ROLES, isContentAdmin } from "@/lib/auth/roles";
import { toPayload, type ContentStatus } from "@/lib/cms/fields";
import { getLive, getRevision, getTaxonomy } from "@/lib/cms/queries";
import ContentWorkspace from "@/components/cms/ContentWorkspace";

export const metadata: Metadata = { title: "طلب تعديل", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// صفحة المحرر لمتابعة طلبه (مسودة / بانتظار الموافقة / مرفوض)
export default async function RevisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole(CONTENT_STAFF_ROLES);

  const rev = await getRevision(id);
  if (!rev) notFound();

  // المدير يراجع من طابور الموافقات
  if (rev.submitted_by !== profile.id) {
    if (isContentAdmin(profile.role)) redirect(`/dashboard/admin/approvals/${rev.id}`);
    notFound();
  }
  // طلب اعتُمد بالفعل => نفتح المحتوى الحي
  if (rev.status === "published") {
    redirect(rev.entity_id && rev.action !== "delete" ? `/dashboard/content/${rev.entity_type}/${rev.entity_id}` : "/dashboard/content");
  }
  if (rev.action === "delete") redirect("/dashboard/content");

  const [live, taxonomy] = await Promise.all([
    rev.entity_id ? getLive(rev.entity_type, rev.entity_id) : Promise.resolve(null),
    getTaxonomy(),
  ]);

  return (
    <ContentWorkspace
      key={rev.id}
      entityType={rev.entity_type}
      entityId={rev.entity_id}
      revisionId={rev.id}
      revisionStatus={rev.status}
      revisionAction={rev.action}
      reviewNote={rev.review_note}
      submitNote={rev.submit_note}
      liveStatus={live ? (live.status as ContentStatus) : null}
      liveSlug={live ? String(live.slug ?? "") : null}
      lockedByOther={false}
      isAdmin={false}
      initial={toPayload(rev.entity_type, rev.payload)}
      taxonomy={taxonomy}
    />
  );
}
