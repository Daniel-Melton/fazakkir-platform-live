"use client";

// Put this in the footer so visitors can change their choice at any time.
export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("fz-open-consent"))}>
      Cookie settings
    </button>
  );
}
