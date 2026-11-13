"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { btn, inputClass } from "./ui";

const MAX_WIDTH = 1920;

/** تحويل الصورة إلى WebP داخل المتصفح (تصغير حتى 1920px) قبل الرفع — يقلل زمن الرفع والحجم */
export async function convertToWebP(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    // بعض المتصفحات القديمة تعيد PNG بدل WebP — السيرفر سيتولى التحويل حينها
    if (!blob || blob.type !== "image/webp") return file;
    if (file.type === "image/webp" && blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export interface UploadedImage {
  url: string;
  width: number;
  height: number;
  bytes: number;
}

export async function uploadImage(file: File, folder: "articles" | "courses" | "social"): Promise<UploadedImage> {
  const webp = await convertToWebP(file);
  const body = new FormData();
  body.append("file", webp);
  body.append("folder", folder);
  const res = await fetch("/api/cms/upload", { method: "POST", body });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error ?? "فشل رفع الصورة");
  return json.data as UploadedImage;
}

export default function ImageUploader({
  value,
  onChange,
  folder,
  label,
  alt,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "articles" | "courses" | "social";
  label: string;
  alt?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await uploadImage(file, folder);
      onChange(res.url);
      const saved = file.size > 0 ? Math.round((1 - res.bytes / file.size) * 100) : 0;
      setInfo(
        `WebP · ${res.width}×${res.height} · ${Math.round(res.bytes / 1024)}KB${saved > 0 ? ` (أصغر بنسبة ${saved}%)` : ""}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={clsx(
          "flex flex-col gap-4 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center",
          value ? "border-slate-200 bg-slate-50" : "border-slate-300 bg-white",
        )}
      >
        <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 sm:w-48">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={alt || ""} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-slate-500">لا توجد صورة</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy || disabled} onClick={() => inputRef.current?.click()} className={btn.secondary}>
              {busy ? "جارٍ التحويل والرفع…" : value ? "استبدال الصورة" : `رفع ${label}`}
            </button>
            {value && (
              <button type="button" disabled={busy || disabled} onClick={() => onChange("")} className={btn.danger}>
                إزالة
              </button>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            اسحب الصورة هنا أو اخترها. تُحوَّل تلقائياً إلى WebP وتُصغَّر حتى 1920px. الحد الأقصى 8MB.
          </p>
          {info && <p className="text-xs font-semibold text-emerald-700" dir="ltr">{info}</p>}
          {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>
      </div>
      <input
        dir="ltr"
        type="url"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="…أو ألصق رابط صورة https://"
        aria-label={`رابط ${label}`}
        className={clsx(inputClass, "font-mono text-xs")}
      />
    </div>
  );
}
