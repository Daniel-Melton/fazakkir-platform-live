import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_STAFF_ROLES, isContentAdmin } from "@/lib/auth/roles";
import { toPayload, type ContentStatus, type EntityType } from "@/lib/cms/fields";
import { getLive, getTaxonomy, listMyRevisions, pendingEntityKeys } from "@/lib/cms/queries";
import ContentWorkspace from "@/components/cms/ContentWorkspace";

export const metadata: Metadata = { title: "تعديل المحتوى", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (type !== "article" && type !== "course") notFound();
  const entityType = type as EntityType;
  const profile = await requireRole(CONTENT_STAFF_ROLES);
  const admin = isContentAdmin(profile.role);

  const live = await getLive(entityType, id);
  if (!live) notFound();

  let lockedByOther = false;
  if (!admin) {
    // إن كان للمحرر طلب مفتوح على هذا المحتوى نكمل عليه بدل إنشاء طلب ثانٍ
    const mine = await listMyRevisions(profile.id);
    const open = mine.find(
      (r) =>
        r.entity_type === entityType &&
        r.entity_id === String(live.id) &&
        r.action === "update" &&
        ["draft", "pending_approval", "rejected"].includes(r.status),
    );
    if (open) redirect(`/dashboard/content/revisions/${open.id}`);
    lockedByOther = (await pendingEntityKeys()).has(`${entityType}:${live.id}`);
  }

  const taxonomy = await getTaxonomy();

  return (
    <ContentWorkspace
      key={`${entityType}-${live.id}`}
      entityType={entityType}
      entityId={String(live.id)}
      revisionId={null}
      revisionStatus={null}
      revisionAction={null}
      reviewNote=""
      submitNote=""
      liveStatus={live.status as ContentStatus}
      liveSlug={String(live.slug ?? "")}
      lockedByOther={lockedByOther}
      isAdmin={admin}
      initial={toPayload(entityType, live)}
      taxonomy={taxonomy}
    />
  );
}
