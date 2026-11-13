// تحويل المحتوى القديم (Markdown) إلى HTML — يعمل في المتصفح والسيرفر.
import { marked } from "marked";

export function looksLikeHtml(raw: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|figure|img|div|pre|hr|table)\b/i.test(raw);
}

/** المقالات القديمة مخزنة Markdown (مع \n حرفية أحياناً)؛ المحرر الجديد يعمل بـ HTML */
export function toEditorHtml(input: string): string {
  const raw = (input ?? "").replace(/\\n/g, "\n").trim();
  if (!raw) return "";
  if (looksLikeHtml(raw)) return raw;
  return marked.parse(raw, { async: false, gfm: true, breaks: false }) as string;
}
