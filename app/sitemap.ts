import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";
import { PAGES, SITE_URL, type PageSeo } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = (Object.values(PAGES) as PageSeo[])
    .filter((p) => p.live !== false && p.index !== false)
    .map((p) => ({
      url: `${SITE_URL}${p.path}`,
      changeFrequency: "monthly" as const,
      priority: p.priority ?? 0.6,
    }));

  const { data: courses } = await supabase.from("courses").select("slug, created_at");
  const coursePages: MetadataRoute.Sitemap = (courses || []).map((course) => ({
    url: `${SITE_URL}/courses/${course.slug}`,
    lastModified: new Date(course.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const { data: articles } = await supabase.from("articles").select("slug, created_at").eq("published", true);
  const articlePages: MetadataRoute.Sitemap = (articles || []).map((art) => ({
    url: `${SITE_URL}/blog/${art.slug}`,
    lastModified: new Date(art.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...coursePages, ...articlePages];
}
