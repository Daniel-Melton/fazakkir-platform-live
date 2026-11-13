import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { CONTENT_ADMIN_ROLES } from "@/lib/auth/roles";
import { ENTITY_LABEL_AR } from "@/lib/cms/fields";
import { listPendingRevisions, listReviewedRevisions, namesByIds } from "@/lib/cms/queries";
import { ActionBadge, Card, Notice, StatusBadge, formatDate } from "@/components/cms/ui";

export const metadata: Metadata = { title: "طابور الموافقات", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  await requireRole(CONTENT_ADMIN_ROLES);
  const { done } = await searchParams;
  const [pending, reviewed] = await Promise.all([listPendingRevisions(), listReviewedRevisions(25)]);
  const names = await namesByIds([...pending, ...reviewed].flatMap((r) => [r.submitted_by, r.reviewed_by]));
  const who = (id?: string | null) => (id && names[id] ? names[id].full_name || names[id].email : "—");

  return (
    <div dir="rtl" className="space-y-5 text-right">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">طابور الموافقات</h1>
          <p className="mt-1 text-sm text-slate-500">
            تغييرات المحررين لا تظهر على الموقع حتى تعتمدها هنا. الأقدم أولاً.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">
          {pending.length} بانتظار المراجعة
        </span>
      </div>

      {done === "approved" && <Notice tone="success">تم الاعتماد ونُفّذ التغيير على الموقع.</Notice>}
      {done === "rejected" && <Notice tone="info">تم رفض الطلب وإبلاغ المحرر.</Notice>}

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
          لا توجد طلبات بانتظار المراجعة.
        </div>
      ) : (
        <ul className="space-y-2">
          {pending.map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/admin/approvals/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30"
              >
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <ActionBadge action={r.action} />
                    <span className="text-xs font-bold text-slate-500">{ENTITY_LABEL_AR[r.entity_type]}</span>
                  </div>
                  <div dir="auto" className="truncate font-bold text-slate-900">
                    {r.title || "(بدون عنوان)"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {who(r.submitted_by)} · {formatDate(r.submitted_at)}
                  </div>
                  {r.submit_note && (
                    <p dir="auto" className="mt-1.5 line-clamp-1 text-xs text-slate-600">
                      «{r.submit_note}»
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-bold text-emerald-800">مراجعة ←</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card title="آخر ما تمت مراجعته" description="سجل الاعتمادات والرفض والنشر المباشر.">
        {reviewed.length === 0 ? (
          <p className="text-sm text-slate-500">لا يوجد سجل بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="border-b border-slate-100">
                  <th scope="col" className="px-2 py-2 text-right font-bold">المحتوى</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">الإجراء</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">النتيجة</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">صاحب التغيير</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">المراجع</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewed.map((r) => (
                  <tr key={r.id}>
                    <td className="px-2 py-2.5">
                      <Link href={`/dashboard/admin/approvals/${r.id}`} dir="auto" className="font-bold text-slate-900 hover:text-emerald-800">
                        {r.title || "(بدون عنوان)"}
                      </Link>
                      <span className="block text-xs text-slate-400">{ENTITY_LABEL_AR[r.entity_type]}</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <ActionBadge action={r.action} />
                    </td>
                    <td className="px-2 py-2.5">
                      {r.direct ? (
                        <span className="text-xs font-bold text-slate-500">
                          {r.action === "delete" ? "حذف مباشر" : r.status === "draft" ? "حفظ مسودة مباشر" : "نشر مباشر"}
                        </span>
                      ) : (
                        <StatusBadge status={r.status} />
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-slate-600">{who(r.submitted_by)}</td>
                    <td className="px-2 py-2.5 text-xs text-slate-600">{r.direct ? "—" : who(r.reviewed_by)}</td>
                    <td className="px-2 py-2.5 text-xs text-slate-500">{formatDate(r.reviewed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
