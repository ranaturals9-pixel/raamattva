/**
 * The admin area is driven by these definitions: each entry is one kind of
 * thing the team manages, with the fields its form shows. Adding a field here
 * adds it to the form; the column must exist in the database.
 */

export type Option = { value: string; label: string };

export type Field =
  | { name: string; label: string; type: "text" | "textarea" | "slug" | "date" | "datetime" | "number" | "money" | "lines"; required?: boolean; help?: string; rows?: number }
  | { name: string; label: string; type: "select"; options: Option[]; required?: boolean; help?: string; nullable?: boolean }
  | { name: string; label: string; type: "ref"; table: string; labelColumn: string; filter?: [string, string]; help?: string }
  | { name: string; label: string; type: "tri"; yes: string; no: string; help?: string }
  | { name: string; label: string; type: "bool"; help?: string };

export type Section = { title: string; fields: Field[] };

export type EntityConfig = {
  key: string;
  table: string;
  label: string;
  singular: string;
  orderBy: [string, boolean];
  listColumns: { name: string; label: string; kind?: "status" | "money" | "date" | "datetime" | "bool" }[];
  sections: Section[];
  extras?: ("modules" | "faqs" | "meeting" | "variants" | "images" | "facts" | "body" | "registrations")[];
  adminOnly?: boolean;
};

const STATUS: Option[] = [
  { value: "draft", label: "Draft (hidden)" },
  { value: "published", label: "Published (visible)" },
  { value: "archived", label: "Archived (hidden)" },
];
const AUDIENCE: Option[] = [
  { value: "adults", label: "Adults" },
  { value: "children", label: "Children (guardian registers)" },
  { value: "everyone", label: "Everyone" },
];
const FORMAT: Option[] = [
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "hybrid", label: "Online and in person" },
];
const TOPIC: Option[] = [
  { value: "hanuman", label: "Hanuman Saadhna" },
  { value: "ram", label: "Raam Saadhna" },
  { value: "meditation", label: "Meditation" },
  { value: "living", label: "Spiritual Living" },
];

const FEE_HELP = "Leave as 'To be confirmed' until decided: registration stays closed until then.";

