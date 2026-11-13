"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ENTITY_LABEL_AR,
  ENTITY_PUBLIC_BASE,
  SEO_LIMITS,
  SLUG_RE,
  bodyField,
  type ArticlePayload,
  type ContentPayload,
  type ContentStatus,
  type CourseLevel,
  type CoursePayload,
  type EntityType,
  type FieldErrors,
  type RevisionAction,
} from "@/lib/cms/fields";
import { analyzeSeo, slugify } from "@/lib/cms/seo-analysis";
import { toEditorHtml } from "@/lib/cms/markdown";
import { articleSchema, courseLearningSchema } from "@/lib/schema";
import {
  checkSlugAction,
  deleteContentAction,
  saveContentAction,
  withdrawRevisionAction,
  type SaveIntent,
} from "@/lib/cms/actions";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import ImageUploader from "./ImageUploader";
import { ContentStats, SeoChecklist, SerpPreview, SocialPreview } from "./SeoPanels";
import { Card, CharCounter, Field, Notice, StatusBadge, btn, inputClass } from "./ui";

export interface WorkspaceProps {
  entityType: EntityType;
  /** معرّف المحتوى الحي (null = محتوى جديد) */
  entityId: string | null;
  /** معرّف الطلب/المسودة الجاري تحريرها (للمحرر) */
  revisionId: string | null;
  revisionStatus: ContentStatus | null;
  revisionAction: RevisionAction | null;
  reviewNote: string;
  submitNote: string;
  /** حالة المحتوى الحي إن وُجد */
  liveStatus: ContentStatus | null;
  liveSlug: string | null;
  /** يوجد طلب معلّق من محرر آخر على نفس المحتوى */
  lockedByOther: boolean;
  isAdmin: boolean;
  initial: ContentPayload;
  taxonomy: { categories: string[]; tags: string[] };
}

type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "invalid"; suggestion?: string }
  | { kind: "taken"; suggestion?: string };

