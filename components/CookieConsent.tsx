"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Choice = "granted" | "denied";
const KEY = "fz_consent";

function applyConsent(choice: Choice) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  // gtag-style command: Google tags read it from the dataLayer.
  (function gtag(..._args: unknown[]) {
    w.dataLayer!.push(arguments);
  })("consent", "update", {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

// Shown only when GTM is enabled (nothing to consent to otherwise).
// Reopen it from the footer: window.dispatchEvent(new Event("fz-open-consent")).
export default function CookieConsent({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (!saved) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("fz-open-consent", reopen);
    return () => window.removeEventListener("fz-open-consent", reopen);
  }, [enabled]);

  function choose(choice: Choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch {}
    applyConsent(choice);
    setOpen(false);
  }

  if (!enabled || !open) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-md z-50 rounded-2xl bg-slate-900 text-white p-5 shadow-2xl border border-white/10"
    >
      <p className="text-sm leading-relaxed text-slate-200">
        We use cookies to measure visits and improve our ads. Essential cookies are always on. You can accept or
        reject the rest.{" "}
        <Link href="/privacy-policy" className="underline text-emerald-300">
          Privacy policy
        </Link>
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="flex-1 min-h-11 rounded-xl border border-white/40 font-bold text-sm hover:bg-white/10"
        >
          Reject non-essential
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="flex-1 min-h-11 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
