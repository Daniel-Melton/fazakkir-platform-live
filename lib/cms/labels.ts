// أسماء الحقول بالعربية (تُستخدم في عرض الفروقات)
export const FIELD_LABEL_AR: Record<string, string> = {
  title: "العنوان",
  slug: "الرابط (Slug)",
  excerpt: "المقتطف",
  content: "نص المقال",
  body: "الوصف التفصيلي",
  subtitle: "العنوان الفرعي",
  summary: "ملخص الكورس",
  badge: "الشارة",
  icon: "الأيقونة",
  duration: "المدة",
  prerequisites: "المتطلبات السابقة",
  levels: "مستويات المنهج",
  learning_outcomes: "مخرجات التعلم",
  books_materials: "الكتب والمواد",
  author: "الكاتب",
  author_role: "صفة الكاتب",
  category: "التصنيف الرئيسي",
  categories: "التصنيفات",
  tags: "الوسوم",
  cover_image: "الصورة البارزة",
  cover_image_alt: "النص البديل للصورة",
  meta_title: "عنوان الميتا",
  meta_description: "وصف الميتا",
  focus_keyword: "الكلمة المفتاحية",
  og_title: "OG Title",
  og_description: "OG Description",
  og_image: "OG Image",
  canonical_url: "Canonical URL",
  robots_index: "Robots: index",
  robots_follow: "Robots: follow",
  word_count: "عدد الكلمات",
  reading_time: "زمن القراءة",
};

export const LONG_TEXT_FIELDS = new Set(["content", "body"]);
export const IMAGE_FIELDS = new Set(["cover_image", "og_image"]);
/** حقول محسوبة تلقائياً — لا تُعرض كفروقات مستقلة */
export const DERIVED_FIELDS = new Set(["category"]);
