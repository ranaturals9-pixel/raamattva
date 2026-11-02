import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fixed = ["", "/about", "/gurukul", "/courses", "/sessions", "/shop", "/wisdom", "/contact", "/privacy", "/terms", "/shipping", "/refunds"].map((p) => ({ url: `${site}${p}` }));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fixed;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [{ data: courses }, { data: products }, { data: resources }] = await Promise.all([
    db.from("courses").select("slug").eq("status", "published"),
    db.from("products").select("slug").eq("status", "published"),
    db.from("resources").select("slug").eq("status", "published"),
  ]);
  return [
    ...fixed,
    ...(courses ?? []).map((c) => ({ url: `${site}/courses/${c.slug}` })),
    ...(products ?? []).map((p) => ({ url: `${site}/shop/${p.slug}` })),
    ...(resources ?? []).map((r) => ({ url: `${site}/wisdom/${r.slug}` })),
  ];
}
