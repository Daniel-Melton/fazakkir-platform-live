import { redirect } from "next/navigation";

// لوحة المقالات القديمة (بالمفتاح المشترك) استُبدلت بمساحة العمل الجديدة المحمية بالأدوار.
export default function LegacyArticlesAdmin() {
  redirect("/dashboard/content");
}
