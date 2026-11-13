import Link from "next/link";
import clsx from "clsx";
import {
  ARTICLE_FIELDS,
  COURSE_FIELDS,
  ENTITY_LABEL_AR,
  ENTITY_PUBLIC_BASE,
  bodyField,
  toPayload,
  type ContentPayload,
} from "@/lib/cms/fields";
import { DERIVED_FIELDS, FIELD_LABEL_AR, IMAGE_FIELDS, LONG_TEXT_FIELDS } from "@/lib/cms/labels";
import { changedFields, diffLongText, diffWords, type DiffPart, type FieldChange } from "@/lib/cms/diff";
import { analyzeSeo } from "@/lib/cms/seo-analysis";
import { sanitizeContentHtml } from "@/lib/cms/sanitize";
import type { PersonName, RevisionRow } from "@/lib/cms/queries";
import ReviewActions from "./ReviewActions";
import { SeoChecklist, SerpPreview } from "./SeoPanels";
import { ActionBadge, Card, Notice, StatusBadge, formatDate } from "./ui";

function Parts({ parts }: { parts: DiffPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.op === "same" ? (
          <span key={i}>{p.text}</span>
        ) : p.op === "add" ? (
          <ins key={i} className="rounded bg-emerald-100 px-0.5 text-emerald-900 no-underline">
            {p.text}
          </ins>
        ) : (
          <del key={i} className="rounded bg-rose-100 px-0.5 text-rose-800">
            {p.text}
          </del>
        ),
      )}
    </>
  );
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        v && typeof v === "object"
          ? [(v as Record<string, unknown>).level, (v as Record<string, unknown>).title, (v as Record<string, unknown>).description]
              .filter(Boolean)
              .join(" — ")
          : String(v),
      )
      .join("\n");
  }
  return String(value);
}

function FieldDiff({ change, isCreate }: { change: FieldChange; isCreate: boolean }) {
  const label = FIELD_LABEL_AR[change.key] ?? change.key;
  const before = display(change.before);
  const after = display(change.after);

  let content: React.ReactNode;
  if (LONG_TEXT_FIELDS.has(change.key)) {
    const lines = diffLongText(before, after).filter((l) => isCreate || l.op !== "same");
    content =
      lines.length === 0 ? (
        <p className="text-xs text-slate-500">تغيّر التنسيق فقط (النص كما هو).</p>
      ) : (
        <div dir="auto" className="max-h-[520px] space-y-1.5 overflow-auto text-start text-sm leading-relaxed">
          {lines.map((l, i) => (
            <p
              key={i}
              className={clsx(
                "rounded-lg border-s-4 px-3 py-1.5",
                l.op === "add" && "border-emerald-500 bg-emerald-50 text-emerald-950",
                l.op === "del" && "border-rose-500 bg-rose-50 text-rose-900 line-through decoration-rose-300",
                l.op === "change" && "border-amber-500 bg-amber-50/60 text-slate-800",
                l.op === "same" && "border-transparent text-slate-700",
              )}
            >
              {l.op === "change" && l.parts ? <Parts parts={l.parts} /> : (l.after ?? l.before)}
            </p>
          ))}
        </div>
      );
  } else if (IMAGE_FIELDS.has(change.key)) {
    content = (
      <div className="grid grid-cols-2 gap-3">
        {[
          ["قبل", before],
          ["بعد", after],
        ].map(([cap, src]) => (
          <figure key={cap}>
            <figcaption className="mb-1 text-xs font-bold text-slate-500">{cap}</figcaption>
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-slate-100">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">لا توجد صورة</span>
              )}
            </div>
          </figure>
        ))}
      </div>
    );
  } else if (isCreate) {
    content = (
      <p dir="auto" className="whitespace-pre-wrap text-start text-sm leading-relaxed text-slate-800">
        {after || <span className="text-slate-400">(فارغ)</span>}
      </p>
    );
  } else {
    content = (
      <p dir="auto" className="whitespace-pre-wrap text-start text-sm leading-relaxed text-slate-800">
        <Parts parts={diffWords(before, after)} />
      </p>
    );
  }

  return (
    <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <h3 className="mb-2 text-xs font-extrabold text-slate-500">{label}</h3>
      {content}
    </div>
  );
}

