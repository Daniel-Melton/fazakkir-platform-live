// تعريف حقول المحتوى (مقالات + كورسات) والتحقق منها.
// ملف نقي: يُستخدم في المتصفح والسيرفر. قائمة الأعمدة هنا يجب أن تطابق
// القائمة داخل الدالة cms_apply_change في ملف الـ migration.
import { z } from "zod";

export type EntityType = "article" | "course";
export type ContentStatus = "draft" | "pending_approval" | "published" | "rejected";
export type RevisionAction = "create" | "update" | "delete";

export const ENTITY_TABLE: Record<EntityType, "articles" | "courses"> = {
  article: "articles",
  course: "courses",
};
export const ENTITY_PUBLIC_BASE: Record<EntityType, string> = { article: "/blog", course: "/courses" };
export const ENTITY_LABEL_AR: Record<EntityType, string> = { article: "مقال", course: "كورس" };

export const STATUS_LABEL_AR: Record<ContentStatus, string> = {
  draft: "مسودة",
  pending_approval: "بانتظار الموافقة",
  published: "منشور",
  rejected: "مرفوض",
};
export const ACTION_LABEL_AR: Record<RevisionAction, string> = {
  create: "إنشاء",
  update: "تعديل",
  delete: "حذف",
};

export const SEO_LIMITS = {
  metaTitle: { min: 50, max: 60, hardMax: 70 },
  metaDescription: { min: 150, max: 160, hardMax: 200 },
  minWords: 300,
} as const;

export interface SeoFields {
  slug: string;
  title: string;
  category: string;
  categories: string[];
  tags: string[];
  cover_image: string;
  cover_image_alt: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  word_count: number;
  reading_time: string;
}

export interface ArticlePayload extends SeoFields {
  excerpt: string;
  content: string;
  author: string;
  author_role: string;
}

export interface CourseLevel {
  level: string;
  title: string;
  description: string;
}

export interface CoursePayload extends SeoFields {
  subtitle: string;
  badge: string;
  icon: string;
  summary: string;
  body: string;
  prerequisites: string;
  duration: string;
  levels: CourseLevel[];
  learning_outcomes: string[];
  books_materials: string[];
}

export type ContentPayload = ArticlePayload | CoursePayload;

const seoDefaults: SeoFields = {
  slug: "",
  title: "",
  category: "",
  categories: [],
  tags: [],
  cover_image: "",
  cover_image_alt: "",
  meta_title: "",
  meta_description: "",
  focus_keyword: "",
  og_title: "",
  og_description: "",
  og_image: "",
  canonical_url: "",
  robots_index: true,
  robots_follow: true,
  word_count: 0,
  reading_time: "",
};

export const ARTICLE_DEFAULTS: ArticlePayload = {
  ...seoDefaults,
  excerpt: "",
  content: "",
  author: "Fazakkir Academic Team",
  author_role: "Azhari Instructor",
};

export const COURSE_DEFAULTS: CoursePayload = {
  ...seoDefaults,
  subtitle: "",
  badge: "",
  icon: "fa-book-open",
  summary: "",
  body: "",
  prerequisites: "None",
  duration: "Custom",
  levels: [{ level: "Level 1", title: "", description: "" }],
  learning_outcomes: [],
  books_materials: [],
};

export const ARTICLE_FIELDS = Object.keys(ARTICLE_DEFAULTS) as (keyof ArticlePayload)[];
export const COURSE_FIELDS = Object.keys(COURSE_DEFAULTS) as (keyof CoursePayload)[];

export function defaultsFor(type: EntityType): ContentPayload {
  return type === "article" ? { ...ARTICLE_DEFAULTS } : { ...COURSE_DEFAULTS, levels: [...COURSE_DEFAULTS.levels] };
}

/** حقل النص الطويل الذي يحرَّر بالمحرر الغني */
export const bodyField = (type: EntityType): "content" | "body" => (type === "article" ? "content" : "body");

export function getBody(type: EntityType, p: Partial<ContentPayload>): string {
  const rec = p as Record<string, unknown>;
  return String(rec[bodyField(type)] ?? "");
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

/** يحوّل صفاً من قاعدة البيانات (أو payload مراجعة) إلى payload كامل بقيم افتراضية */
export function toPayload(type: EntityType, row: Record<string, unknown> | null | undefined): ContentPayload {
  const base = defaultsFor(type) as unknown as Record<string, unknown>;
  const src = row ?? {};
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(base)) {
    const def = base[key];
    const val = src[key];
    if (val === null || val === undefined) {
      out[key] = def;
    } else if (Array.isArray(def)) {
      out[key] = key === "levels" ? normalizeLevels(val) : asStringArray(val);
    } else if (typeof def === "boolean") {
      out[key] = val !== false;
    } else if (typeof def === "number") {
      out[key] = Number(val) || 0;
    } else {
      out[key] = String(val);
    }
  }
  const cats = out.categories as string[];
  if (cats.length === 0 && out.category) out.categories = [String(out.category)];
  return out as unknown as ContentPayload;
}

