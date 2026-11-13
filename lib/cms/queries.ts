import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ENTITY_TABLE,
  type ContentStatus,
  type EntityType,
  type RevisionAction,
} from "./fields";

export interface LiveItem {
  id: string;
  type: EntityType;
  title: string;
  slug: string;
  status: ContentStatus;
  category: string;
  updated_at: string | null;
}

export interface RevisionRow {
  id: string;
  entity_type: EntityType;
  entity_id: string | null;
  action: RevisionAction;
  status: ContentStatus;
  title: string;
  slug: string;
  payload: Record<string, unknown>;
  base_snapshot: Record<string, unknown> | null;
  base_updated_at: string | null;
  submit_note: string;
  submitted_by: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string;
  direct: boolean;
  created_at: string;
  updated_at: string;
}

export type RevisionSummary = Omit<RevisionRow, "payload" | "base_snapshot">;

const SUMMARY_COLS =
  "id, entity_type, entity_id, action, status, title, slug, base_updated_at, submit_note, submitted_by, submitted_at, reviewed_by, reviewed_at, review_note, direct, created_at, updated_at";

/** كل عناصر المحتوى الحي (RLS: الطاقم يرى كل الحالات) */
export async function listLive(type: EntityType): Promise<LiveItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(ENTITY_TABLE[type])
    .select("id, title, slug, status, category, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: String(r.id),
    type,
    title: r.title ?? "",
    slug: r.slug ?? "",
    status: r.status as ContentStatus,
    category: r.category ?? "",
    updated_at: r.updated_at ?? null,
  }));
}

export async function getLive(type: EntityType, id: string): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(ENTITY_TABLE[type]).select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data;
}

export async function getRevision(id: string): Promise<RevisionRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_revisions").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data as RevisionRow | null;
}

/** طلبات المستخدم الحالي غير المنتهية + آخر ما رُوجع منها */
export async function listMyRevisions(userId: string): Promise<RevisionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_revisions")
    .select(SUMMARY_COLS)
    .eq("submitted_by", userId)
    .eq("direct", false)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as RevisionSummary[];
}

export async function listPendingRevisions(): Promise<RevisionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_revisions")
    .select(SUMMARY_COLS)
    .eq("status", "pending_approval")
    .order("submitted_at", { ascending: true })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as RevisionSummary[];
}

export async function listReviewedRevisions(limit = 30): Promise<RevisionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_revisions")
    .select(SUMMARY_COLS)
    .in("status", ["published", "rejected"])
    .not("reviewed_at", "is", null)
    .order("reviewed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as RevisionSummary[];
}

/** معرّفات العناصر التي عليها طلب معلّق (لإظهار شارة في القائمة) */
export async function pendingEntityKeys(): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content_revisions")
    .select("entity_type, entity_id")
    .eq("status", "pending_approval")
    .not("entity_id", "is", null);
  return new Set((data ?? []).map((r) => `${r.entity_type}:${r.entity_id}`));
}

export async function countPending(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("content_revisions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_approval");
  return count ?? 0;
}

export interface PersonName {
  id: string;
  full_name: string;
  email: string;
}

export async function namesByIds(ids: (string | null | undefined)[]): Promise<Record<string, PersonName>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (unique.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id, full_name, email").in("id", unique);
  const out: Record<string, PersonName> = {};
  for (const p of data ?? []) out[p.id] = { id: p.id, full_name: p.full_name ?? "", email: p.email ?? "" };
  return out;
}

export interface Taxonomy {
  categories: string[];
  tags: string[];
}

/** التصنيفات والوسوم المستخدمة فعلاً — تُقترح في المحدِّد المتعدد */
export async function getTaxonomy(): Promise<Taxonomy> {
  const admin = createAdminClient();
  const [a, c] = await Promise.all([
    admin.from("articles").select("category, categories, tags").limit(1000),
    admin.from("courses").select("category, categories, tags").limit(1000),
  ]);
  const cats = new Map<string, string>();
  const tags = new Map<string, string>();
  const add = (m: Map<string, string>, v: unknown) => {
    const s = String(v ?? "").trim();
    if (s && !m.has(s.toLowerCase())) m.set(s.toLowerCase(), s);
  };
  for (const row of [...(a.data ?? []), ...(c.data ?? [])]) {
    add(cats, row.category);
    (row.categories ?? []).forEach((x: string) => add(cats, x));
    (row.tags ?? []).forEach((x: string) => add(tags, x));
  }
  const sort = (m: Map<string, string>) => [...m.values()].sort((x, y) => x.localeCompare(y));
  return { categories: sort(cats), tags: sort(tags) };
}

export interface StaffAccount {
  id: string;
  full_name: string;
  email: string;
  role: string;
  disabled_at: string | null;
  created_at: string | null;
  created_by: string | null;
}

export async function listStaff(): Promise<StaffAccount[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, role, disabled_at, created_at, created_by")
    .in("role", ["editor", "admin", "super_admin"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffAccount[];
}
