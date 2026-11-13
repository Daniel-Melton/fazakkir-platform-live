import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { apiError, apiSuccess } from "@/lib/api-response";
import { assertRole, AuthError } from "@/lib/auth/session";
import { CONTENT_STAFF_ROLES } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "blog-images";
const MAX_BYTES = 8 * 1024 * 1024; // 8MB قبل التحويل
const MAX_WIDTH = 1920;
const FOLDERS = new Set(["articles", "courses", "social"]);

/**
 * رفع صورة (محرر/مدير فقط). تُحوَّل كل الصور على السيرفر إلى WebP
 * بعرض أقصى 1920px — حتى لو لم يحوّلها المتصفح — لتحسين Core Web Vitals.
 */
export async function POST(req: Request) {
  try {
    await assertRole(CONTENT_STAFF_ROLES);

    const form = await req.formData();
    const file = form.get("file");
    const folderRaw = String(form.get("folder") ?? "articles");
    const folder = FOLDERS.has(folderRaw) ? folderRaw : "articles";

    if (!(file instanceof File)) return apiError("لم يتم إرفاق ملف", 400);
    if (file.size === 0) return apiError("الملف فارغ", 400);
    if (file.size > MAX_BYTES) return apiError("حجم الصورة يتجاوز 8MB", 413);

    const input = Buffer.from(await file.arrayBuffer());

    let output: Buffer;
    let width = 0;
    let height = 0;
    try {
      // sharp يتحقق من أن الملف صورة حقيقية (لا نعتمد على الامتداد أو نوع MIME المُرسَل)
      const image = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
      const meta = await image.metadata();
      if (!meta.format || !["jpeg", "png", "webp", "avif", "gif", "tiff"].includes(meta.format)) {
        return apiError("صيغة الصورة غير مدعومة (JPG / PNG / WebP / AVIF / GIF)", 415);
      }
      const result = await image
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      output = result.data;
      width = result.info.width;
      height = result.info.height;
    } catch {
      return apiError("الملف ليس صورة صالحة", 415);
    }

    const path = `${folder}/${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(path, output, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return apiError(`فشل رفع الصورة: ${error.message}`, 500);

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return apiSuccess({ url: data.publicUrl, width, height, bytes: output.length, format: "webp" }, 201);
  } catch (err) {
    if (err instanceof AuthError) return apiError(err.message, err.status);
    console.error("[cms] upload failed:", err);
    return apiError("حدث خطأ أثناء رفع الصورة", 500);
  }
}
