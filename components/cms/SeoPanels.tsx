"use client";

import { useState } from "react";
import clsx from "clsx";
import type { SeoReport } from "@/lib/cms/seo-analysis";
import { Pill } from "./ui";

const HOST = "www.fazakkir.com";

/** معاينة نتيجة البحث في Google */
export function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  return (
    <div dir="ltr" className="rounded-xl border border-slate-200 bg-white p-4 text-left">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-800 text-xs font-black text-white">F</span>
        <span className="min-w-0">
          <span className="block text-sm leading-tight text-slate-900">Fazakkir Academy</span>
          <span className="block truncate text-xs leading-tight text-slate-500">
            https://{HOST}
            {path.replace(/\//g, " › ").replace(/ › $/, "")}
          </span>
        </span>
      </div>
      <div className="truncate text-xl leading-snug text-[#1a0dab]">{title || "Meta title preview"}</div>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">
        {description || "Meta description preview — write 150–160 characters that describe the page and invite the click."}
      </p>
    </div>
  );
}

/** معاينة بطاقة المشاركة (Open Graph / X) */
export function SocialPreview({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image: string;
}) {
  const [tab, setTab] = useState<"og" | "x">("og");
  return (
    <div>
      <div role="tablist" aria-label="معاينة المشاركة" className="mb-3 inline-flex rounded-lg bg-slate-100 p-1 text-xs font-bold">
        {(
          [
            ["og", "Facebook / WhatsApp"],
            ["x", "X (Twitter)"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx("rounded-md px-3 py-1.5 transition", tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
          >
            {label}
          </button>
        ))}
      </div>

      <div dir="ltr" className="max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white text-left">
        <div className="relative flex aspect-[1.91/1] items-center justify-center bg-slate-200">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-slate-500">1200 × 630</span>
          )}
          {tab === "x" && (
            <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
              {title || "Title"}
            </span>
          )}
        </div>
        {tab === "og" ? (
          <div className="border-t border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{HOST}</div>
            <div className="truncate text-sm font-bold text-slate-900">{title || "Title"}</div>
            <div className="line-clamp-1 text-xs text-slate-600">{description || "Description"}</div>
          </div>
        ) : (
          <div className="px-3 py-2 text-xs text-slate-500">From {HOST}</div>
        )}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#059669" : score >= 50 ? "#d97706" : "#e11d48";
  return (
    <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`درجة الـ SEO ${score} من 100`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums text-slate-900">{score}</span>
    </div>
  );
}

/** قائمة فحص الـ SEO اللحظية */
export function SeoChecklist({ report, keyword }: { report: SeoReport; keyword: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ScoreRing score={report.score} />
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">تحليل الـ SEO</div>
          <div className="text-xs leading-relaxed text-slate-500">
            {keyword.trim() ? (
              <>
                الكلمة المفتاحية: <span dir="auto" className="font-bold text-slate-800">{keyword}</span>
              </>
            ) : (
              "أدخل الكلمة المفتاحية لتفعيل الفحص"
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold text-slate-500">مواضع الكلمة المفتاحية</h3>
        <ul className="flex flex-wrap gap-1.5">
          {report.keywordChecks.map((c) => (
            <li key={c.id}>
              <Pill status={c.status} title={c.hint}>
                {c.label}
              </Pill>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold text-slate-500">فحوص عامة</h3>
        <ul className="flex flex-wrap gap-1.5">
          {report.generalChecks.map((c) => (
            <li key={c.id}>
              <Pill status={c.status} title={c.hint}>
                {c.label}
              </Pill>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-1.5 border-t border-slate-100 pt-3" aria-live="polite">
        {[...report.keywordChecks, ...report.generalChecks]
          .filter((c) => c.status === "bad" || c.status === "warn")
          .slice(0, 6)
          .map((c) => (
            <li key={c.id} className="flex gap-2 text-xs leading-relaxed text-slate-600">
              <span
                aria-hidden
                className={clsx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", c.status === "bad" ? "bg-rose-500" : "bg-amber-500")}
              />
              <span>{c.hint}</span>
            </li>
          ))}
        {[...report.keywordChecks, ...report.generalChecks].every((c) => c.status === "good") && (
          <li className="text-xs font-semibold text-emerald-700">كل الفحوص سليمة.</li>
        )}
      </ul>
    </div>
  );
}

/** مخطط العناوين + إحصاءات القراءة */
export function ContentStats({ report }: { report: SeoReport }) {
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["عدد الكلمات", report.wordCount.toLocaleString("en-US")],
          ["زمن القراءة", `${report.wordCount ? report.readingMinutes : 0} د`],
          ["العناوين", String(report.headings.length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 px-2 py-2.5">
            <dd className="text-lg font-black tabular-nums text-slate-900">{v}</dd>
            <dt className="text-xs text-slate-500">{k}</dt>
          </div>
        ))}
      </dl>

      {report.headings.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-bold text-slate-500">مخطط العناوين</h3>
          <ol dir="auto" className="max-h-48 space-y-1 overflow-auto text-xs">
            {report.headings.map((h, i) => {
              const bad = report.headingIssues.some((x) => x.index === i);
              return (
                <li
                  key={i}
                  style={{ paddingInlineStart: `${(Math.max(2, h.level) - 2) * 14}px` }}
                  className={clsx("flex items-baseline gap-1.5", bad ? "text-rose-700" : "text-slate-700")}
                >
                  <span className={clsx("shrink-0 rounded px-1 font-mono text-[11px] font-bold", bad ? "bg-rose-100" : "bg-slate-100")}>
                    H{h.level}
                  </span>
                  <span className="truncate">{h.text || "(فارغ)"}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {report.headingIssues.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-rose-800">
          {report.headingIssues.map((x, i) => (
            <li key={i}>{x.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
