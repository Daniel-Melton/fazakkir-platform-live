"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ROLE_LABELS_AR } from "@/lib/auth/roles";
import type { StaffAccount } from "@/lib/cms/queries";
import { createStaffAccountsAction, setStaffDisabledAction, type CreatedAccountResult } from "@/lib/cms/staff-actions";
import type { UserRole } from "@/types/database";
import { Card, Field, Notice, Pill, btn, formatDate, inputClass } from "./ui";

interface Row {
  full_name: string;
  email: string;
  password: string;
}
const emptyRow = (): Row => ({ full_name: "", email: "", password: "" });

export default function StaffPanel({
  staff,
  currentUserId,
  creatable,
  names,
}: {
  staff: StaffAccount[];
  currentUserId: string;
  creatable: UserRole[];
  names: Record<string, string>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "invite">("password");
  const [role, setRole] = useState<UserRole>(creatable[0] ?? "editor");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [results, setResults] = useState<CreatedAccountResult[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    const accounts = rows.filter((r) => r.email.trim() || r.full_name.trim());
    if (accounts.length === 0) {
      setError("أدخل بيانات حساب واحد على الأقل");
      return;
    }
    startTransition(async () => {
      const res = await createStaffAccountsAction({ mode, role, accounts });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults(res.results);
      // نُبقي في النموذج الصفوف التي فشلت فقط
      const failed = new Set(res.results.filter((r) => !r.ok).map((r) => r.email));
      const remaining = accounts.filter((a) => failed.has(a.email.trim().toLowerCase()));
      setRows(remaining.length ? remaining : [emptyRow()]);
      router.refresh();
    });
  };

  const toggle = (acc: StaffAccount) => {
    const disabling = !acc.disabled_at;
    if (disabling && !window.confirm(`تعطيل حساب ${acc.full_name || acc.email}؟ لن يستطيع تسجيل الدخول.`)) return;
    startTransition(async () => {
      const res = await setStaffDisabledAction(acc.id, disabling);
      if (res.ok) {
        setNotice(res.message);
        setError("");
        router.refresh();
      } else setError(res.error);
    });
  };

  const copy = (text: string) => void navigator.clipboard?.writeText(text);

  return (
    <div dir="rtl" className="space-y-5 text-right">
      <div>
        <h1 className="text-2xl font-black text-slate-900">حسابات المحررين</h1>
        <p className="mt-1 text-sm text-slate-500">
          لا يوجد تسجيل عام لدور المحرر. الحسابات تُنشأ من هنا فقط، وقاعدة البيانات ترفض منح الدور من أي طريق آخر.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && !error && <Notice tone="success">{notice}</Notice>}

      <Card title="إنشاء حسابات جديدة" description="يمكنك إضافة عدة حسابات دفعة واحدة (حتى 20).">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-1.5 text-xs font-bold text-slate-700">طريقة الإنشاء</legend>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-bold">
                {(
                  [
                    ["password", "بريد + كلمة مرور"],
                    ["invite", "دعوة بالبريد"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={mode === key}
                    onClick={() => setMode(key)}
                    className={clsx("rounded-lg px-4 py-2 transition", mode === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {mode === "password"
                  ? "يُفعَّل الحساب فوراً. اترك كلمة المرور فارغة لتوليد كلمة قوية تظهر لك مرة واحدة."
                  : "تصل المحرر رسالة فيها رابط لتعيين كلمة مروره بنفسه."}
              </p>
            </fieldset>

            <Field label="الدور" htmlFor="staff-role">
              <select
                id="staff-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={creatable.length < 2}
                className={inputClass}
              >
                {creatable.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS_AR[r]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12">
                <input
                  dir="auto"
                  required
                  aria-label={`الاسم الكامل ${i + 1}`}
                  placeholder="الاسم الكامل"
                  value={row.full_name}
                  onChange={(e) => update(i, { full_name: e.target.value })}
                  className={clsx(inputClass, mode === "password" ? "sm:col-span-4" : "sm:col-span-5")}
                />
                <input
                  dir="ltr"
                  type="email"
                  required
                  autoComplete="off"
                  aria-label={`البريد الإلكتروني ${i + 1}`}
                  placeholder="editor@example.com"
                  value={row.email}
                  onChange={(e) => update(i, { email: e.target.value })}
                  className={clsx(inputClass, mode === "password" ? "sm:col-span-4" : "sm:col-span-6")}
                />
                {mode === "password" && (
                  <input
                    dir="ltr"
                    type="text"
                    autoComplete="new-password"
                    minLength={10}
                    aria-label={`كلمة المرور ${i + 1} (اختياري)`}
                    placeholder="كلمة مرور (اختياري — 10+)"
                    value={row.password}
                    onChange={(e) => update(i, { password: e.target.value })}
                    className={clsx(inputClass, "font-mono text-xs sm:col-span-3")}
                  />
                )}
                <button
                  type="button"
                  disabled={rows.length === 1}
                  aria-label={`حذف الصف ${i + 1}`}
                  onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                  className="rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-30 sm:col-span-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={rows.length >= 20}
              onClick={() => setRows((r) => [...r, emptyRow()])}
              className="text-sm font-bold text-emerald-800 hover:underline disabled:opacity-40"
            >
              + إضافة حساب آخر
            </button>
            <button type="submit" disabled={pending} className={btn.primary}>
              {pending ? "جارٍ الإنشاء…" : mode === "invite" ? "إرسال الدعوات" : "إنشاء الحسابات"}
            </button>
          </div>
        </form>

        {results && (
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4" aria-live="polite">
            <h3 className="text-sm font-extrabold text-slate-900">النتيجة</h3>
            {results.some((r) => r.tempPassword) && (
              <Notice tone="warn">
                انسخ كلمات المرور الآن وسلّمها لأصحابها عبر قناة آمنة — <strong>لن تُعرض مرة أخرى</strong>. اطلب من كل محرر تغييرها من صفحة
                «كلمة المرور» بعد أول دخول.
              </Notice>
            )}
            <ul className="space-y-2">
              {results.map((r) => (
                <li
                  key={r.email}
                  className={clsx(
                    "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm",
                    r.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
                  )}
                >
                  <span dir="ltr" className="font-mono text-xs font-bold text-slate-900">
                    {r.email}
                  </span>
                  {r.ok ? (
                    r.tempPassword ? (
                      <span className="flex items-center gap-2">
                        <code dir="ltr" className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-emerald-200">
                          {r.tempPassword}
                        </code>
                        <button type="button" onClick={() => copy(`${r.email}\n${r.tempPassword}`)} className="text-xs font-bold text-emerald-800 underline">
                          نسخ
                        </button>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-800">أُرسلت الدعوة</span>
                    )
                  ) : (
                    <span className="text-xs font-bold text-rose-700">{r.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="الحسابات الحالية" description={`${staff.length} حساباً بصلاحيات محتوى`}>
        {staff.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد حسابات بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="border-b border-slate-100">
                  <th scope="col" className="px-2 py-2 text-right font-bold">الاسم</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">الدور</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">الحالة</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">أُنشئ</th>
                  <th scope="col" className="px-2 py-2 text-left font-bold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((acc) => {
                  const manageable = acc.id !== currentUserId && creatable.includes(acc.role as UserRole);
                  return (
                    <tr key={acc.id}>
                      <td className="px-2 py-3">
                        <div dir="auto" className="font-bold text-slate-900">
                          {acc.full_name || "—"}
                          {acc.id === currentUserId && <span className="mr-2 text-xs font-normal text-slate-400">(أنت)</span>}
                        </div>
                        <div dir="ltr" className="text-right font-mono text-xs text-slate-500">
                          {acc.email}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs font-bold text-slate-700">{ROLE_LABELS_AR[acc.role as UserRole] ?? acc.role}</td>
                      <td className="px-2 py-3">
                        <Pill status={acc.disabled_at ? "bad" : "good"}>{acc.disabled_at ? "معطّل" : "نشط"}</Pill>
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-500">
                        {formatDate(acc.created_at)}
                        {acc.created_by && names[acc.created_by] && <span className="block">بواسطة {names[acc.created_by]}</span>}
                      </td>
                      <td className="px-2 py-3 text-left">
                        {manageable ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => toggle(acc)}
                            className={clsx("text-xs font-bold hover:underline disabled:opacity-40", acc.disabled_at ? "text-emerald-800" : "text-rose-600")}
                          >
                            {acc.disabled_at ? "إعادة التفعيل" : "تعطيل"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
