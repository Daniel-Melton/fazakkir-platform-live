import "server-only";
import sanitizeHtml from "sanitize-html";
import { toEditorHtml } from "./markdown";

// المحتوى يُعرض في الموقع العام كـ HTML خام، لذلك يُنظَّف على السيرفر قبل الحفظ
// (حماية من XSS المخزَّن حتى لو كان المصدر محرراً موثوقاً).
const TEXT_COLOR_CLASSES = ["text-emerald-700", "text-amber-700", "text-rose-700", "font-semibold"];

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "code", "pre",
    "blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption", "span", "div", "iframe",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    span: ["class"],
    div: ["data-youtube-video"],
    iframe: ["src", "width", "height", "allowfullscreen", "title", "loading"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedClasses: { span: TEXT_COLOR_CLASSES },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  allowProtocolRelative: false,
  // H1 محجوز لعنوان الصفحة: أي H1 داخل المحتوى يُحوَّل إلى H2
  transformTags: {
    h1: "h2",
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?fazakkir\.com/i.test(href);
      return {
        tagName,
        attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
  },
};

/** يحوّل Markdown القديم إلى HTML عند الحاجة ثم ينظّف الناتج */
export function sanitizeContentHtml(input: string): string {
  const html = toEditorHtml(input);
  if (!html) return "";
  return sanitizeHtml(html, options).trim();
}

/** نص عادي بلا أي وسوم (للعناوين والأوصاف) */
export function plainText(input: string): string {
  return sanitizeHtml(input ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}
