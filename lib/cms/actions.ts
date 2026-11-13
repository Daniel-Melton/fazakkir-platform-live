"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertRole, AuthError, type SessionProfile } from "@/lib/auth/session";
import { CONTENT_ADMIN_ROLES, CONTENT_STAFF_ROLES, isContentAdmin } from "@/lib/auth/roles";
import { dispatchNotification } from "@/lib/notifications/dispatcher";
import {
  ENTITY_LABEL_AR,
  ENTITY_PUBLIC_BASE,
  ENTITY_TABLE,
  SLUG_RE,
  bodyField,
  toPayload,
  validatePayload,
  type EntityType,
  type FieldErrors,
} from "./fields";
import { countWords, readingTimeLabel, slugify } from "./seo-analysis";
import { sanitizeContentHtml } from "./sanitize";

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: FieldErrors; code?: string };

export type SaveIntent = "draft" | "submit" | "publish";

export interface SaveInput {
  entityType: EntityType;
  entityId: string | null;
  revisionId: string | null;
  intent: SaveIntent;
  payload: unknown;
  note?: string;
}

const isEntityType = (v: unknown): v is EntityType => v === "article" || v === "course";

/** يحوّل أخطاء Postgres/Supabase إلى رسائل عربية مفهومة */
function friendlyError(err: unknown): { error: string; code?: string } {
  if (err instanceof AuthError) return { error: err.message, code: String(err.status) };
  const e = (err ?? {}) as { message?: string; code?: string; details?: string };
  const msg = e.message ?? "حدث خطأ غير متوقع";
  const cms = msg.match(/(CMS_[A-Z_]+)(?::\s*(.*))?/);
  if (cms) {
    const fallback: Record<string, string> = {
      CMS_FORBIDDEN: "ليست لديك صلاحية لتنفيذ هذا الإجراء",
      CMS_NOT_PENDING: "هذا الطلب ليس في انتظار الموافقة",
      CMS_REVISION_MISSING: "الطلب غير موجود",
      CMS_ENTITY_MISSING: "المحتوى الأصلي غير موجود (ربما حُذف)",
      CMS_STALE_BASE: "تم تعديل المحتوى الحي بعد إنشاء هذا الطلب",
      CMS_STATUS_FORBIDDEN: "الاعتماد والرفض يتمان عبر طابور الموافقات فقط",
    };
    return { error: cms[2] || fallback[cms[1]] || msg, code: cms[1] };
  }
  if (e.code === "23505" || /duplicate key/i.test(msg)) {
    if (/one_pending/.test(msg)) {
      return { error: "يوجد طلب آخر بانتظار الموافقة على هذا المحتوى. انتظر مراجعته أولاً.", code: "PENDING_EXISTS" };
    }
    if (/slug/.test(msg)) return { error: "الرابط (Slug) مستخدم بالفعل، اختر رابطاً آخر", code: "SLUG_TAKEN" };
  }
  if (e.code === "42501" || /row-level security/i.test(msg)) {
    return { error: "ليست لديك صلاحية لتنفيذ هذا الإجراء", code: "FORBIDDEN" };
  }
  console.error("[cms] unexpected error:", err);
  return { error: msg };
}

function fail(err: unknown): { ok: false; error: string; code?: string } {
  return { ok: false, ...friendlyError(err) };
}

/** تنظيف + حساب عدد الكلمات وزمن القراءة + التحقق */
function prepare(type: EntityType, input: unknown, strict: boolean) {
  const candidate = toPayload(type, (input ?? {}) as Record<string, unknown>) as unknown as Record<string, unknown>;
  const field = bodyField(type);
  const cleanBody = sanitizeContentHtml(String(candidate[field] ?? ""));
  candidate[field] = cleanBody;
  const words = countWords(cleanBody);
  candidate.word_count = words;
  candidate.reading_time = words > 0 ? readingTimeLabel(words) : "";
  candidate.slug = String(candidate.slug ?? "").trim().toLowerCase();
  const cats = (candidate.categories as string[]) ?? [];
  candidate.category = cats[0] ?? String(candidate.category ?? "");
  return validatePayload(type, candidate, strict);
}

