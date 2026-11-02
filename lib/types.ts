export type PublishStatus = "draft" | "published" | "archived";
export type Audience = "adults" | "children" | "everyone";
export type Format = "online" | "in_person" | "hybrid";
export type SessionKind = "one_time" | "recurring" | "workshop" | "satsang" | "programme";
export type UserRole = "student" | "editor" | "admin";

export interface Course {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string | null;
  summary_en: string | null;
  summary_hi: string | null;
  overview_en: string | null;
  overview_hi: string | null;
  suitable_for: string[];
  outcomes: string[];
  audience: Audience;
  format: Format | null;
  language: string | null;
  duration_text: string | null;
  starts_on: string | null;
  ends_on: string | null;
  timings_text: string | null;
  facilitator: string | null;
  prerequisites: string | null;
  is_free: boolean | null;
  fee_paise: number | null;
  recordings_included: boolean | null;
  materials_included: boolean | null;
  kit_product_id: string | null;
  kit_required: boolean | null;
  status: PublishStatus;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface CourseModule {
  id: string;
  course_id: string;
  position: number;
  title_en: string;
  title_hi: string | null;
  description: string | null;
}

export interface CourseFaq {
  id: string;
  course_id: string;
  position: number;
  question: string;
  answer: string;
}

export interface Session {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string | null;
  description: string | null;
  kind: SessionKind;
  audience: Audience;
  format: Format;
  course_id: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  recurrence_text: string | null;
  city: string | null;
  venue: string | null;
  facilitator: string | null;
  capacity: number | null;
  is_free: boolean | null;
  fee_paise: number | null;
  recording_available: boolean | null;
  cancellation_note: string | null;
  status: PublishStatus;
}

export interface Product {
  id: string;
  slug: string;
  category: "rudraksha" | "course_kit";
  title_en: string;
  title_hi: string | null;
  description: string | null;
  care_instructions: string | null;
  verified_details: Record<string, string>;
  related_course_id: string | null;
  kit_contents: string[];
  kit_required: boolean | null;
  weight_grams: number | null;
  hsn_code: string | null;
  gst_rate: number | null;
  status: PublishStatus;
  sort_order: number;
}

export interface Variant {
  id: string;
  product_id: string;
  label: string;
  sku: string | null;
  price_paise: number;
  stock: number;
  is_active: boolean;
  position: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  position: number;
}

export interface Resource {
  id: string;
  slug: string;
  title_en: string;
  title_hi: string | null;
  summary: string | null;
  topic: "hanuman" | "ram" | "meditation" | "living";
  type: "article" | "reflection" | "video" | "audio" | "study_material";
  access: "free" | "students";
  course_id: string | null;
  cover_path: string | null;
  status: PublishStatus;
  published_at: string | null;
}

export interface Verse {
  id: string;
  topic: Resource["topic"];
  text_original: string;
  transliteration: string | null;
  translation: string | null;
  source: string;
  reflection: string | null;
  reflection_approved: boolean;
  status: PublishStatus;
  sort_order: number;
}

export interface Announcement {
  id: string;
  scope: "general" | "gurukul";
  title_en: string;
  title_hi: string | null;
  body: string | null;
  status: PublishStatus;
  published_at: string | null;
}

export interface GalleryPhoto {
  id: string;
  storage_path: string;
  alt_text: string;
  caption: string | null;
  status: PublishStatus;
}

export type SiteContent = Record<string, { en: string | null; hi: string | null; confirmed: boolean }>;
