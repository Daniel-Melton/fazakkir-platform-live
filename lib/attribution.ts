// Remembers where a visitor came from (UTM and click ids) for the current browser session,
// so the lead form can send the source with the enquiry. Uses sessionStorage only.
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;
const STORE = "fz_attr";

export type Attribution = Partial<Record<(typeof KEYS)[number], string>> & {
  landing_page?: string;
  referrer?: string;
};

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  let saved: Attribution = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(STORE) || "{}");
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const fresh: Attribution = {};
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) fresh[k] = v.slice(0, 200);
  }

  // First page of the session, or a new campaign link: refresh what we remember.
  if (!saved.landing_page || Object.keys(fresh).length > 0) {
    let ref: string | undefined;
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : undefined;
    } catch {}
    saved = { ...saved, ...fresh, landing_page: window.location.pathname, referrer: ref };
    try {
      sessionStorage.setItem(STORE, JSON.stringify(saved));
    } catch {}
  }
  return saved;
}