function normalizeLevels(v: unknown): CourseLevel[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      level: String(x.level ?? ""),
      title: String(x.title ?? ""),
      description: String(x.description ?? ""),
    }));
}

// ---------------------------------------------------------------------
// التحقق (zod)
// ---------------------------------------------------------------------
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const urlOrPath = (label: string) =>
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v) || /^\/[^\s]*$/.test(v), {
      message: `${label}: يجب أن يكون رابطاً كاملاً (https://…) أو مساراً يبدأ بـ /`,
    });

const tagList = z.array(z.string().trim().min(1).max(60)).max(20);

const seoShape = {
  slug: z
    .string()
    .trim()
    .min(1, "الرابط (Slug) مطلوب")
    .max(120, "الرابط طويل جداً")
    .regex(SLUG_RE, "الرابط يقبل أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط"),
  title: z.string().trim().min(3, "العنوان مطلوب (3 أحرف على الأقل)").max(200, "العنوان طويل جداً"),
  category: z.string().trim().max(80),
  categories: tagList,
  tags: tagList,
  cover_image: urlOrPath("الصورة البارزة"),
  cover_image_alt: z.string().trim().max(200, "النص البديل طويل جداً"),
  meta_title: z.string().trim().max(SEO_LIMITS.metaTitle.hardMax, `عنوان الميتا يجب ألا يتجاوز ${SEO_LIMITS.metaTitle.hardMax} حرفاً`),
  meta_description: z
    .string()
    .trim()
    .max(SEO_LIMITS.metaDescription.hardMax, `وصف الميتا يجب ألا يتجاوز ${SEO_LIMITS.metaDescription.hardMax} حرفاً`),
  focus_keyword: z.string().trim().max(100),
  og_title: z.string().trim().max(120),
  og_description: z.string().trim().max(300),
  og_image: urlOrPath("صورة المشاركة"),
  canonical_url: urlOrPath("الرابط الأساسي (Canonical)"),
  robots_index: z.boolean(),
  robots_follow: z.boolean(),
  word_count: z.number().int().min(0),
  reading_time: z.string().max(40),
};

const articleShape = {
  ...seoShape,
  excerpt: z.string().trim().max(400, "المقتطف طويل جداً"),
  content: z.string().max(400_000, "المحتوى كبير جداً"),
  author: z.string().trim().max(120),
  author_role: z.string().trim().max(160),
};

const courseShape = {
  ...seoShape,
  subtitle: z.string().trim().max(300),
  badge: z.string().trim().max(80),
  icon: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9- ]*$/i, "اسم الأيقونة غير صالح"),
  summary: z.string().trim().max(3000),
  body: z.string().max(400_000, "المحتوى كبير جداً"),
  prerequisites: z.string().trim().max(300),
  duration: z.string().trim().max(120),
  levels: z
    .array(
      z.object({
        level: z.string().trim().max(60),
        title: z.string().trim().max(200),
        description: z.string().trim().max(1000),
      }),
    )
    .max(30),
  learning_outcomes: z.array(z.string().trim().min(1).max(300)).max(40),
  books_materials: z.array(z.string().trim().min(1).max(300)).max(40),
};

export const articleSchema = z.object(articleShape);
export const courseSchema = z.object(courseShape);

export type FieldErrors = Record<string, string>;

export interface ValidationResult {
  ok: boolean;
  payload: ContentPayload;
  errors: FieldErrors;
}

/**
 * strict = true عند الإرسال للمراجعة أو النشر (تُفرض شروط النشر كاملة).
 * strict = false عند حفظ المسودة (يكفي عنوان ورابط صالحان).
 */
export function validatePayload(type: EntityType, input: unknown, strict: boolean): ValidationResult {
  const candidate = toPayload(type, (input ?? {}) as Record<string, unknown>);
  const schema = type === "article" ? articleSchema : courseSchema;
  const parsed = schema.safeParse(candidate);
  const errors: FieldErrors = {};

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!errors[key]) errors[key] = issue.message;
    }
  }

  const p = (parsed.success ? parsed.data : candidate) as ContentPayload;

  // النص البديل إلزامي متى وُجدت صورة بارزة (حتى في المسودة)
  if (p.cover_image && !p.cover_image_alt.trim()) {
    errors.cover_image_alt = "النص البديل (Alt Text) إلزامي للصورة البارزة";
  }

  if (strict) {
    if (type === "article") {
      const a = p as ArticlePayload;
      if (a.word_count < 1) errors.content = "محتوى المقال مطلوب";
      if (!a.excerpt.trim()) errors.excerpt = "المقتطف مطلوب";
    } else {
      const c = p as CoursePayload;
      if (!c.summary.trim()) errors.summary = "ملخص الكورس مطلوب";
    }
    if (!p.meta_title.trim()) errors.meta_title = "عنوان الميتا مطلوب قبل الإرسال";
    if (!p.meta_description.trim()) errors.meta_description = "وصف الميتا مطلوب قبل الإرسال";
    if (p.categories.length === 0) errors.categories = "اختر تصنيفاً واحداً على الأقل";
  }

  return { ok: Object.keys(errors).length === 0, payload: p, errors };
}
