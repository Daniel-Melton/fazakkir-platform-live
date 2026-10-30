import type { Metadata } from "next";
import { TRIAL_LINE } from "./offer";

// Must match the host the site actually serves (apex redirects to www on Vercel).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fazakkir.com").replace(/\/$/, "");
export const SITE_NAME = "Fazakkir Academy";
export const DEFAULT_OG_IMAGE = "/og-image.jpg";

export type PageSeo = {
  path: string;
  title: string;            // without brand: layout template appends " | Fazakkir"
  description: string;      // aim for 150-155 characters
  absoluteTitle?: boolean;
  index?: boolean;          // default true
  live?: boolean;           // false = planned page, kept out of the sitemap
  priority?: number;
  lastModified?: string | Date;
};

export const PAGES = {
  home: {
    path: "/",
    title: "Fazakkir Academy | 1-on-1 Online Quran & Arabic Classes for Kids",
    absoluteTitle: true,
    description: `Private 1-on-1 Quran, Tajweed and Arabic lessons for kids with Al-Azhar graduate tutors. Monthly progress reports. ${TRIAL_LINE}`,
    priority: 1,
  },
  pricing: {
    path: "/pricing",
    title: "Transparent & Flexible Tuition",
    description: "Plans from 74 USD per month for 1-on-1 Quran and Arabic lessons. Sibling discounts, no lock-in contract, make-up classes included.",
    priority: 0.9,
  },
  courses: {
    path: "/courses",
    title: "Quran, Tajweed, Hifz & Arabic Courses",
    description: `Choose a 1-on-1 course for your child: Noorani Qaida, Tajweed, Hifz, Arabic and Islamic Studies. ${TRIAL_LINE}`,
    priority: 0.9,
  },
  blog: {
    path: "/blog",
    title: "Parents Guide to Teaching Quran & Arabic",
    description: "Practical articles for parents on Noorani Qaida, Tajweed, Hifz and keeping children motivated.",
    priority: 0.7,
  },
  parents: {
    path: "/parents",
    title: "Safe & Nurturing Islamic Education for Your Children",
    description: `A caring 1-on-1 online environment for Quran, Arabic and Islamic manners, with regular parent updates. ${TRIAL_LINE}`,
    priority: 0.8,
  },
  qaida: {
    path: "/landing/noorani-qaida",
    title: "Noorani Qaida Course | Learn to Read Quran from Scratch",
    description: `Help your child read Arabic letters and the Quran step by step with a patient 1-on-1 tutor. ${TRIAL_LINE}`,
    priority: 0.8,
  },
  recitation: {
    path: "/landing/quran-recitation",
    title: "Quran Recitation & Tajweed Mastery",
    description: `Live, personalised Tajweed correction with certified tutors. ${TRIAL_LINE}`,
    priority: 0.8,
  },
  hifz: {
    path: "/landing/quran-hifz",
    title: "Online Quran Hifz Program | Memorize with Strong Retention",
    description: `A Hifz plan built around new lessons, recent review and long-term review, led by Huffaz. ${TRIAL_LINE}`,
    priority: 0.8,
  },
  ijazah: {
    path: "/landing/quran-ijazah",
    title: "Quran Ijazah Online with a Documented Sanad",
    description: "Study for your Ijazah in Hafs or other Qira'at with a sanad holder, one-to-one and online.",
    priority: 0.7,
  },
  arabic: {
    path: "/landing/arabic-for-non-arabs",
    title: "Arabic for Non-Arabs | Speak Modern Standard Arabic",
    description: `Interactive 1-on-1 Arabic classes with tutors who speak clear English. ${TRIAL_LINE}`,
    priority: 0.7,
  },
  islamicStudies: {
    path: "/landing/islamic-studies",
    title: "Islamic Studies for Kids & Youth | Faith, Manners & Duas",
    description: `Salah, duas and good manners taught gently 1-on-1. ${TRIAL_LINE}`,
    priority: 0.7,
  },
  privacy: { path: "/privacy-policy", title: "Privacy Policy", description: "How Fazakkir Academy collects, uses and protects family data.", priority: 0.3 },
  terms: { path: "/terms", title: "Terms of Service", description: "Terms for Fazakkir Academy lessons, payments and cancellations.", priority: 0.3 },

  // Planned kid-focused ad pages. Set live: true when each page ships.
  kids: {
    path: "/kids-quran-classes",
    title: "Online Quran Classes for Kids | 1-on-1 Tutors",
    description: `Private 1-on-1 Quran and Tajweed lessons for kids with Al-Azhar graduate tutors. Monthly progress reports. ${TRIAL_LINE}`,
    live: false,
  },
  tajweedKids: {
    path: "/tajweed-for-kids",
    title: "Online Tajweed Classes for Kids | 1-on-1",
    description: `Gentle, live Tajweed correction for kids with a patient 1-on-1 tutor and monthly progress reports. ${TRIAL_LINE}`,
    live: false,
  },
} satisfies Record<string, PageSeo>;

export type PageKey = keyof typeof PAGES;

type Base = { path: string; title: string; description: string; absoluteTitle?: boolean; index?: boolean; image?: string; type?: "website" | "article" };

function make(p: Base): Metadata {
  const image = p.image ?? DEFAULT_OG_IMAGE;
  const fullTitle = p.absoluteTitle ? p.title : `${p.title} | Fazakkir`;
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: { canonical: p.path },
    robots: { index: p.index !== false, follow: true },
    openGraph: {
      type: p.type ?? "website",
      url: p.path,
      siteName: SITE_NAME,
      title: fullTitle,
      description: p.description,
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: p.description, images: [image] },
  };
}

export function buildMetadata(key: PageKey): Metadata {
  const p: PageSeo = PAGES[key];
  return make(p);
}

// For database-driven pages (courses, blog posts).
export function buildDynamicMetadata(p: Base): Metadata {
  return make(p);
}

// Short plain-text description from markdown/HTML content.
export function excerptFrom(text: string | null | undefined, max = 155): string {
  const clean = (text ?? "").replace(/<[^>]+>/g, " ").replace(/[#*_>`~\[\]()!|-]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