async function isSlugTaken(
  type: EntityType,
  slug: string,
  entityId: string | null,
  revisionId: string | null,
): Promise<boolean> {
  if (!SLUG_RE.test(slug)) return false;
  const admin = createAdminClient();
  const { data: live } = await admin.from(ENTITY_TABLE[type]).select("id").ilike("slug", slug).limit(5);
  if ((live ?? []).some((r) => String(r.id) !== String(entityId ?? ""))) return true;

  let q = admin
    .from("content_revisions")
    .select("id")
    .eq("entity_type", type)
    .eq("action", "create")
    .eq("status", "pending_approval")
    .ilike("slug", slug)
    .limit(5);
  if (revisionId) q = q.neq("id", revisionId);
  const { data: pending } = await q;
  return (pending ?? []).length > 0;
}

function revalidateContent(type: EntityType, slugs: (string | null | undefined)[]) {
  const base = ENTITY_PUBLIC_BASE[type];
  revalidatePath(base);
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`${base}/${s}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard/admin/approvals");
}

async function notifyAdmins(actor: SessionProfile, title: string, body: string, link: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .in("role", CONTENT_ADMIN_ROLES)
      .is("disabled_at", null);
    await Promise.all(
      (data ?? [])
        .filter((p) => p.id !== actor.id)
        .map((p) => dispatchNotification({ userId: p.id, type: "content_review_request", title, body, link })),
    );
  } catch (e) {
    console.error("[cms] notifyAdmins failed:", e);
  }
}

async function notifyUser(userId: string, title: string, body: string, link: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
    await dispatchNotification({
      userId,
      userEmail: data?.email ?? undefined,
      type: "content_review_decision",
      title,
      body,
      link,
    });
  } catch (e) {
    console.error("[cms] notifyUser failed:", e);
  }
}

// ---------------------------------------------------------------------
// فحص توفر الرابط (يُستدعى لحظياً من النموذج)
// ---------------------------------------------------------------------
export async function checkSlugAction(input: {
  entityType: EntityType;
  slug: string;
  entityId: string | null;
  revisionId: string | null;
}): Promise<ActionResult<{ available: boolean; valid: boolean; suggestion?: string }>> {
  try {
    await assertRole(CONTENT_STAFF_ROLES);
    if (!isEntityType(input.entityType)) return { ok: false, error: "نوع المحتوى غير صالح" };
    const slug = String(input.slug ?? "").trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      return { ok: true, available: false, valid: false, suggestion: slugify(slug) || undefined };
    }
    if (!(await isSlugTaken(input.entityType, slug, input.entityId, input.revisionId))) {
      return { ok: true, available: true, valid: true };
    }
    let suggestion: string | undefined;
    for (let i = 2; i <= 9; i++) {
      const candidate = `${slug}-${i}`;
      if (!(await isSlugTaken(input.entityType, candidate, input.entityId, input.revisionId))) {
        suggestion = candidate;
        break;
      }
    }
    return { ok: true, available: false, valid: true, suggestion };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------
// الحفظ: نقطة الدخول الوحيدة لإنشاء/تعديل المحتوى
//   editor              => دائماً إلى content_revisions (draft | pending_approval)
//   admin / super_admin => مباشرة إلى الجدول الحي عبر cms_admin_save (draft | published)
// ---------------------------------------------------------------------
export async function saveContentAction(
  input: SaveInput,
): Promise<ActionResult<{ entityId: string | null; revisionId: string | null; redirectTo: string; message: string }>> {
  try {
    const profile = await assertRole(CONTENT_STAFF_ROLES);
    if (!isEntityType(input.entityType)) return { ok: false, error: "نوع المحتوى غير صالح" };
    const type = input.entityType;
    const admin = isContentAdmin(profile.role);
    const intent = input.intent;

    if (!["draft", "submit", "publish"].includes(intent)) return { ok: false, error: "إجراء غير معروف" };
    // القيد الأساسي: المحرر لا ينشر مباشرة أبداً
    if (!admin && intent === "publish") {
      return { ok: false, error: "المحرر لا يملك صلاحية النشر المباشر. أرسل التغيير للمراجعة.", code: "FORBIDDEN" };
    }
    if (admin && intent === "submit") {
      return { ok: false, error: "المدير ينشر مباشرة ولا يحتاج إلى إرسال للمراجعة" };
    }

    const strict = intent !== "draft";
    const { ok, payload, errors } = prepare(type, input.payload, strict);
    if (!ok) {
      return { ok: false, error: "راجع الحقول المظلّلة ثم أعد المحاولة", fieldErrors: errors };
    }

    const entityId = input.entityId ? String(input.entityId) : null;
    const revisionId = input.revisionId ? String(input.revisionId) : null;

    if (await isSlugTaken(type, payload.slug, entityId, revisionId)) {
      return {
        ok: false,
        error: "الرابط (Slug) مستخدم بالفعل",
        fieldErrors: { slug: "هذا الرابط مستخدم بالفعل، اختر رابطاً آخر" },
        code: "SLUG_TAKEN",
      };
    }

    const supabase = await createClient();

    // ---------------- مدير: حفظ مباشر ----------------
    if (admin) {
      const { data, error } = await supabase.rpc("cms_admin_save", {
        p_entity_type: type,
        p_entity_id: entityId,
        p_payload: payload,
        p_live_status: intent === "publish" ? "published" : "draft",
      });
      if (error) return fail(error);
      const res = data as { entity_id: string; slug: string; old_slug: string | null };
      revalidateContent(type, [res.slug, res.old_slug]);
      return {
        ok: true,
        entityId: res.entity_id,
        revisionId: null,
        redirectTo: `/dashboard/content/${type}/${res.entity_id}`,
        message: intent === "publish" ? "تم النشر على الموقع" : "تم الحفظ كمسودة (غير ظاهرة للزوار)",
      };
    }

    // ---------------- محرر: إلى طابور المراجعة ----------------
    const status = intent === "submit" ? "pending_approval" : "draft";
    const note = String(input.note ?? "").slice(0, 1000);
    let savedId = revisionId;

    if (revisionId) {
      const { data, error } = await supabase
        .from("content_revisions")
        .update({ payload, title: payload.title, slug: payload.slug, status, submit_note: note })
        .eq("id", revisionId)
        .eq("submitted_by", profile.id)
        .in("status", ["draft", "pending_approval", "rejected"])
        .select("id")
        .maybeSingle();
      if (error) return fail(error);
      if (!data) return { ok: false, error: "لا يمكن تعديل هذا الطلب (ربما تمت مراجعته بالفعل)" };
    } else {
      const { data, error } = await supabase
        .from("content_revisions")
        .insert({
          entity_type: type,
          entity_id: entityId,
          action: entityId ? "update" : "create",
          status,
          title: payload.title,
          slug: payload.slug,
          payload,
          submit_note: note,
          submitted_by: profile.id,
        })
        .select("id")
        .single();
      if (error) return fail(error);
      savedId = data.id;
    }

    if (status === "pending_approval") {
      await notifyAdmins(
        profile,
        `طلب ${entityId ? "تعديل" : "إنشاء"} ${ENTITY_LABEL_AR[type]} بانتظار المراجعة`,
        `${profile.full_name || profile.email}: «${payload.title}»`,
        `/dashboard/admin/approvals/${savedId}`,
      );
    }
    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/admin/approvals");

    return {
      ok: true,
      entityId,
      revisionId: savedId,
      redirectTo: `/dashboard/content/revisions/${savedId}`,
      message:
        status === "pending_approval"
          ? "تم إرسال التغيير للمراجعة. لن يظهر على الموقع قبل اعتماد المدير."
          : "تم حفظ المسودة",
    };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------
// الحذف: المحرر يطلب، المدير ينفّذ
// ---------------------------------------------------------------------
export async function deleteContentAction(input: {
  entityType: EntityType;
  entityId: string;
  note?: string;
}): Promise<ActionResult<{ message: string; pending: boolean }>> {
  try {
    const profile = await assertRole(CONTENT_STAFF_ROLES);
    if (!isEntityType(input.entityType) || !input.entityId) return { ok: false, error: "طلب غير صالح" };
    const type = input.entityType;
    const supabase = await createClient();

    if (isContentAdmin(profile.role)) {
      const { data, error } = await supabase.rpc("cms_admin_delete", {
        p_entity_type: type,
        p_entity_id: String(input.entityId),
      });
      if (error) return fail(error);
      revalidateContent(type, [(data as { slug?: string })?.slug]);
      return { ok: true, pending: false, message: "تم الحذف نهائياً" };
    }

    const { data: live } = await supabase
      .from(ENTITY_TABLE[type])
      .select("title, slug")
      .eq("id", input.entityId)
      .maybeSingle();
    if (!live) return { ok: false, error: "المحتوى غير موجود" };

    const { data, error } = await supabase
      .from("content_revisions")
      .insert({
        entity_type: type,
        entity_id: String(input.entityId),
        action: "delete",
        status: "pending_approval",
        title: live.title ?? "",
        slug: live.slug ?? "",
        payload: {},
        submit_note: String(input.note ?? "").slice(0, 1000),
        submitted_by: profile.id,
      })
      .select("id")
      .single();
    if (error) return fail(error);

    await notifyAdmins(
      profile,
      `طلب حذف ${ENTITY_LABEL_AR[type]} بانتظار المراجعة`,
      `${profile.full_name || profile.email}: «${live.title}»`,
      `/dashboard/admin/approvals/${data.id}`,
    );
    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/admin/approvals");
    return { ok: true, pending: true, message: "تم إرسال طلب الحذف للمراجعة. المحتوى باقٍ على الموقع حتى يعتمده المدير." };
  } catch (err) {
    return fail(err);
  }
}

/** سحب طلب معلّق (يعود مسودة) أو حذف مسودة/طلب مرفوض — لصاحب الطلب فقط (RLS) */
export async function withdrawRevisionAction(
  revisionId: string,
  mode: "withdraw" | "discard",
): Promise<ActionResult<{ message: string }>> {
  try {
    const profile = await assertRole(CONTENT_STAFF_ROLES);
    const supabase = await createClient();

    const { data: rev } = await supabase
      .from("content_revisions")
      .select("id, action, status, submitted_by")
      .eq("id", revisionId)
      .maybeSingle();
    if (!rev || rev.submitted_by !== profile.id) return { ok: false, error: "الطلب غير موجود" };

    if (mode === "withdraw") {
      if (rev.status !== "pending_approval") return { ok: false, error: "هذا الطلب ليس بانتظار الموافقة" };
      const { error } = await supabase
        .from("content_revisions")
        .update({ status: "draft" })
        .eq("id", revisionId)
        .eq("status", "pending_approval");
      if (error) return fail(error);
      // طلب الحذف المسحوب لا معنى لبقائه كمسودة
      if (rev.action === "delete") {
        await supabase.from("content_revisions").delete().eq("id", revisionId);
      }
    } else {
      if (!["draft", "rejected"].includes(rev.status)) {
        return { ok: false, error: "اسحب الطلب أولاً قبل حذفه" };
      }
      const { error } = await supabase.from("content_revisions").delete().eq("id", revisionId);
      if (error) return fail(error);
    }

    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/admin/approvals");
    return { ok: true, message: mode === "withdraw" ? "تم سحب الطلب" : "تم حذف المسودة" };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------
// طابور الموافقات (admin / super_admin فقط — ويُعاد التحقق داخل قاعدة البيانات)
// ---------------------------------------------------------------------
export async function approveRevisionAction(input: {
  revisionId: string;
  note?: string;
  force?: boolean;
}): Promise<ActionResult<{ message: string; publicPath: string | null }>> {
  try {
    await assertRole(CONTENT_ADMIN_ROLES);
    const supabase = await createClient();

    // دفاع إضافي: المحرر يستطيع (نظرياً) الكتابة في طلبه مباشرة عبر واجهة Supabase متجاوزاً هذا الملف،
    // لذلك نعيد تنظيف المحتوى والتحقق منه لحظة الاعتماد قبل أن يصل إلى الموقع الحي.
    const { data: rev } = await supabase
      .from("content_revisions")
      .select("id, entity_type, entity_id, action, status, payload")
      .eq("id", input.revisionId)
      .maybeSingle();
    if (!rev) return { ok: false, error: "الطلب غير موجود" };
    if (rev.status !== "pending_approval") return { ok: false, error: "هذا الطلب ليس في انتظار الموافقة", code: "CMS_NOT_PENDING" };

    if (rev.action !== "delete" && isEntityType(rev.entity_type)) {
      const checked = prepare(rev.entity_type, rev.payload, true);
      if (!checked.ok) {
        return {
          ok: false,
          error: `لا يمكن اعتماد الطلب لأن المحتوى غير مكتمل: ${Object.values(checked.errors).join(" — ")}`,
          fieldErrors: checked.errors,
        };
      }
      if (await isSlugTaken(rev.entity_type, checked.payload.slug, rev.entity_id, rev.id)) {
        return { ok: false, error: "الرابط (Slug) في هذا الطلب أصبح مستخدماً. ارفض الطلب واطلب من المحرر تغييره.", code: "SLUG_TAKEN" };
      }
      const { error: cleanError } = await createAdminClient()
        .from("content_revisions")
        .update({ payload: checked.payload, title: checked.payload.title, slug: checked.payload.slug })
        .eq("id", rev.id)
        .eq("status", "pending_approval");
      if (cleanError) return fail(cleanError);
    }

    const { data, error } = await supabase.rpc("cms_approve_revision", {
      p_revision_id: input.revisionId,
      p_note: String(input.note ?? "").slice(0, 1000),
      p_force: !!input.force,
    });
    if (error) return fail(error);

    const res = data as {
      entity_type: EntityType;
      entity_id: string;
      action: string;
      slug: string | null;
      old_slug: string | null;
      submitted_by: string;
      title: string;
    };
    revalidateContent(res.entity_type, [res.slug, res.old_slug]);

    const deleted = res.action === "delete";
    await notifyUser(
      res.submitted_by,
      deleted ? "تم اعتماد طلب الحذف" : "تم اعتماد ونشر تغييرك",
      `«${res.title}»${input.note ? ` — ${input.note}` : ""}`,
      "/dashboard/content",
    );
    return {
      ok: true,
      message: deleted ? "تم اعتماد الحذف وإزالة المحتوى من الموقع" : "تم الاعتماد ونشر التغيير على الموقع",
      publicPath: deleted || !res.slug ? null : `${ENTITY_PUBLIC_BASE[res.entity_type]}/${res.slug}`,
    };
  } catch (err) {
    return fail(err);
  }
}

export async function rejectRevisionAction(input: {
  revisionId: string;
  note?: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    await assertRole(CONTENT_ADMIN_ROLES);
    const supabase = await createClient();
    const note = String(input.note ?? "").slice(0, 1000);
    const { data, error } = await supabase.rpc("cms_reject_revision", {
      p_revision_id: input.revisionId,
      p_note: note,
    });
    if (error) return fail(error);

    const res = data as { revision_id: string; submitted_by: string; title: string; action: string };
    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/admin/approvals");
    await notifyUser(
      res.submitted_by,
      "تم رفض طلبك",
      `«${res.title}»${note ? ` — ملاحظة المراجع: ${note}` : ""}`,
      res.action === "delete" ? "/dashboard/content" : `/dashboard/content/revisions/${res.revision_id}`,
    );
    return { ok: true, message: "تم رفض الطلب وإبلاغ المحرر" };
  } catch (err) {
    return fail(err);
  }
}

