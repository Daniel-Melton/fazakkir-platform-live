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

// ---------------------------------------------------------------------
// JSON-LD تلقائي للمحتوى المُدار من لوحة التحكم
// ---------------------------------------------------------------------
const absUrl = (v: string) => (/^https?:\/\//i.test(v) ? v : abs(v.startsWith("/") ? v : `/${v}`));
const publisher = {
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: abs("/logo.png") },
};

/** يحذف المفاتيح الفارغة حتى يبقى المخطط صالحاً */
function compact<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

export interface ArticleSchemaInput {
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  author?: string | null;
  authorRole?: string | null;
  category?: string | null;
  tags?: string[] | null;
  wordCount?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  canonicalUrl?: string | null;
}

export function articleSchema(a: ArticleSchemaInput) {
  const url = a.canonicalUrl ? absUrl(a.canonicalUrl) : abs(`/blog/${a.slug}`);
  return compact({
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: a.title.slice(0, 110),
    description: a.description,
    image: a.image ? [absUrl(a.image)] : undefined,
    datePublished: a.publishedAt ?? undefined,
    dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
    author: a.author
      ? compact({ "@type": "Person", name: a.author, jobTitle: a.authorRole ?? undefined })
      : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher,
    articleSection: a.category ?? undefined,
    keywords: a.tags?.length ? a.tags.join(", ") : undefined,
    wordCount: a.wordCount || undefined,
    inLanguage: "en",
  });
}

export interface CourseSchemaInput {
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  category?: string | null;
  tags?: string[] | null;
  badge?: string | null;
  prerequisites?: string | null;
  outcomes?: string[] | null;
  levels?: { level?: string; title?: string; description?: string }[] | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  canonicalUrl?: string | null;
}

/** Course + LearningResource (درس فردي أونلاين) */
export function courseLearningSchema(c: CourseSchemaInput) {
  const url = c.canonicalUrl ? absUrl(c.canonicalUrl) : abs(`/courses/${c.slug}`);
  const prereq = c.prerequisites && !/^none$/i.test(c.prerequisites.trim()) ? c.prerequisites : undefined;
  return compact({
    "@context": "https://schema.org",
    "@type": ["Course", "LearningResource"],
    "@id": `${url}#course`,
    url,
    name: c.title,
    description: c.description,
    image: c.image ? [absUrl(c.image)] : undefined,
    provider: publisher,
    inLanguage: "en",
    about: c.category ?? undefined,
    keywords: c.tags?.length ? c.tags.join(", ") : undefined,
    educationalLevel: c.badge ?? undefined,
    learningResourceType: "Online course",
    coursePrerequisites: prereq,
    teaches: c.outcomes?.length ? c.outcomes : undefined,
    syllabusSections: c.levels?.length
      ? c.levels
          .filter((l) => l.title)
          .map((l) =>
            compact({
              "@type": "Syllabus",
              name: [l.level, l.title].filter(Boolean).join(": "),
              description: l.description ?? undefined,
            }),
          )
      : undefined,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "PT1H",
      instructor: { "@type": "Organization", name: `${SITE_NAME} tutors` },
    },
    datePublished: c.publishedAt ?? undefined,
    dateModified: c.updatedAt ?? undefined,
  });
}
