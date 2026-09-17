import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      key,
      slug,
      title,
      subtitle,
      badge,
      category,
      icon,
      summary,
      prerequisites,
      duration,
      levels,
      learning_outcomes,
      books_materials,
    } = body;

    // التحقق من مفتاح الأدمن السري
    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Title and Slug are required" },
        { status: 400 }
      );
    }

    // إدراج الكورس الجديد في Supabase
    const { data, error } = await supabase.from("courses").insert([
      {
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
        title,
        subtitle,
        badge,
        category,
        icon: icon || "fa-book-open",
        summary,
        prerequisites,
        duration,
        levels: levels || [],
        learning_outcomes: learning_outcomes || [],
        books_materials: books_materials || [],
      },
    ]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}