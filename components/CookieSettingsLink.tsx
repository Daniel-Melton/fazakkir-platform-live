"use client";

// Reopens the cookie banner. The banner only exists when Google Tag Manager is
// enabled (NEXT_PUBLIC_GTM_ID), so the link is hidden otherwise: there is nothing to configure.
export default function CookieSettingsLink({ className }: { className?: string }) {
  if (!process.env.NEXT_PUBLIC_GTM_ID) return null;
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("fz-open-consent"))}>
      Cookie settings
    </button>
  );
}
