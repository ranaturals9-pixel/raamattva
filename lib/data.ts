import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Announcement, Course, CourseFaq, CourseModule, GalleryPhoto, Product, ProductImage,
  Resource, Session, SiteContent, Variant, Verse,
} from "@/lib/types";

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("key, value_en, value_hi, is_confirmed");
  const out: SiteContent = {};
  for (const r of data ?? []) out[r.key] = { en: r.value_en, hi: r.value_hi, confirmed: r.is_confirmed };
  return out;
});

export const getCourses = cache(async (): Promise<Course[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("status", "published").order("sort_order");
  return (data ?? []) as Course[];
});

export async function getCourse(slug: string) {
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!course) return null;
  const [{ data: modules }, { data: faqs }, kit] = await Promise.all([
    supabase.from("course_modules").select("*").eq("course_id", course.id).order("position"),
    supabase.from("course_faqs").select("*").eq("course_id", course.id).order("position"),
    course.kit_product_id
      ? supabase.from("products").select("id, slug, title_en, title_hi").eq("id", course.kit_product_id).eq("status", "published").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    course: course as Course,
    modules: (modules ?? []) as CourseModule[],
    faqs: (faqs ?? []) as CourseFaq[],
    kit: kit.data as Pick<Product, "id" | "slug" | "title_en" | "title_hi"> | null,
  };
}

export type SessionWithSeats = Session & { seats_left: number | null; course_slug: string | null; course_title: string | null };

/** Upcoming sessions: undated ones (to be announced / recurring) and anything that has not ended. */
export const getSessions = cache(async (): Promise<SessionWithSeats[]> => {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [{ data: sessions }, { data: seats }, courses] = await Promise.all([
    supabase.from("sessions").select("*").eq("status", "published").or(`starts_at.is.null,starts_at.gte.${since}`),
    supabase.from("session_availability").select("session_id, seats_left"),
    getCourses(),
  ]);
  const seatMap = new Map((seats ?? []).map((s) => [s.session_id, s.seats_left as number | null]));
  const list = ((sessions ?? []) as Session[]).map((s) => {
    const c = courses.find((x) => x.id === s.course_id);
    return { ...s, seats_left: seatMap.get(s.id) ?? null, course_slug: c?.slug ?? null, course_title: c?.title_en ?? null };
  });
  // Dated sessions first, soonest first; then recurring; then dates to be announced.
  return list.sort((a, b) => {
    const rank = (s: Session) => (s.starts_at ? 0 : s.recurrence_text ? 1 : 2);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.starts_at && b.starts_at) return a.starts_at.localeCompare(b.starts_at);
    return a.title_en.localeCompare(b.title_en);
  });
});

export type ProductCard = Product & { image: ProductImage | null; from_paise: number | null; in_stock: boolean };

export const getProducts = cache(async (): Promise<ProductCard[]> => {
  const supabase = await createClient();
  const [{ data: products }, { data: variants }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("status", "published").order("sort_order"),
    supabase.from("product_variants").select("product_id, price_paise, stock").eq("is_active", true),
    supabase.from("product_images").select("*").order("position"),
  ]);
  return ((products ?? []) as Product[]).map((p) => {
    const vs = (variants ?? []).filter((v) => v.product_id === p.id);
    return {
      ...p,
      image: ((images ?? []) as ProductImage[]).find((i) => i.product_id === p.id) ?? null,
      from_paise: vs.length ? Math.min(...vs.map((v) => v.price_paise)) : null,
      in_stock: vs.some((v) => v.stock > 0),
    };
  });
});

export async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!product) return null;
  const [{ data: variants }, { data: images }, course] = await Promise.all([
    supabase.from("product_variants").select("*").eq("product_id", product.id).eq("is_active", true).order("position"),
    supabase.from("product_images").select("*").eq("product_id", product.id).order("position"),
    product.related_course_id
      ? supabase.from("courses").select("slug, title_en, title_hi").eq("id", product.related_course_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    product: product as Product,
    variants: (variants ?? []) as Variant[],
    images: (images ?? []) as ProductImage[],
    course: course.data as { slug: string; title_en: string; title_hi: string | null } | null,
  };
}

export const getResources = cache(async (): Promise<Resource[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("*").eq("status", "published").order("published_at", { ascending: false });
  return (data ?? []) as Resource[];
});

export async function getResource(slug: string) {
  const supabase = await createClient();
  const { data: resource } = await supabase.from("resources").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!resource) return null;
  // Row Level Security returns the body only to visitors entitled to it.
  const { data: body } = await supabase.from("resource_bodies").select("*").eq("resource_id", resource.id).maybeSingle();
  return { resource: resource as Resource, body: body as { body: string | null; video_id: string | null; file_path: string | null } | null };
}

export const getVerses = cache(async (): Promise<Verse[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("verses").select("*").eq("status", "published").order("sort_order");
  return (data ?? []) as Verse[];
});

export async function getAnnouncements(scope?: Announcement["scope"]): Promise<Announcement[]> {
  const supabase = await createClient();
  let q = supabase.from("announcements").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(6);
  if (scope) q = q.eq("scope", scope);
  const { data } = await q;
  return (data ?? []) as Announcement[];
}

export async function getGallery(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_photos").select("id, storage_path, alt_text, caption, status").eq("status", "published").order("taken_on", { ascending: false }).limit(12);
  return (data ?? []) as GalleryPhoto[];
}
