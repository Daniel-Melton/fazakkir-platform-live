"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ENTITY_LABEL_AR, ENTITY_PUBLIC_BASE, type EntityType } from "@/lib/cms/fields";
import type { LiveItem, RevisionSummary } from "@/lib/cms/queries";
import { deleteContentAction, withdrawRevisionAction } from "@/lib/cms/actions";
import { ActionBadge, Notice, StatusBadge, btn, formatDate, inputClass } from "./ui";

type Tab = "article" | "course" | "mine";

export default function ContentList({
  articles,
  courses,
  myRevisions,
  pendingKeys,
  isAdmin,
  pendingCount,
}: {
  articles: LiveItem[];
  courses: LiveItem[];
  myRevisions: RevisionSummary[];
  pendingKeys: string[];
  isAdmin: boolean;
  pendingCount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("article");
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = useMemo(() => new Set(pendingKeys), [pendingKeys]);

  const openMine = myRevisions.filter((r) => r.status !== "published");
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "article", label: "المقالات", count: articles.length },
    { key: "course", label: "الكورسات", count: courses.length },
    ...(isAdmin ? [] : [{ key: "mine" as const, label: "طلباتي", count: openMine.length }]),
  ];

  const items = (tab === "article" ? articles : courses).filter(
    (i) => !query.trim() || `${i.title} ${i.slug} ${i.category}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setBanner(res.ok ? { tone: "success", text: res.message ?? "تم" } : { tone: "error", text: res.error ?? "حدث خطأ" });
      if (res.ok) router.refresh();
    });

  const onDelete = (item: LiveItem) => {
    const label = ENTITY_LABEL_AR[item.type];
    const msg = isAdmin
      ? `حذف ال${label} «${item.title}» نهائياً من الموقع؟ لا يمكن التراجع.`
      : `إرسال طلب حذف ال${label} «${item.title}» إلى المدير؟ سيبقى على الموقع حتى يُعتمد الطلب.`;
    if (!window.confirm(msg)) return;
    run(() => deleteContentAction({ entityType: item.type, entityId: item.id }));
  };

  return (
    <div dir="rtl" className="text-right">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة المحتوى</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "أنت تنشر مباشرة. تغييرات المحررين تصلك في طابور الموافقات."
              : "كل ما تنشئه أو تعدّله أو تطلب حذفه يمر بمراجعة المدير قبل ظهوره على الموقع."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link href="/dashboard/admin/approvals" className={btn.secondary}>
              طابور الموافقات
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-white">{pendingCount}</span>
              )}
            </Link>
          )}
          <Link href="/dashboard/content/course/new" className={btn.secondary}>
            + كورس جديد
          </Link>
          <Link href="/dashboard/content/article/new" className={btn.primary}>
            + مقال جديد
          </Link>
        </div>
      </div>

      {banner && (
        <div className="mb-4">
          <Notice tone={banner.tone}>{banner.text}</Notice>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="أقسام المحتوى" className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-bold">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-4 py-2 transition",
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {t.label}
              <span className="rounded-full bg-slate-200 px-2 text-xs tabular-nums text-slate-700">{t.count}</span>
            </button>
          ))}
        </div>
        {tab !== "mine" && (
          <input
            type="search"
            dir="auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالعنوان أو الرابط…"
            aria-label="بحث في المحتوى"
            className={clsx(inputClass, "max-w-xs")}
          />
        )}
      </div>

      {tab === "mine" ? (
        <MyRevisions revisions={myRevisions} pending={pending} onAction={(id, mode) => run(() => withdrawRevisionAction(id, mode))} />
      ) : items.length === 0 ? (
        <Empty text={query ? "لا توجد نتائج مطابقة." : `لا يوجد ${tab === "article" ? "مقالات" : "كورسات"} بعد.`} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-right font-bold">العنوان</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">الحالة</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">آخر تحديث</th>
                <th scope="col" className="px-4 py-3 text-left font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => {
                const hasPending = locked.has(`${item.type}:${item.id}`);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/content/${item.type}/${item.id}`}
                        dir="auto"
                        className="block font-bold text-slate-900 hover:text-emerald-800"
                      >
                        {item.title}
                      </Link>
                      <span dir="ltr" className="block truncate font-mono text-xs text-slate-400">
                        {ENTITY_PUBLIC_BASE[item.type]}/{item.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={item.status} />
                        {hasPending && (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
                            عليه طلب معلّق
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(item.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 text-xs font-bold">
                        {item.status === "published" && (
                          <a
                            href={`${ENTITY_PUBLIC_BASE[item.type]}/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-900"
                          >
                            عرض ↗
                          </a>
                        )}
                        <Link href={`/dashboard/content/${item.type}/${item.id}`} className="text-emerald-800 hover:underline">
                          تعديل
                        </Link>
                        <button
                          type="button"
                          disabled={pending || (!isAdmin && hasPending)}
                          onClick={() => onDelete(item)}
                          className="text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isAdmin ? "حذف" : "طلب حذف"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function MyRevisions({
  revisions,
  pending,
  onAction,
}: {
  revisions: RevisionSummary[];
  pending: boolean;
  onAction: (id: string, mode: "withdraw" | "discard") => void;
}) {
  if (revisions.length === 0) return <Empty text="لم ترسل أي طلبات بعد." />;
  return (
    <ul className="space-y-2">
      {revisions.map((r) => {
        const editable = r.action !== "delete" && r.status !== "published";
        return (
          <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <ActionBadge action={r.action} />
                  <span className="text-xs font-bold text-slate-500">{ENTITY_LABEL_AR[r.entity_type as EntityType]}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div dir="auto" className="truncate font-bold text-slate-900">
                  {r.title || "(بدون عنوان)"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {r.status === "pending_approval" && <>أُرسل: {formatDate(r.submitted_at)}</>}
                  {r.status === "draft" && <>آخر حفظ: {formatDate(r.updated_at)}</>}
                  {(r.status === "published" || r.status === "rejected") && <>رُوجع: {formatDate(r.reviewed_at)}</>}
                </div>
                {r.status === "rejected" && r.review_note && (
                  <p dir="auto" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-800">
                    ملاحظة المراجع: {r.review_note}
                  </p>
                )}
                {r.status === "published" && r.review_note && (
                  <p dir="auto" className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900">
                    ملاحظة المراجع: {r.review_note}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs font-bold">
                {editable && (
                  <Link href={`/dashboard/content/revisions/${r.id}`} className="text-emerald-800 hover:underline">
                    {r.status === "rejected" ? "تعديل وإعادة إرسال" : "فتح"}
                  </Link>
                )}
                {r.status === "pending_approval" && (
                  <button type="button" disabled={pending} onClick={() => onAction(r.id, "withdraw")} className="text-slate-600 hover:underline disabled:opacity-40">
                    سحب الطلب
                  </button>
                )}
                {(r.status === "draft" || r.status === "rejected") && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => window.confirm("حذف هذا الطلب نهائياً؟") && onAction(r.id, "discard")}
                    className="text-rose-600 hover:underline disabled:opacity-40"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