const linesToArray = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export default function ContentWorkspace(props: WorkspaceProps) {
  const { entityType: type, entityId, revisionId, isAdmin, taxonomy } = props;
  const router = useRouter();
  const isArticle = type === "article";
  const label = ENTITY_LABEL_AR[type];
  const publicBase = ENTITY_PUBLIC_BASE[type];
  const bodyKey = bodyField(type);

  // المحتوى القديم (Markdown) يُحوَّل إلى HTML مرة واحدة عند الفتح
  const [form, setForm] = useState<ContentPayload>(() => {
    const init = { ...props.initial } as unknown as Record<string, unknown>;
    init[bodyKey] = toEditorHtml(String(init[bodyKey] ?? ""));
    return init as unknown as ContentPayload;
  });
  const [outcomesText, setOutcomesText] = useState(() =>
    isArticle ? "" : (props.initial as CoursePayload).learning_outcomes.join("\n"),
  );
  const [materialsText, setMaterialsText] = useState(() =>
    isArticle ? "" : (props.initial as CoursePayload).books_materials.join("\n"),
  );
  const [note, setNote] = useState(props.submitNote);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(entityId || revisionId || props.initial.slug));
  const [pending, startTransition] = useTransition();
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);

  const article = form as ArticlePayload;
  const course = form as CoursePayload;
  const body = String((form as unknown as Record<string, unknown>)[bodyKey] ?? "");

  const set = useCallback(<K extends string>(key: K, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }) as ContentPayload);
    setDirty(true);
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  // ---------------- الرابط: توليد تلقائي من العنوان + تعديل يدوي ----------------
  const onTitleChange = (value: string) => {
    set("title", value);
    if (!slugTouched) set("slug", slugify(value));
  };

  // نتيجة آخر فحص على السيرفر؛ الحالة المعروضة تُشتق منها ومن الرابط الحالي
  const [remoteSlug, setRemoteSlug] = useState<{ slug: string; state: SlugState } | null>(null);
  const slugNeedsCheck = Boolean(form.slug) && SLUG_RE.test(form.slug) && form.slug !== props.liveSlug;

  const slugState: SlugState = useMemo(() => {
    const slug = form.slug;
    if (!slug) return { kind: "idle" };
    if (!SLUG_RE.test(slug)) return { kind: "invalid", suggestion: slugify(slug) || undefined };
    if (props.liveSlug && slug === props.liveSlug) return { kind: "ok" }; // لم يتغير عن الرابط الحي
    if (remoteSlug?.slug === slug) return remoteSlug.state;
    return { kind: "checking" };
  }, [form.slug, props.liveSlug, remoteSlug]);

  useEffect(() => {
    if (!slugNeedsCheck) return;
    const slug = form.slug;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await checkSlugAction({ entityType: type, slug, entityId, revisionId });
      if (cancelled) return;
      const state: SlugState = !res.ok
        ? { kind: "idle" }
        : res.available
          ? { kind: "ok" }
          : { kind: res.valid ? "taken" : "invalid", suggestion: res.suggestion };
      setRemoteSlug({ slug, state });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.slug, slugNeedsCheck, type, entityId, revisionId]);

  // ---------------- تحليل SEO لحظي ----------------
  const report = useMemo(
    () =>
      analyzeSeo({
        title: form.title,
        slug: form.slug,
        metaTitle: form.meta_title,
        metaDescription: form.meta_description,
        focusKeyword: form.focus_keyword,
        body,
        coverImage: form.cover_image,
        coverImageAlt: form.cover_image_alt,
      }),
    [form.title, form.slug, form.meta_title, form.meta_description, form.focus_keyword, body, form.cover_image, form.cover_image_alt],
  );

  const publicPath = `${publicBase}/${form.slug || "your-slug"}`;
  const fallbackDescription = isArticle ? article.excerpt : course.summary || course.subtitle;
  const serpTitle = form.meta_title.trim() || (form.title ? `${form.title} | Fazakkir` : "");
  const serpDescription = form.meta_description.trim() || fallbackDescription;
  const socialTitle = form.og_title.trim() || serpTitle;
  const socialDescription = form.og_description.trim() || serpDescription;
  const socialImage = form.og_image || form.cover_image;

  const jsonLd = useMemo(() => {
    const data = isArticle
      ? articleSchema({
          slug: form.slug || "your-slug",
          title: form.title,
          description: serpDescription,
          image: form.cover_image || null,
          author: article.author,
          authorRole: article.author_role,
          category: form.categories[0] ?? null,
          tags: form.tags,
          wordCount: report.wordCount,
          canonicalUrl: form.canonical_url || null,
        })
      : courseLearningSchema({
          slug: form.slug || "your-slug",
          title: form.title,
          description: serpDescription,
          image: form.cover_image || null,
          category: form.categories[0] ?? null,
          tags: form.tags,
          badge: course.badge,
          prerequisites: course.prerequisites,
          outcomes: linesToArray(outcomesText),
          levels: course.levels,
          canonicalUrl: form.canonical_url || null,
        });
    return JSON.stringify(data, null, 2);
  }, [isArticle, form, article.author, article.author_role, course.badge, course.prerequisites, course.levels, outcomesText, report.wordCount, serpDescription]);

  // تحذير عند مغادرة الصفحة بتغييرات غير محفوظة
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ---------------- الحفظ ----------------
  const buildPayload = (): ContentPayload => {
    if (isArticle) return form;
    return {
      ...course,
      learning_outcomes: linesToArray(outcomesText),
      books_materials: linesToArray(materialsText),
      levels: course.levels.filter((l) => l.title.trim() || l.description.trim()),
    };
  };

  const save = (intent: SaveIntent, opts?: { confirm?: string }) => {
    if (opts?.confirm && !window.confirm(opts.confirm)) return;
    setBanner(null);
    setPendingIntent(intent);
    startTransition(async () => {
      const res = await saveContentAction({
        entityType: type,
        entityId,
        revisionId,
        intent,
        payload: buildPayload(),
        note,
      });
      setPendingIntent(null);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setBanner({ tone: "error", text: res.error });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors({});
      setDirty(false);
      setBanner({ tone: "success", text: res.message });
      window.scrollTo({ top: 0, behavior: "smooth" });
      const here = window.location.pathname;
      if (res.redirectTo !== here) router.replace(res.redirectTo);
      else router.refresh();
    });
  };

  const withdraw = (mode: "withdraw" | "discard") => {
    if (!revisionId) return;
    const msg = mode === "withdraw" ? "سحب الطلب من طابور المراجعة وإعادته مسودة؟" : "حذف هذه المسودة نهائياً؟";
    if (!window.confirm(msg)) return;
    setPendingIntent(mode);
    startTransition(async () => {
      const res = await withdrawRevisionAction(revisionId, mode);
      setPendingIntent(null);
      if (!res.ok) {
        setBanner({ tone: "error", text: res.error });
        return;
      }
      setDirty(false);
      if (mode === "discard") router.replace("/dashboard/content");
      else {
        setBanner({ tone: "success", text: res.message });
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!entityId) return;
    const msg = isAdmin
      ? `حذف هذا ال${label} نهائياً من الموقع؟ لا يمكن التراجع عن هذا الإجراء.`
      : `إرسال طلب حذف هذا ال${label} إلى المدير؟ سيبقى على الموقع حتى يُعتمد الطلب.`;
    if (!window.confirm(msg)) return;
    setPendingIntent("delete");
    startTransition(async () => {
      const res = await deleteContentAction({ entityType: type, entityId, note });
      setPendingIntent(null);
      if (!res.ok) {
        setBanner({ tone: "error", text: res.error });
        return;
      }
      setDirty(false);
      router.replace("/dashboard/content");
    });
  };

  const errorCount = Object.keys(errors).length;
  const revStatus = props.revisionStatus;
  const isLivePublished = props.liveStatus === "published";
  const busy = (k: string) => pending && pendingIntent === k;

  const updateLevel = (index: number, patch: Partial<CourseLevel>) =>
    set(
      "levels",
      course.levels.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );

  return (
    <div dir="rtl" className="text-right">
      {/* رأس الصفحة */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/content" className="text-xs font-bold text-emerald-800 hover:underline">
            → العودة إلى المحتوى
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            {entityId ? `تعديل ${label}` : `${label} جديد`}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {props.liveStatus && (
              <span className="flex items-center gap-1.5">
                على الموقع: <StatusBadge status={props.liveStatus} />
              </span>
            )}
            {revStatus && (
              <span className="flex items-center gap-1.5">
                طلبك: <StatusBadge status={revStatus} />
              </span>
            )}
            {isLivePublished && props.liveSlug && (
              <a
                href={`${publicBase}/${props.liveSlug}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-800 hover:underline"
              >
                عرض الصفحة الحية ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mb-5 space-y-3">
        {banner && <Notice tone={banner.tone}>{banner.text}</Notice>}
        {errorCount > 0 && (
          <Notice tone="error">
            <strong>يوجد {errorCount} حقل يحتاج تصحيحاً:</strong>
            <ul className="mt-1 list-inside list-disc">
              {Object.entries(errors).map(([k, v]) => (
                <li key={k}>{v}</li>
              ))}
            </ul>
          </Notice>
        )}
        {!isAdmin && revStatus !== "pending_approval" && revStatus !== "rejected" && (
          <Notice tone="info">
            أنت تعمل بصلاحية <strong>محرر</strong>: ما تحفظه هنا لا يظهر على الموقع. عند الضغط على «إرسال للمراجعة» ينتقل التغيير إلى
            المدير، ولا يُنشر إلا بعد اعتماده.
          </Notice>
        )}
        {revStatus === "pending_approval" && (
          <Notice tone="warn">
            هذا الطلب <strong>بانتظار موافقة المدير</strong>. يمكنك تحديثه أو سحبه ما دام لم يُراجع.
          </Notice>
        )}
        {revStatus === "rejected" && (
          <Notice tone="error">
            <strong>رُفض هذا الطلب.</strong>
            {props.reviewNote ? (
              <>
                {" "}
                ملاحظة المراجع: <span dir="auto">«{props.reviewNote}»</span>
              </>
            ) : null}{" "}
            عدّل المحتوى ثم أعد إرساله للمراجعة.
          </Notice>
        )}
        {props.lockedByOther && (
          <Notice tone="warn">
            يوجد طلب آخر بانتظار الموافقة على هذا المحتوى. يمكنك حفظ مسودة، لكن لن تستطيع الإرسال للمراجعة حتى يُبتّ في الطلب
            الحالي.
          </Notice>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ============================ العمود الرئيسي ============================ */}
        <div className="min-w-0 space-y-5 lg:col-span-8">
          <Card title="المحتوى الأساسي">
            <div className="space-y-4">
              <Field label="العنوان (H1)" htmlFor="cms-title" required error={errors.title} hint="عنوان الصفحة هو عنوان H1 الوحيد.">
                <input
                  id="cms-title"
                  dir="auto"
                  value={form.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder={isArticle ? "5 Common Mistakes in Quran Recitation" : "Noorani Qaida for Kids"}
                  className={clsx(inputClass, "text-base font-bold", errors.title && "border-rose-400")}
                />
              </Field>

              <Field
                label="الرابط (URL Slug)"
                htmlFor="cms-slug"
                required
                error={errors.slug}
                hint={
                  <span aria-live="polite">
                    {slugState.kind === "checking" && "جارٍ التحقق من توفر الرابط…"}
                    {slugState.kind === "ok" && <span className="font-semibold text-emerald-700">الرابط متاح.</span>}
                    {slugState.kind === "idle" && "يُولَّد تلقائياً من العنوان، ويمكنك تعديله يدوياً."}
                    {(slugState.kind === "taken" || slugState.kind === "invalid") && (
                      <span className="font-semibold text-rose-600">
                        {slugState.kind === "taken"
                          ? "هذا الرابط مستخدم بالفعل."
                          : "أحرف إنجليزية صغيرة وأرقام وشرطات فقط."}
                        {slugState.suggestion && (
                          <>
                            {" "}
                            <button
                              type="button"
                              className="underline"
                              onClick={() => {
                                set("slug", slugState.suggestion);
                                setSlugTouched(true);
                              }}
                            >
                              استخدم <span dir="ltr">{slugState.suggestion}</span>
                            </button>
                          </>
                        )}
                      </span>
                    )}
                  </span>
                }
              >
                <div
                  dir="ltr"
                  className={clsx(
                    "flex items-stretch overflow-hidden rounded-xl border bg-white transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15",
                    errors.slug || slugState.kind === "taken" || slugState.kind === "invalid" ? "border-rose-400" : "border-slate-300",
                  )}
                >
                  <span className="hidden items-center border-r border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-500 sm:flex">
                    fazakkir.com{publicBase}/
                  </span>
                  <input
                    id="cms-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    spellCheck={false}
                    className="min-w-0 flex-1 px-3 py-2.5 font-mono text-sm outline-none"
                  />
                  {slugTouched && !entityId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlugTouched(false);
                        set("slug", slugify(form.title));
                      }}
                      className="border-l border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      title="إعادة التوليد من العنوان"
                    >
                      ↻
                    </button>
                  )}
                </div>
              </Field>
              {isLivePublished && props.liveSlug && form.slug !== props.liveSlug && (
                <Notice tone="warn">
                  تغيير رابط صفحة منشورة يكسر الروابط القديمة ونتائج البحث الحالية. غيّره فقط عند الضرورة.
                </Notice>
              )}

              {isArticle ? (
                <Field label="المقتطف" htmlFor="cms-excerpt" required error={errors.excerpt} hint="يظهر في بطاقة المقال بصفحة المدونة.">
                  <textarea
                    id="cms-excerpt"
                    dir="auto"
                    rows={2}
                    value={article.excerpt}
                    onChange={(e) => set("excerpt", e.target.value)}
                    className={clsx(inputClass, errors.excerpt && "border-rose-400")}
                  />
                </Field>
              ) : (
                <>
                  <Field label="العنوان الفرعي" htmlFor="cms-subtitle" error={errors.subtitle}>
                    <input
                      id="cms-subtitle"
                      dir="auto"
                      value={course.subtitle}
                      onChange={(e) => set("subtitle", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="ملخص الكورس (Course Overview)" htmlFor="cms-summary" required error={errors.summary}>
                    <textarea
                      id="cms-summary"
                      dir="auto"
                      rows={4}
                      value={course.summary}
                      onChange={(e) => set("summary", e.target.value)}
                      className={clsx(inputClass, errors.summary && "border-rose-400")}
                    />
                  </Field>
                </>
              )}
            </div>
          </Card>

          <Card
            title={isArticle ? "نص المقال" : "وصف تفصيلي للكورس (اختياري)"}
            description="العناوين المتاحة H2 و H3 و H4 فقط — H1 محجوز لعنوان الصفحة. لا تتخطَّ المستويات (H2 ثم H3 ثم H4)."
          >
            <RichTextEditor
              value={body}
              onChange={(html) => set(bodyKey, html)}
              folder={isArticle ? "articles" : "courses"}
              ariaLabel={isArticle ? "نص المقال" : "وصف الكورس"}
            />
            {errors[bodyKey] && (
              <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
                {errors[bodyKey]}
              </p>
            )}
            <div className="mt-4">
              <ContentStats report={report} />
            </div>
          </Card>

          {isArticle ? (
            <Card title="الكاتب">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="اسم الكاتب" htmlFor="cms-author">
                  <input id="cms-author" dir="auto" value={article.author} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </Field>
                <Field label="الصفة العلمية" htmlFor="cms-author-role">
                  <input
                    id="cms-author-role"
                    dir="auto"
                    value={article.author_role}
                    onChange={(e) => set("author_role", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Card>
          ) : (
            <Card title="تفاصيل الكورس">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="الشارة (Badge)" htmlFor="cms-badge" hint="مثال: Beginner • Ages 5+">
                    <input id="cms-badge" dir="auto" value={course.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="الأيقونة (Font Awesome)" htmlFor="cms-icon" error={errors.icon}>
                    <div className="flex items-center gap-2">
                      <input
                        id="cms-icon"
                        dir="ltr"
                        value={course.icon}
                        onChange={(e) => set("icon", e.target.value)}
                        className={clsx(inputClass, "font-mono text-xs")}
                      />
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <i className={`fa-solid ${course.icon}`} aria-hidden />
                      </span>
                    </div>
                  </Field>
                  <Field label="المدة" htmlFor="cms-duration">
                    <input id="cms-duration" dir="auto" value={course.duration} onChange={(e) => set("duration", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="المتطلبات السابقة" htmlFor="cms-prereq">
                    <input
                      id="cms-prereq"
                      dir="auto"
                      value={course.prerequisites}
                      onChange={(e) => set("prerequisites", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">مستويات المنهج (Curriculum Roadmap)</span>
                    <button
                      type="button"
                      className="text-xs font-bold text-emerald-800 hover:underline"
                      onClick={() =>
                        set("levels", [...course.levels, { level: `Level ${course.levels.length + 1}`, title: "", description: "" }])
                      }
                    >
                      + إضافة مستوى
                    </button>
                  </div>
                  <div className="space-y-2">
                    {course.levels.map((lvl, i) => (
                      <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12">
                        <input
                          dir="auto"
                          aria-label={`اسم المستوى ${i + 1}`}
                          value={lvl.level}
                          onChange={(e) => updateLevel(i, { level: e.target.value })}
                          className={clsx(inputClass, "sm:col-span-3")}
                        />
                        <input
                          dir="auto"
                          aria-label={`عنوان المستوى ${i + 1}`}
                          placeholder="عنوان المستوى"
                          value={lvl.title}
                          onChange={(e) => updateLevel(i, { title: e.target.value })}
                          className={clsx(inputClass, "sm:col-span-8")}
                        />
                        <button
                          type="button"
                          aria-label={`حذف المستوى ${i + 1}`}
                          onClick={() => set("levels", course.levels.filter((_, x) => x !== i))}
                          className="rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 sm:col-span-1"
                        >
                          ×
                        </button>
                        <textarea
                          dir="auto"
                          rows={2}
                          aria-label={`وصف المستوى ${i + 1}`}
                          placeholder="وصف المستوى"
                          value={lvl.description}
                          onChange={(e) => updateLevel(i, { description: e.target.value })}
                          className={clsx(inputClass, "sm:col-span-12")}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="مخرجات التعلم" htmlFor="cms-outcomes" hint="سطر لكل مخرج — تدخل في مخطط Course (teaches).">
                    <textarea
                      id="cms-outcomes"
                      dir="auto"
                      rows={5}
                      value={outcomesText}
                      onChange={(e) => {
                        setOutcomesText(e.target.value);
                        setDirty(true);
                      }}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="الكتب والمواد" htmlFor="cms-materials" hint="سطر لكل كتاب أو مادة.">
                    <textarea
                      id="cms-materials"
                      dir="auto"
                      rows={5}
                      value={materialsText}
                      onChange={(e) => {
                        setMaterialsText(e.target.value);
                        setDirty(true);
                      }}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </Card>
          )}

          <Card title="محركات البحث (SEO)" description="هذه الحقول تتحكم في ظهور الصفحة ضمن نتائج Google.">
            <div className="space-y-4">
              <Field
                label="الكلمة المفتاحية المستهدفة (Focus Keyword)"
                htmlFor="cms-keyword"
                hint="كلمة أو عبارة واحدة تريد أن تتصدر بها هذه الصفحة. تُستخدم في قائمة الفحص فقط ولا تظهر للزوار."
              >
                <input
                  id="cms-keyword"
                  dir="auto"
                  value={form.focus_keyword}
                  onChange={(e) => set("focus_keyword", e.target.value)}
                  placeholder="quran classes for kids"
                  className={inputClass}
                />
              </Field>

              <Field
                label="عنوان الميتا (Meta Title)"
                htmlFor="cms-meta-title"
                error={errors.meta_title}
                counter={<CharCounter value={form.meta_title} min={SEO_LIMITS.metaTitle.min} max={SEO_LIMITS.metaTitle.max} />}
                hint={
                  <>
                    المستهدف 50–60 حرفاً. يُعرض كما هو تماماً في نتائج البحث.{" "}
                    {!form.meta_title && form.title && (
                      <button type="button" className="font-bold text-emerald-800 underline" onClick={() => set("meta_title", form.title.slice(0, 60))}>
                        انسخ العنوان
                      </button>
                    )}
                  </>
                }
              >
                <input
                  id="cms-meta-title"
                  dir="auto"
                  value={form.meta_title}
                  maxLength={SEO_LIMITS.metaTitle.hardMax}
                  onChange={(e) => set("meta_title", e.target.value)}
                  className={clsx(inputClass, errors.meta_title && "border-rose-400")}
                />
              </Field>

              <Field
                label="وصف الميتا (Meta Description)"
                htmlFor="cms-meta-desc"
                error={errors.meta_description}
                counter={
                  <CharCounter value={form.meta_description} min={SEO_LIMITS.metaDescription.min} max={SEO_LIMITS.metaDescription.max} />
                }
                hint="المستهدف 150–160 حرفاً: صِف فائدة الصفحة وادعُ القارئ للنقر."
              >
                <textarea
                  id="cms-meta-desc"
                  dir="auto"
                  rows={3}
                  value={form.meta_description}
                  maxLength={SEO_LIMITS.metaDescription.hardMax}
                  onChange={(e) => set("meta_description", e.target.value)}
                  className={clsx(inputClass, errors.meta_description && "border-rose-400")}
                />
              </Field>

              <div>
                <div className="mb-1.5 text-xs font-bold text-slate-700">معاينة نتيجة Google</div>
                <SerpPreview title={serpTitle} description={serpDescription} path={publicPath} />
              </div>
            </div>
          </Card>

          <Card title="الصورة البارزة" description="تُحوَّل تلقائياً إلى WebP لتحسين سرعة التحميل (Core Web Vitals).">
            <div className="space-y-4">
              <ImageUploader
                value={form.cover_image}
                onChange={(url) => set("cover_image", url)}
                folder={isArticle ? "articles" : "courses"}
                label="الصورة البارزة"
                alt={form.cover_image_alt}
              />
              {errors.cover_image && <p className="text-xs font-semibold text-rose-600">{errors.cover_image}</p>}
              <Field
                label="النص البديل (Alt Text)"
                htmlFor="cms-alt"
                required={Boolean(form.cover_image)}
                error={errors.cover_image_alt || (form.cover_image && !form.cover_image_alt.trim() ? "النص البديل إلزامي ما دامت هناك صورة" : undefined)}
                hint="صِف ما في الصورة بجملة قصيرة — مهم لقارئات الشاشة ولبحث الصور."
              >
                <input
                  id="cms-alt"
                  dir="auto"
                  value={form.cover_image_alt}
                  onChange={(e) => set("cover_image_alt", e.target.value)}
                  placeholder="A child reciting Quran with an online tutor"
                  className={clsx(inputClass, (errors.cover_image_alt || (form.cover_image && !form.cover_image_alt.trim())) && "border-rose-400")}
                />
              </Field>
            </div>
          </Card>

          <Card
            title="المشاركة الاجتماعية (Open Graph و Twitter Card)"
            description="اتركها فارغة لاستخدام عنوان ووصف الميتا والصورة البارزة تلقائياً."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <Field label="OG Title" htmlFor="cms-og-title" error={errors.og_title}>
                  <input
                    id="cms-og-title"
                    dir="auto"
                    value={form.og_title}
                    onChange={(e) => set("og_title", e.target.value)}
                    placeholder={serpTitle}
                    className={inputClass}
                  />
                </Field>
                <Field label="OG Description" htmlFor="cms-og-desc" error={errors.og_description}>
                  <textarea
                    id="cms-og-desc"
                    dir="auto"
                    rows={3}
                    value={form.og_description}
                    onChange={(e) => set("og_description", e.target.value)}
                    placeholder={serpDescription}
                    className={inputClass}
                  />
                </Field>
                <div>
                  <div className="mb-1.5 text-xs font-bold text-slate-700">OG Image (1200×630)</div>
                  <ImageUploader value={form.og_image} onChange={(url) => set("og_image", url)} folder="social" label="صورة المشاركة" />
                  {errors.og_image && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.og_image}</p>}
                </div>
              </div>
              <SocialPreview title={socialTitle} description={socialDescription} image={socialImage} />
            </div>
          </Card>

          <Card title="إعدادات متقدمة">
            <div className="space-y-4">
              <Field
                label="الرابط الأساسي (Canonical URL)"
                htmlFor="cms-canonical"
                error={errors.canonical_url}
                hint={
                  <>
                    اتركه فارغاً ليشير إلى الصفحة نفسها (<span dir="ltr">{publicPath}</span>). استخدمه فقط إذا كان المحتوى منسوخاً من صفحة
                    أخرى.
                  </>
                }
              >
                <input
                  id="cms-canonical"
                  dir="ltr"
                  value={form.canonical_url}
                  onChange={(e) => set("canonical_url", e.target.value.trim())}
                  placeholder={`https://www.fazakkir.com${publicPath}`}
                  className={clsx(inputClass, "font-mono text-xs", errors.canonical_url && "border-rose-400")}
                />
              </Field>

              <fieldset>
                <legend className="mb-2 text-xs font-bold text-slate-700">توجيهات الروبوتات (Robots Meta)</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["robots_index", "index", "noindex", "السماح بالأرشفة في نتائج البحث"],
                      ["robots_follow", "follow", "nofollow", "السماح بتتبع الروابط داخل الصفحة"],
                    ] as const
                  ).map(([key, on, off, desc]) => {
                    const checked = form[key];
                    return (
                      <label
                        key={key}
                        className={clsx(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition",
                          checked ? "border-emerald-200 bg-emerald-50/60" : "border-amber-300 bg-amber-50",
                        )}
                      >
                        <span>
                          <span dir="ltr" className="block font-mono text-sm font-bold text-slate-900">
                            {checked ? on : off}
                          </span>
                          <span className="block text-xs text-slate-600">{desc}</span>
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={checked}
                          onChange={(e) => set(key, e.target.checked)}
                          className="h-5 w-5 accent-emerald-700"
                        />
                      </label>
                    );
                  })}
                </div>
                {!form.robots_index && (
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    تنبيه: مع noindex لن تظهر هذه الصفحة في Google وستُستبعد من خريطة الموقع.
                  </p>
                )}
              </fieldset>

              <details className="rounded-xl border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-700">
                  البيانات المنظمة JSON-LD ({isArticle ? "Article" : "Course + LearningResource"}) — تُولَّد تلقائياً
                </summary>
                <pre dir="ltr" className="max-h-80 overflow-auto border-t border-slate-200 p-4 text-left text-xs leading-relaxed text-slate-700">
                  {jsonLd}
                </pre>
              </details>
            </div>
          </Card>
        </div>

        {/* ============================ العمود الجانبي ============================ */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:col-span-4">
          <Card title={isAdmin ? "النشر" : "الحفظ والمراجعة"}>
            <div className="space-y-3">
              {!isAdmin && (
                <Field label="ملاحظة للمراجع (اختياري)" htmlFor="cms-note">
                  <textarea
                    id="cms-note"
                    dir="auto"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ما الذي تغيّر ولماذا؟"
                    className={inputClass}
                  />
                </Field>
              )}

              {isAdmin ? (
                <>
                  <button type="button" disabled={pending} onClick={() => save("publish")} className={clsx(btn.primary, "w-full")}>
                    {busy("publish") ? "جارٍ النشر…" : isLivePublished ? "تحديث المنشور" : "نشر الآن"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      save("draft", isLivePublished ? { confirm: "سيُخفى هذا المحتوى عن الزوار ويتحول إلى مسودة. متابعة؟" } : undefined)
                    }
                    className={clsx(btn.secondary, "w-full")}
                  >
                    {busy("draft") ? "جارٍ الحفظ…" : isLivePublished ? "إلغاء النشر (تحويل إلى مسودة)" : "حفظ كمسودة"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={pending || props.lockedByOther}
                    onClick={() => save("submit")}
                    className={clsx(btn.primary, "w-full")}
                  >
                    {busy("submit") ? "جارٍ الإرسال…" : revStatus === "pending_approval" ? "تحديث الطلب المرسل" : "إرسال للمراجعة"}
                  </button>
                  {revStatus !== "pending_approval" && (
                    <button type="button" disabled={pending} onClick={() => save("draft")} className={clsx(btn.secondary, "w-full")}>
                      {busy("draft") ? "جارٍ الحفظ…" : "حفظ كمسودة"}
                    </button>
                  )}
                  {revStatus === "pending_approval" && (
                    <button type="button" disabled={pending} onClick={() => withdraw("withdraw")} className={clsx(btn.secondary, "w-full")}>
                      {busy("withdraw") ? "جارٍ السحب…" : "سحب الطلب"}
                    </button>
                  )}
                  {revisionId && (revStatus === "draft" || revStatus === "rejected") && (
                    <button type="button" disabled={pending} onClick={() => withdraw("discard")} className={clsx(btn.danger, "w-full")}>
                      حذف هذه المسودة
                    </button>
                  )}
                </>
              )}

              {entityId && (
                <button type="button" disabled={pending} onClick={remove} className={clsx(btn.danger, "w-full")}>
                  {busy("delete") ? "…" : isAdmin ? `حذف ال${label} نهائياً` : `طلب حذف ال${label}`}
                </button>
              )}

              <p className="text-xs text-slate-500" aria-live="polite">
                {dirty ? "توجد تغييرات غير محفوظة." : "لا توجد تغييرات غير محفوظة."}
              </p>
            </div>
          </Card>

          <Card>
            <SeoChecklist report={report} keyword={form.focus_keyword} />
          </Card>

          <Card title="التصنيف">
            <div className="space-y-4">
              <Field label="التصنيفات" required error={errors.categories} hint="الأول هو التصنيف الرئيسي الظاهر في الصفحة.">
                <TagInput
                  ariaLabel="التصنيفات"
                  value={form.categories}
                  onChange={(v) => set("categories", v)}
                  suggestions={taxonomy.categories}
                  placeholder="اختر أو اكتب تصنيفاً ثم Enter"
                  max={6}
                  invalid={Boolean(errors.categories)}
                />
              </Field>
              <Field label="الوسوم (Tags)" error={errors.tags}>
                <TagInput
                  ariaLabel="الوسوم"
                  value={form.tags}
                  onChange={(v) => set("tags", v)}
                  suggestions={taxonomy.tags}
                  placeholder="اكتب وسماً ثم Enter"
                />
              </Field>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
