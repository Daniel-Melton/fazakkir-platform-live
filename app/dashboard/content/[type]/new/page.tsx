import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_STAFF_ROLES, isContentAdmin } from "@/lib/auth/roles";
import { defaultsFor, type EntityType } from "@/lib/cms/fields";
import { getTaxonomy } from "@/lib/cms/queries";
import ContentWorkspace from "@/components/cms/ContentWorkspace";

export const metadata: Metadata = { title: "محتوى جديد", robots: { index: false, follow: false } };

export default async function NewContentPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (type !== "article" && type !== "course") notFound();
  const profile = await requireRole(CONTENT_STAFF_ROLES);
  const taxonomy = await getTaxonomy();

  return (
    <ContentWorkspace
      entityType={type as EntityType}
      entityId={null}
      revisionId={null}
      revisionStatus={null}
      revisionAction={null}
      reviewNote=""
      submitNote=""
      liveStatus={null}
      liveSlug={null}
      lockedByOther={false}
      isAdmin={isContentAdmin(profile.role)}
      initial={defaultsFor(type as EntityType)}
      taxonomy={taxonomy}
    />
  );
}
