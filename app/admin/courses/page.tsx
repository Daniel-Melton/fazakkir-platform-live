import { redirect } from "next/navigation";

// لوحة الكورسات القديمة (بالمفتاح المشترك) استُبدلت بمساحة العمل الجديدة المحمية بالأدوار.
export default function LegacyCoursesAdmin() {
  redirect("/dashboard/content");
}
