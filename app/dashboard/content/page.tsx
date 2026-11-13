import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_STAFF_ROLES, isContentAdmin } from "@/lib/auth/roles";
import { countPending, listLive, listMyRevisions, pendingEntityKeys } from "@/lib/cms/queries";
import ContentList from "@/components/cms/ContentList";

export const metadata: Metadata = { title: "إدارة المحتوى", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const profile = await requireRole(CONTENT_STAFF_ROLES);
  const admin = isContentAdmin(profile.role);

  const [articles, courses, myRevisions, pendingKeys, pendingCount] = await Promise.all([
    listLive("article"),
    listLive("course"),
    admin ? Promise.resolve([]) : listMyRevisions(profile.id),
    pendingEntityKeys(),
    admin ? countPending() : Promise.resolve(0),
  ]);

  return (
    <ContentList
      articles={articles}
      courses={courses}
      myRevisions={myRevisions}
      pendingKeys={[...pendingKeys]}
      isAdmin={admin}
      pendingCount={pendingCount}
    />
  );
}
