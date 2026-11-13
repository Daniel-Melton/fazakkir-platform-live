import clsx from "clsx";
import type { ReactNode } from "react";
import { ACTION_LABEL_AR, STATUS_LABEL_AR, type ContentStatus, type RevisionAction } from "@/lib/cms/fields";
import type { CheckStatus } from "@/lib/cms/seo-analysis";

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-50 disabled:text-slate-500";

export function Card({
  title,
  description,
  children,
  aside,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-2xl border border-slate-200 bg-white p-5 sm:p-6", className)}>
      {(title || aside) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-extrabold text-slate-900">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  counter,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  counter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-bold text-slate-700">
          {label}
          {required && <span className="mr-1 text-rose-600">*</span>}
        </label>
        {counter}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const TONE: Record<CheckStatus, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  bad: "bg-rose-50 text-rose-700 ring-rose-200",
  idle: "bg-slate-100 text-slate-500 ring-slate-200",
};
const DOT: Record<CheckStatus, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  idle: "bg-slate-400",
};
const TONE_WORD: Record<CheckStatus, string> = { good: "سليم", warn: "يحتاج تحسيناً", bad: "ناقص", idle: "غير مفعّل" };

/** شارة حالة ملوّنة (اللون + نص مخفي لقارئات الشاشة) */
export function Pill({ status, children, title }: { status: CheckStatus; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
        TONE[status],
      )}
    >
      <span aria-hidden className={clsx("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {children}
      <span className="sr-only"> — {TONE_WORD[status]}</span>
    </span>
  );
}

/** عدّاد أحرف لحظي مع نطاق مستهدف */
export function CharCounter({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.trim().length;
  const status: CheckStatus = len === 0 ? "idle" : len >= min && len <= max ? "good" : "warn";
  const pct = Math.min(100, Math.round((len / max) * 100));
  return (
    <span className="flex items-center gap-2" dir="ltr">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <span
          className={clsx("block h-full rounded-full transition-all", DOT[len > max ? "bad" : status])}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span
        aria-live="polite"
        className={clsx(
          "text-xs font-bold tabular-nums",
          len > max ? "text-rose-600" : status === "good" ? "text-emerald-700" : status === "warn" ? "text-amber-700" : "text-slate-400",
        )}
      >
        {len} / {min}–{max}
      </span>
    </span>
  );
}

const STATUS_TONE: Record<ContentStatus, CheckStatus> = {
  draft: "idle",
  pending_approval: "warn",
  published: "good",
  rejected: "bad",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Pill status={STATUS_TONE[status]}>{STATUS_LABEL_AR[status]}</Pill>;
}

export function ActionBadge({ action }: { action: RevisionAction }) {
  const cls =
    action === "create"
      ? "bg-sky-50 text-sky-800 ring-sky-200"
      : action === "update"
        ? "bg-violet-50 text-violet-800 ring-violet-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", cls)}>
      {ACTION_LABEL_AR[action]}
    </span>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "info" | "success" | "warn" | "error";
  children: ReactNode;
}) {
  const cls = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={clsx("rounded-xl border px-4 py-3 text-sm leading-relaxed", cls)}>
      {children}
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50",
  dangerSolid:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50",
};

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