export const ENTITIES: Record<string, EntityConfig> = {
  courses: {
    key: "courses",
    table: "courses",
    label: "Courses",
    singular: "course",
    orderBy: ["sort_order", true],
    listColumns: [
      { name: "title_en", label: "Course" },
      { name: "status", label: "Status", kind: "status" },
      { name: "fee_paise", label: "Fee", kind: "money" },
    ],
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title_en", label: "Title (English)", type: "text", required: true },
          { name: "title_hi", label: "Title (Hindi)", type: "text" },
          { name: "slug", label: "Web address", type: "slug", help: "Used in the link, e.g. hanuman-saadhna. Filled from the title if left empty." },
          { name: "status", label: "Visibility", type: "select", options: STATUS, required: true },
          { name: "sort_order", label: "Order on the page", type: "number" },
        ],
      },
      {
        title: "Description",
        fields: [
          { name: "summary_en", label: "Short summary (English)", type: "textarea", rows: 2 },
          { name: "summary_hi", label: "Short summary (Hindi)", type: "textarea", rows: 2 },
          { name: "overview_en", label: "Overview and purpose (English)", type: "textarea", rows: 6 },
          { name: "overview_hi", label: "Overview and purpose (Hindi)", type: "textarea", rows: 6 },
          { name: "suitable_for", label: "Who it is for", type: "lines", help: "One per line." },
          { name: "outcomes", label: "What participants will learn", type: "lines", help: "One per line." },
        ],
      },
      {
        title: "Practical details",
        fields: [
          { name: "audience", label: "Audience", type: "select", options: AUDIENCE, required: true },
          { name: "format", label: "Format", type: "select", options: FORMAT, nullable: true },
          { name: "language", label: "Language", type: "text" },
          { name: "duration_text", label: "Duration", type: "text", help: "e.g. 6 weeks, 12 sessions" },
          { name: "starts_on", label: "Start date", type: "date" },
          { name: "ends_on", label: "End date", type: "date" },
          { name: "timings_text", label: "Timings (IST)", type: "text", help: "e.g. Saturdays 7 to 8 pm" },
          { name: "facilitator", label: "Teacher or facilitator", type: "text" },
          { name: "prerequisites", label: "Prerequisites", type: "textarea", rows: 2 },
        ],
      },
      {
        title: "Fee and inclusions",
        fields: [
          { name: "is_free", label: "Fee", type: "tri", yes: "Free", no: "Paid", help: FEE_HELP },
          { name: "fee_paise", label: "Fee amount (₹)", type: "money", help: "Only for paid courses." },
          { name: "recordings_included", label: "Recordings", type: "tri", yes: "Included", no: "Not included" },
          { name: "materials_included", label: "Study material", type: "tri", yes: "Included", no: "Not included" },
          { name: "kit_product_id", label: "Course kit", type: "ref", table: "products", labelColumn: "title_en", filter: ["category", "course_kit"] },
          { name: "kit_required", label: "Is the kit required?", type: "tri", yes: "Required", no: "Optional" },
        ],
      },
      {
        title: "Search engines",
        fields: [
          { name: "seo_title", label: "Page title", type: "text" },
          { name: "seo_description", label: "Description", type: "textarea", rows: 2 },
        ],
      },
    ],
    extras: ["modules", "faqs", "registrations"],
  },

  sessions: {
    key: "sessions",
    table: "sessions",
    label: "Sessions & events",
    singular: "session",
    orderBy: ["starts_at", false],
    listColumns: [
      { name: "title_en", label: "Session" },
      { name: "starts_at", label: "When (IST)", kind: "datetime" },
      { name: "status", label: "Status", kind: "status" },
      { name: "fee_paise", label: "Fee", kind: "money" },
    ],
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title_en", label: "Title (English)", type: "text", required: true },
          { name: "title_hi", label: "Title (Hindi)", type: "text" },
          { name: "slug", label: "Web address", type: "slug", help: "Filled from the title if left empty." },
          { name: "status", label: "Visibility", type: "select", options: STATUS, required: true },
          {
            name: "kind",
            label: "Kind",
            type: "select",
            required: true,
            options: [
              { value: "one_time", label: "One-time session" },
              { value: "recurring", label: "Recurring gathering" },
              { value: "workshop", label: "Workshop" },
              { value: "satsang", label: "Satsang" },
              { value: "programme", label: "Multi-session programme" },
            ],
          },
          { name: "audience", label: "Audience", type: "select", options: AUDIENCE, required: true },
          { name: "course_id", label: "Part of course", type: "ref", table: "courses", labelColumn: "title_en" },
          { name: "description", label: "Description", type: "textarea", rows: 3 },
        ],
      },
      {
        title: "When and where",
        fields: [
          { name: "starts_at", label: "Starts (IST)", type: "datetime", help: "Leave empty for 'date to be announced' or a recurring gathering." },
          { name: "recurrence_text", label: "Repeats", type: "text", help: "e.g. Every Sunday" },
          { name: "duration_minutes", label: "Duration (minutes)", type: "number" },
          { name: "format", label: "Format", type: "select", options: FORMAT, required: true },
          { name: "city", label: "City", type: "text" },
          { name: "venue", label: "Venue", type: "text" },
          { name: "facilitator", label: "Facilitator", type: "text" },
          { name: "capacity", label: "Seats", type: "number", help: "Leave empty for no limit." },
        ],
      },
      {
        title: "Fee and recording",
        fields: [
          { name: "is_free", label: "Fee", type: "tri", yes: "Free", no: "Paid", help: FEE_HELP },
          { name: "fee_paise", label: "Fee amount (₹)", type: "money" },
          { name: "recording_available", label: "Recording", type: "tri", yes: "Will be shared", no: "No recording" },
          { name: "cancellation_note", label: "Cancellation note", type: "textarea", rows: 2 },
        ],
      },
    ],
    extras: ["meeting", "registrations"],
  },

  products: {
    key: "products",
    table: "products",
    label: "Products",
    singular: "product",
    orderBy: ["sort_order", true],
    listColumns: [
      { name: "title_en", label: "Product" },
      { name: "category", label: "Category" },
      { name: "status", label: "Status", kind: "status" },
    ],
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title_en", label: "Name (English)", type: "text", required: true },
          { name: "title_hi", label: "Name (Hindi)", type: "text" },
          { name: "slug", label: "Web address", type: "slug" },
          {
            name: "category",
            label: "Category",
            type: "select",
            required: true,
            options: [
              { value: "rudraksha", label: "Rudraksha" },
              { value: "mala", label: "Malas & Bracelets" },
              { value: "course_kit", label: "Course Kit" },
            ],
          },
          { name: "status", label: "Visibility", type: "select", options: STATUS, required: true },
          { name: "sort_order", label: "Order in the shop", type: "number" },
          { name: "description", label: "Description", type: "textarea", rows: 4, help: "Factual only. No health, wealth, protection or spiritual-result claims." },
          { name: "care_instructions", label: "Care instructions", type: "textarea", rows: 3 },
        ],
      },
      {
        title: "Course kit details",
        fields: [
          { name: "related_course_id", label: "Related course", type: "ref", table: "courses", labelColumn: "title_en" },
          { name: "kit_contents", label: "What is in the kit", type: "lines", help: "One item per line." },
          { name: "kit_required", label: "Is it required for the course?", type: "tri", yes: "Required", no: "Optional" },
        ],
      },
      {
        title: "Shipping and tax",
        fields: [
          { name: "weight_grams", label: "Packed weight (grams)", type: "number" },
          { name: "hsn_code", label: "HSN code", type: "text" },
          { name: "gst_rate", label: "GST rate (%)", type: "number" },
        ],
      },
    ],
    extras: ["facts", "variants", "images"],
  },

  resources: {
    key: "resources",
    table: "resources",
    label: "Articles & resources",
    singular: "resource",
    orderBy: ["published_at", false],
    listColumns: [
      { name: "title_en", label: "Title" },
      { name: "topic", label: "Topic" },
      { name: "access", label: "Access" },
      { name: "status", label: "Status", kind: "status" },
    ],
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title_en", label: "Title (English)", type: "text", required: true },
          { name: "title_hi", label: "Title (Hindi)", type: "text" },
          { name: "slug", label: "Web address", type: "slug" },
          { name: "summary", label: "Summary", type: "textarea", rows: 2 },
          { name: "topic", label: "Topic", type: "select", options: TOPIC, required: true },
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "article", label: "Article" },
              { value: "reflection", label: "Reflection" },
              { value: "video", label: "Video" },
              { value: "audio", label: "Audio" },
              { value: "study_material", label: "Study material" },
            ],
          },
          {
            name: "access",
            label: "Who can open it",
            type: "select",
            required: true,
            options: [
              { value: "free", label: "Everyone (free)" },
              { value: "students", label: "Enrolled students only" },
            ],
          },
          { name: "course_id", label: "Course (for student-only items)", type: "ref", table: "courses", labelColumn: "title_en" },
          { name: "status", label: "Visibility", type: "select", options: STATUS, required: true },
        ],
      },
    ],
    extras: ["body"],
  },

  verses: {
    key: "verses",
    table: "verses",
    label: "Scripture & reflections",
    singular: "verse",
    orderBy: ["sort_order", true],
    listColumns: [
      { name: "source", label: "Source" },
      { name: "topic", label: "Topic" },
      { name: "reflection_approved", label: "Reflection approved", kind: "bool" },
      { name: "status", label: "Status", kind: "status" },
    ],
    sections: [
      {
        title: "Scripture",
        fields: [
          { name: "topic", label: "Topic", type: "select", options: TOPIC, required: true },
          { name: "text_original", label: "Verse (Devanagari)", type: "textarea", rows: 3, required: true },
          { name: "transliteration", label: "Transliteration", type: "textarea", rows: 2 },
          { name: "translation", label: "Translation", type: "textarea", rows: 3 },
          { name: "source", label: "Source", type: "text", required: true, help: "e.g. Bhagavad Gita 6.19" },
        ],
      },
      {
        title: "Swamiji's reflection",
        fields: [
          { name: "reflection", label: "Reflection", type: "textarea", rows: 5, help: "Shown beside the verse, labelled as her reflection." },
          { name: "reflection_approved", label: "Swamiji has approved this reflection", type: "bool" },
          { name: "status", label: "Visibility", type: "select", options: STATUS, required: true },
          { name: "sort_order", label: "Order", type: "number" },
        ],
      },
    ],
  },

  announcements: {
    key: "announcements",
    table: "announcements",
    label: "Announcements",
    singular: "announcement",
    orderBy: ["created_at", false],
    listColumns: [
      { name: "title_en", label: "Title" },
      { name: "scope", label: "Where" },
      { name: "status", label: "Status", kind: "status" },
      { name: "published_at", label: "Published", kind: "date" },
    ],
    sections: [
      {
        title: "Announcement",
        fields: [
          {
            name: "scope",
            label: "Where it appears",
            type: "select",
            required: true,
            options: [
              { value: "gurukul", label: "Gurukul page" },
              { value: "general", label: "General" },
            ],
          },
          { name: "title_en", label: "Title (English)", type: "text", required: true },
          { name: "title_hi", label: "Title (Hindi)", type: "text" },
          { name: "body", label: "Text", type: "textarea", rows: 4 },
          { name: "status", label: "Visibility", type: "select", options: STATUS, required: true },
        ],
      },
    ],
  },

  recordings: {
    key: "recordings",
    table: "recordings",
    label: "Recordings",
    singular: "recording",
    orderBy: ["created_at", false],
    listColumns: [
      { name: "title", label: "Title" },
      { name: "recorded_on", label: "Recorded", kind: "date" },
      { name: "is_published", label: "Shared", kind: "bool" },
    ],
    sections: [
      {
        title: "Recording",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "course_id", label: "Course (enrolled students can watch)", type: "ref", table: "courses", labelColumn: "title_en" },
          { name: "session_id", label: "Session (its registrants can watch)", type: "ref", table: "sessions", labelColumn: "title_en" },
          { name: "video_id", label: "Bunny Stream video ID", type: "text", required: true },
          { name: "recorded_on", label: "Recorded on", type: "date" },
          { name: "is_published", label: "Share with participants now", type: "bool" },
        ],
      },
    ],
  },
};