/** عرض طلب للمراجعة: الفروقات + المعاينة + القرار (Server Component) */
export default function ReviewView({
  rev,
  live,
  names,
}: {
  rev: RevisionRow;
  /** المحتوى الحي الحالي (للطلبات المعلّقة) */
  live: Record<string, unknown> | null;
  names: Record<string, PersonName>;
}) {
  const type = rev.entity_type;
  const isPending = rev.status === "pending_approval";
  const isDelete = rev.action === "delete";
  const isCreate = rev.action === "create";

  // أثناء الانتظار نقارن بالمحتوى الحي الحالي؛ بعد المراجعة نقارن بالنسخة المحفوظة لحظة الطلب
  const baseRow = live ?? rev.base_snapshot;
  const base = baseRow ? (toPayload(type, baseRow) as unknown as Record<string, unknown>) : null;
  const proposed = toPayload(type, rev.payload) as unknown as Record<string, unknown>;
  const proposedPayload = proposed as unknown as ContentPayload;

  const stale =
    isPending &&
    rev.action === "update" &&
    !!live?.updated_at &&
    !!rev.base_updated_at &&
    new Date(String(live.updated_at)).getTime() > new Date(rev.base_updated_at).getTime();

  const keys = (type === "article" ? ARTICLE_FIELDS : COURSE_FIELDS).filter((k) => !DERIVED_FIELDS.has(k)) as string[];
  const changes = isDelete
    ? []
    : changedFields(isCreate ? null : base, proposed, keys).filter(
        (c) => !isCreate || (display(c.after) !== "" && c.key !== "word_count" && c.key !== "reading_time"),
      );

  const who = (uid?: string | null) => (uid && names[uid] ? names[uid].full_name || names[uid].email : "—");

  const bodyKey = bodyField(type);
  const previewHtml = isDelete ? "" : sanitizeContentHtml(String(proposed[bodyKey] ?? ""));
  const report = analyzeSeo({
    title: proposedPayload.title,
    slug: proposedPayload.slug,
    metaTitle: proposedPayload.meta_title,
    metaDescription: proposedPayload.meta_description,
    focusKeyword: proposedPayload.focus_keyword,
    body: previewHtml,
    coverImage: proposedPayload.cover_image,
    coverImageAlt: proposedPayload.cover_image_alt,
  });
  const publicPath = `${ENTITY_PUBLIC_BASE[type]}/${isDelete ? rev.slug : proposedPayload.slug}`;

  return (
    <div dir="rtl" className="text-right">
      <div className="mb-5">
        <Link href="/dashboard/admin/approvals" className="text-xs font-bold text-emerald-800 hover:underline">
          → العودة إلى طابور الموافقات
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ActionBadge action={rev.action} />
          <span className="text-xs font-bold text-slate-500">{ENTITY_LABEL_AR[type]}</span>
          <StatusBadge status={rev.status} />
          {rev.direct && <span className="text-xs font-bold text-slate-400">(تغيير مباشر من مدير)</span>}
        </div>
        <h1 dir="auto" className="mt-2 text-2xl font-black text-slate-900">
          {rev.title || "(بدون عنوان)"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {who(rev.submitted_by)} · أُرسل {formatDate(rev.submitted_at)}
          {rev.reviewed_at && (
            <>
              {" "}
              · رُوجع {formatDate(rev.reviewed_at)} بواسطة {who(rev.reviewed_by)}
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="min-w-0 space-y-5 lg:col-span-8">
          {rev.submit_note && (
            <Notice tone="info">
              <strong>ملاحظة المحرر:</strong> <span dir="auto">{rev.submit_note}</span>
            </Notice>
          )}
          {rev.review_note && !isPending && (
            <Notice tone={rev.status === "rejected" ? "error" : "success"}>
              <strong>ملاحظة المراجع:</strong> <span dir="auto">{rev.review_note}</span>
            </Notice>
          )}

          {isDelete ? (
            <Card title="طلب حذف">
              <Notice tone="warn">
                يطلب المحرر حذف ال{ENTITY_LABEL_AR[type]} <strong dir="auto">«{rev.title}»</strong> من الموقع نهائياً. المحتوى ما زال
                منشوراً ولن يُحذف إلا إذا اعتمدت الطلب.
              </Notice>
              {isPending && (
                <a
                  href={publicPath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-bold text-emerald-800 hover:underline"
                >
                  عرض الصفحة الحالية على الموقع ↗
                </a>
              )}
            </Card>
          ) : (
            <>
              <Card
                title={isCreate ? "المحتوى المقترح" : `الفروقات (${changes.length} حقل)`}
                description={
                  isCreate
                    ? "محتوى جديد لم يُنشر من قبل."
                    : "الأخضر مُضاف، والأحمر المشطوب محذوف، مقارنةً بالنسخة المنشورة حالياً."
                }
              >
                {changes.length === 0 ? (
                  <p className="text-sm text-slate-500">لا توجد فروقات عن النسخة الحية.</p>
                ) : (
                  changes.map((c) => <FieldDiff key={c.key} change={c} isCreate={isCreate} />)
                )}
              </Card>

              <Card title="معاينة كما ستظهر للزائر">
                <div className="space-y-5">
                  <SerpPreview
                    title={proposedPayload.meta_title || `${proposedPayload.title} | Fazakkir`}
                    description={proposedPayload.meta_description}
                    path={publicPath}
                  />
                  <article dir="auto" className="rounded-2xl border border-slate-200 p-5 text-start sm:p-8">
                    {proposedPayload.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={proposedPayload.cover_image}
                        alt={proposedPayload.cover_image_alt}
                        className="mb-6 aspect-video w-full rounded-2xl object-cover"
                      />
                    )}
                    <h2 className="mb-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">{proposedPayload.title}</h2>
                    {previewHtml ? (
                      <div
                        className="prose prose-slate max-w-none prose-headings:font-extrabold prose-h3:text-emerald-900 prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50 prose-blockquote:not-italic prose-img:rounded-2xl"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    ) : (
                      <p className="text-sm text-slate-400">(لا يوجد نص تفصيلي)</p>
                    )}
                  </article>
                </div>
              </Card>
            </>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:col-span-4">
          {isPending ? (
            <Card title="القرار">
              <ReviewActions revisionId={rev.id} action={rev.action} stale={stale} />
            </Card>
          ) : (
            <Card title="تمت المراجعة">
              <p className="text-sm leading-relaxed text-slate-600">
                هذا الطلب {rev.status === "rejected" ? "مرفوض" : rev.status === "published" ? "معتمد ومنفَّذ" : "ليس في طابور المراجعة حالياً"}.
              </p>
            </Card>
          )}
          {!isDelete && (
            <Card>
              <SeoChecklist report={report} keyword={proposedPayload.focus_keyword} />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
