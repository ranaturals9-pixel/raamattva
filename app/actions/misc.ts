"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTeam } from "@/lib/email";
import { normalisePhone } from "@/lib/format";

export async function setLanguage(lang: "en" | "hi") {
  const c = await cookies();
  c.set("lang", lang === "hi" ? "hi" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

const enquirySchema = z.object({
  topic: z.enum(["gurukul", "courses", "sessions", "shop", "other"]),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  orderNumber: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(5, "Please write a message").max(4000),
  website: z.string().optional().default(""),
});

export async function sendEnquiry(raw: z.input<typeof enquirySchema>): Promise<{ ok: boolean; error?: string }> {
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const e = parsed.data;
  if (e.website) return { ok: true };
  const phone = normalisePhone(e.phone);
  const email = e.email && z.string().email().safeParse(e.email).success ? e.email.toLowerCase() : null;
  if (!phone && !email) return { ok: false, error: "Please give a WhatsApp number or an email so we can reply." };

  const { error } = await createAdminClient().from("enquiries").insert({
    topic: e.topic,
    name: e.name,
    phone,
    email,
    order_number: e.orderNumber || null,
    message: e.message,
  });
  if (error) return { ok: false, error: "Your message could not be sent. Please try again." };
  await notifyTeam(`New enquiry: ${e.topic}`, [["Name", e.name], ["Phone", phone ?? "-"], ["Email", email ?? "-"], ["Message", e.message]]);
  return { ok: true };
}
