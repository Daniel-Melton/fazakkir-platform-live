"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { uploadImage } from "./ImageUploader";

// ألوان النص المستخدمة في المقالات القديمة (<span class="text-emerald-700 font-semibold">)
const TONES = [
  { key: "emerald", label: "أخضر", cls: "text-emerald-700 font-semibold", swatch: "bg-emerald-600" },
  { key: "amber", label: "كهرماني", cls: "text-amber-700 font-semibold", swatch: "bg-amber-600" },
  { key: "rose", label: "أحمر", cls: "text-rose-700 font-semibold", swatch: "bg-rose-600" },
] as const;

const TextTone = Mark.create({
  name: "textTone",
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => {
          const cls = el.getAttribute("class") ?? "";
          return TONES.find((t) => cls.includes(t.cls.split(" ")[0]))?.cls ?? null;
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[class]",
        getAttrs: (el) => (TONES.some((t) => (el as HTMLElement).className.includes(t.cls.split(" ")[0])) ? null : false),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={clsx(
        "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition disabled:opacity-40",
        active ? "bg-emerald-700 text-white" : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100",
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />;

function Toolbar({ editor, folder }: { editor: Editor; folder: "articles" | "courses" }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // إعادة الرسم عند تغيّر التحديد فقط للحقول التي نعرض حالتها
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      tone: (e.getAttributes("textTone").class as string | null) ?? null,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("رابط (اتركه فارغاً لإزالة الرابط):", prev);
    if (url === null) return;
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(href)) {
      window.alert("الرابط يجب أن يبدأ بـ https:// أو /");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const insertImage = async (file?: File | null) => {
    if (!file) return;
    // النص البديل إلزامي لكل صورة داخل المحتوى
    const alt = window.prompt("النص البديل للصورة (Alt Text) — إلزامي، صِف محتوى الصورة:", "");
    if (!alt || !alt.trim()) {
      window.alert("لم تُدرج الصورة: النص البديل إلزامي.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImage(file, folder);
      editor.chain().focus().setImage({ src: res.url, alt: alt.trim() }).run();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const insertYoutube = () => {
    const url = window.prompt("رابط فيديو YouTube:", "");
    if (url?.trim()) editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
  };

  return (
    <div
      role="toolbar"
      aria-label="أدوات تنسيق النص"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-slate-300 bg-slate-50 p-2"
    >
      <ToolbarButton label="عنوان فرعي H2" active={s.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton label="عنوان فرعي H3" active={s.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <ToolbarButton label="عنوان فرعي H4" active={s.h4} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        H4
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="غامق" active={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton label="مائل" active={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton label="تسطير" active={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </ToolbarButton>
      {TONES.map((t) => (
        <ToolbarButton
          key={t.key}
          label={`لون ${t.label}`}
          active={s.tone === t.cls}
          onClick={() =>
            s.tone === t.cls
              ? editor.chain().focus().unsetMark("textTone").run()
              : editor.chain().focus().setMark("textTone", { class: t.cls }).run()
          }
        >
          <span className={clsx("h-3 w-3 rounded-full", t.swatch)} />
        </ToolbarButton>
      ))}
      <Divider />
      <ToolbarButton label="قائمة نقطية" active={s.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • ―
      </ToolbarButton>
      <ToolbarButton label="قائمة مرقمة" active={s.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolbarButton>
      <ToolbarButton label="اقتباس / آية" active={s.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </ToolbarButton>
      <ToolbarButton label="رابط" active={s.link} onClick={setLink}>
        🔗
      </ToolbarButton>
      <Divider />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => void insertImage(e.target.files?.[0])}
      />
      <ToolbarButton label="إدراج صورة (تُحوَّل إلى WebP)" disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading ? "…جارٍ الرفع" : "صورة"}
      </ToolbarButton>
      <ToolbarButton label="إدراج فيديو YouTube" onClick={insertYoutube}>
        فيديو
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="تراجع" disabled={!s.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton label="إعادة" disabled={!s.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>
    </div>
  );
}

/**
 * محرر نص غني يفرض هيكل عناوين نظيفاً:
 * H1 غير متاح إطلاقاً (محجوز لعنوان الصفحة)؛ المتاح H2 / H3 / H4 فقط.
 */
export default function RichTextEditor({
  value,
  onChange,
  folder,
  placeholder,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  folder: "articles" | "courses";
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false, // مطلوب مع SSR في Next.js
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } },
      }),
      TextTone,
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: placeholder ?? "اكتب المحتوى هنا…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        dir: "auto",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel,
        class:
          "prose prose-slate max-w-none min-h-[360px] px-5 py-4 text-start outline-none prose-headings:font-extrabold prose-h2:text-2xl prose-h3:text-xl prose-h3:text-emerald-900 prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50 prose-blockquote:not-italic prose-blockquote:rounded-xl prose-blockquote:py-1 prose-img:rounded-xl",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.isEmpty ? "" : e.getHTML());
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div>
      {editor && !disabled && <Toolbar editor={editor} folder={folder} />}
      <div
        className={clsx(
          "cms-editor border border-slate-300 bg-white transition focus-within:border-emerald-600",
          editor && !disabled ? "rounded-b-xl" : "rounded-xl",
          disabled && "bg-slate-50",
        )}
      >
        {editor ? <EditorContent editor={editor} /> : <div className="min-h-[360px] animate-pulse bg-slate-50" />}
      </div>
    </div>
  );
}
