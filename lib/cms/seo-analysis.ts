// أدوات تحليل الـ SEO — دوال نقية تعمل في المتصفح (تحليل لحظي) وعلى السيرفر (حساب نهائي).
import { SEO_LIMITS } from "./fields";

export type CheckStatus = "good" | "warn" | "bad" | "idle";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  hint: string;
}

export interface Heading {
  level: number;
  text: string;
}

export interface HeadingIssue {
  index: number;
  message: string;
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** نص خام من HTML (أو Markdown قديم) */
export function htmlToText(html: string): string {
  return decodeEntities(
    (html ?? "")
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|h[1-6]|li|blockquote|div|figcaption|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/[*_`~>]+/g, " ")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .trim();
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
}

export function countWords(html: string): number {
  return splitWords(htmlToText(html)).length;
}

/** زمن القراءة بالدقائق (200 كلمة/دقيقة) */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

export function readingTimeLabel(words: number): string {
  return `${readingMinutes(words)} min read`;
}

/** العناوين بترتيب ظهورها — يدعم HTML و Markdown القديم (## ...) */
export function extractHeadings(content: string): Heading[] {
  const out: { pos: number; h: Heading }[] = [];
  const src = content ?? "";
  const htmlRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = htmlRe.exec(src))) {
    out.push({ pos: m.index, h: { level: Number(m[1]), text: htmlToText(m[2]) } });
  }
  const mdRe = /^[ \t]*(#{1,6})[ \t]+(.+?)[ \t]*#*$/gm;
  while ((m = mdRe.exec(src))) {
    out.push({ pos: m.index, h: { level: m[1].length, text: htmlToText(m[2]) } });
  }
  return out.sort((a, b) => a.pos - b.pos).map((x) => x.h);
}

/**
 * قواعد الهيكل: H1 محجوز لعنوان الصفحة، يبدأ المحتوى بـ H2، ولا قفز في المستويات (H2 -> H4).
 */
export function validateHeadings(headings: Heading[]): HeadingIssue[] {
  const issues: HeadingIssue[] = [];
  let prev = 1; // عنوان الصفحة هو H1
  headings.forEach((h, index) => {
    if (h.level === 1) {
      issues.push({ index, message: `"${h.text}" بمستوى H1 — عنوان H1 محجوز لعنوان الصفحة، استخدم H2` });
    } else if (h.level > prev + 1) {
      issues.push({ index, message: `"${h.text}" بمستوى H${h.level} بعد H${prev} مباشرة — لا تتخطَّ المستويات` });
    }
    if (!h.text.trim()) {
      issues.push({ index, message: `يوجد عنوان H${h.level} فارغ` });
    }
    if (h.level > 1) prev = h.level;
  });
  return issues;
}

export function slugify(input: string): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** توحيد النص للمقارنة: أحرف صغيرة، إزالة التشكيل وعلامات الترقيم، مسافات مفردة */
export function normalizeForMatch(s: string): string {
  return (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function containsKeyword(haystack: string, keyword: string): boolean {
  const k = normalizeForMatch(keyword);
  if (!k) return false;
  return ` ${normalizeForMatch(haystack)} `.includes(` ${k} `);
}

export function countKeyword(text: string, keyword: string): number {
  const k = normalizeForMatch(keyword);
  if (!k) return 0;
  const hay = ` ${normalizeForMatch(text)} `;
  let n = 0;
  let i = hay.indexOf(` ${k} `);
  while (i !== -1) {
    n++;
    i = hay.indexOf(` ${k} `, i + k.length + 1);
  }
  return n;
}

export function lengthStatus(len: number, min: number, max: number): CheckStatus {
  if (len === 0) return "bad";
  if (len >= min && len <= max) return "good";
  return "warn";
}

export interface SeoInput {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  body: string;
  coverImage: string;
  coverImageAlt: string;
}

export interface SeoReport {
  wordCount: number;
  readingMinutes: number;
  headings: Heading[];
  headingIssues: HeadingIssue[];
  keywordCount: number;
  keywordDensity: number; // نسبة مئوية
  keywordChecks: SeoCheck[]; // الفحوص الخمسة للكلمة المفتاحية
  generalChecks: SeoCheck[];
  score: number; // 0..100
}

export function analyzeSeo(input: SeoInput): SeoReport {
  const text = htmlToText(input.body);
  const words = splitWords(text);
  const wordCount = words.length;
  const headings = extractHeadings(input.body);
  const headingIssues = validateHeadings(headings);
  const kw = input.focusKeyword.trim();
  const hasKw = kw.length > 0;
  const first100 = words.slice(0, 100).join(" ");
  const h2s = headings.filter((h) => h.level === 2);
  const kwSlug = slugify(kw);

  const kwCheck = (id: string, label: string, pass: boolean, okHint: string, badHint: string): SeoCheck => ({
    id,
    label,
    status: !hasKw ? "idle" : pass ? "good" : "bad",
    hint: !hasKw ? "أدخل الكلمة المفتاحية أولاً" : pass ? okHint : badHint,
  });

  const keywordChecks: SeoCheck[] = [
    kwCheck(
      "kw_meta_title",
      "عنوان الميتا",
      containsKeyword(input.metaTitle, kw),
      "الكلمة المفتاحية موجودة في عنوان الميتا",
      "أضف الكلمة المفتاحية إلى عنوان الميتا (ويُفضَّل في بدايته)",
    ),
    kwCheck(
      "kw_meta_description",
      "وصف الميتا",
      containsKeyword(input.metaDescription, kw),
      "الكلمة المفتاحية موجودة في وصف الميتا",
      "أضف الكلمة المفتاحية إلى وصف الميتا",
    ),
    kwCheck(
      "kw_slug",
      "الرابط (Slug)",
      !!kwSlug && `-${input.slug}-`.includes(`-${kwSlug}-`),
      "الكلمة المفتاحية موجودة في الرابط",
      "ضمّن الكلمة المفتاحية في الرابط",
    ),
    kwCheck(
      "kw_h2",
      "عنوان فرعي H2",
      h2s.some((h) => containsKeyword(h.text, kw)),
      "الكلمة المفتاحية موجودة في عنوان H2 واحد على الأقل",
      h2s.length ? "لا يوجد عنوان H2 يحتوي الكلمة المفتاحية" : "أضف عنواناً فرعياً H2 يحتوي الكلمة المفتاحية",
    ),
    kwCheck(
      "kw_first_100",
      "أول 100 كلمة",
      containsKeyword(first100, kw),
      "الكلمة المفتاحية موجودة في أول 100 كلمة",
      "اذكر الكلمة المفتاحية في أول 100 كلمة من النص",
    ),
  ];

  const keywordCount = countKeyword(text, kw);
  const kwWords = Math.max(1, splitWords(kw).length);
  const keywordDensity = wordCount > 0 ? Math.round(((keywordCount * kwWords) / wordCount) * 1000) / 10 : 0;

  const mt = input.metaTitle.trim().length;
  const md = input.metaDescription.trim().length;
  const { metaTitle: MT, metaDescription: MD, minWords } = SEO_LIMITS;

  const generalChecks: SeoCheck[] = [
    {
      id: "meta_title_len",
      label: "طول عنوان الميتا",
      status: lengthStatus(mt, MT.min, MT.max),
      hint: mt === 0 ? "عنوان الميتا فارغ" : `${mt} حرفاً — المستهدف ${MT.min}–${MT.max}`,
    },
    {
      id: "meta_description_len",
      label: "طول وصف الميتا",
      status: lengthStatus(md, MD.min, MD.max),
      hint: md === 0 ? "وصف الميتا فارغ" : `${md} حرفاً — المستهدف ${MD.min}–${MD.max}`,
    },
    {
      id: "headings",
      label: "هيكل العناوين",
      status: headings.length === 0 ? "warn" : headingIssues.length ? "bad" : "good",
      hint:
        headings.length === 0
          ? "لا توجد عناوين فرعية — قسّم النص بعناوين H2"
          : headingIssues.length
            ? headingIssues[0].message
            : `تسلسل سليم (${h2s.length} × H2، ${headings.filter((h) => h.level === 3).length} × H3)`,
    },
    {
      id: "word_count",
      label: "طول المحتوى",
      status: wordCount >= minWords ? "good" : wordCount >= minWords / 2 ? "warn" : "bad",
      hint: `${wordCount} كلمة — يُفضَّل ${minWords} كلمة فأكثر`,
    },
    {
      id: "image_alt",
      label: "الصورة والنص البديل",
      status: !input.coverImage ? "warn" : input.coverImageAlt.trim() ? "good" : "bad",
      hint: !input.coverImage
        ? "لا توجد صورة بارزة"
        : input.coverImageAlt.trim()
          ? "الصورة البارزة لها نص بديل"
          : "النص البديل للصورة البارزة إلزامي",
    },
    {
      id: "kw_density",
      label: "كثافة الكلمة المفتاحية",
      status: !hasKw ? "idle" : keywordCount === 0 ? "bad" : keywordDensity > 3 ? "warn" : "good",
      hint: !hasKw
        ? "أدخل الكلمة المفتاحية أولاً"
        : `تكررت ${keywordCount} مرة (${keywordDensity}%)${keywordDensity > 3 ? " — كثافة مرتفعة، تجنّب الحشو" : ""}`,
    },
  ];

  const all = [...keywordChecks, ...generalChecks];
  const points = all.reduce((sum, c) => sum + (c.status === "good" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  const score = Math.round((points / all.length) * 100);

  return {
    wordCount,
    readingMinutes: readingMinutes(wordCount),
    headings,
    headingIssues,
    keywordCount,
    keywordDensity,
    keywordChecks,
    generalChecks,
    score,
  };
}
