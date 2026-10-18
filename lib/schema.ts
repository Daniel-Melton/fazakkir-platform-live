import { SITE_URL, SITE_NAME } from "./seo";

const abs = (path: string) => `${SITE_URL}${path}`;

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

// Only mark up questions that are visibly answered on the page.
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
}

export function courseSchema(c: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.name,
    description: c.description,
    url: abs(c.path),
    provider: { "@type": "EducationalOrganization", name: SITE_NAME, url: SITE_URL },
  };
}
