"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { normalisePhone } from "@/lib/format";
import { paymentsConfigured, razorpay, verifyCheckoutSignature } from "@/lib/razorpay";
import { confirmRegistration, recordPayment } from "@/lib/fulfil";

const schema = z.object({
  targetType: z.enum(["session", "course"]),
  targetId: z.string().uuid(),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  childFirstName: z.string().trim().max(60).optional().default(""),
  childAge: z.coerce.number().int().min(3).max(18).optional(),
  city: z.string().trim().max(80).optional().default(""),
  guardianConfirmed: z.coerce.boolean().optional().default(false),
  photoConsent: z.coerce.boolean().optional().default(false),
  website: z.string().optional().default(""), // honeypot: real people leave it empty
});

export type RegisterInput = z.input<typeof schema>;

export type PayPayload = {
  key: string;
  orderId: string;
  amount: number;
  name: string;
  description: string;
  prefill: { name: string; email?: string; contact?: string };
};

export type RegisterResult =
  | { ok: true; status: "confirmed"; message: string }
  | { ok: true; status: "pay"; pay: PayPayload }
  | { ok: false; error: string };

export async function startRegistration(raw: RegisterInput): Promise<RegisterResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const input = parsed.data;
  if (input.website) return { ok: true, status: "confirmed", message: "Thank you." };

  const phone = normalisePhone(input.phone);
  const email = input.email ? input.email.toLowerCase() : null;
  if (input.phone && !phone) return { ok: false, error: "Please enter a valid mobile number." };
  if (email && !z.string().email().safeParse(email).success) return { ok: false, error: "Please enter a valid email address." };
  if (!phone && !email) return { ok: false, error: "Please give a WhatsApp number or an email so we can send your confirmation." };

  const db = createAdminClient();
  const table = input.targetType === "session" ? "sessions" : "courses";
  const { data: target } = await db.from(table).select("*").eq("id", input.targetId).eq("status", "published").maybeSingle();
  if (!target) return { ok: false, error: "This is no longer open for registration." };

  const forChildren = target.audience === "children";
  if (forChildren) {
    if (!input.childFirstName || !input.childAge) return { ok: false, error: "Please enter your child's first name and age." };
    if (!input.guardianConfirmed) return { ok: false, error: "Please confirm you are the child's parent or guardian." };
  }

  if (target.is_free === null || (target.is_free === false && !target.fee_paise)) {
    return { ok: false, error: "Registration opens once the details are confirmed. Please check back soon." };
  }
  const amount = target.is_free ? 0 : (target.fee_paise as number);

  if (input.targetType === "session" && target.capacity) {
    const { data: seat } = await db.from("session_availability").select("seats_left").eq("session_id", target.id).maybeSingle();
    if (seat && seat.seats_left !== null && seat.seats_left <= 0) return { ok: false, error: "This session is full." };
  }

  if (amount > 0 && !paymentsConfigured()) return { ok: false, error: "Online payment is not available yet. Please contact us to register." };

  const user = await getUser();
  const { data: reg, error } = await db
    .from("registrations")
    .insert({
      user_id: user?.id ?? null,
      session_id: input.targetType === "session" ? target.id : null,
      course_id: input.targetType === "course" ? target.id : null,
      status: amount > 0 ? "pending_payment" : "confirmed",
      name: input.name,
      phone,
      email,
      child_first_name: forChildren ? input.childFirstName : null,
      child_age: forChildren ? input.childAge : null,
      city: input.city || null,
      guardian_confirmed: forChildren ? input.guardianConfirmed : false,
      photo_consent: forChildren ? input.photoConsent : false,
      photo_consent_at: forChildren && input.photoConsent ? new Date().toISOString() : null,
      amount_paise: amount,
    })
    .select("id")
    .single();
  if (error || !reg) {
    console.error("registration insert failed", error);
    return { ok: false, error: "Something went wrong saving your registration. Please try again." };
  }

  if (amount === 0) {
    await confirmRegistration(reg.id, { fromStatus: "new" });
    return {
      ok: true,
      status: "confirmed",
      message: email || phone ? "You are registered. Your confirmation is on its way." : "You are registered.",
    };
  }

  let rzpOrder: { id: string };
  try {
    rzpOrder = await razorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `reg_${reg.id.slice(0, 30)}`,
      notes: { registration_id: reg.id, purpose: "registration" },
    });
  } catch (e) {
    console.error("razorpay order failed", e);
    await db.from("registrations").update({ status: "cancelled" }).eq("id", reg.id);
    return { ok: false, error: "The payment service is not responding. Please try again in a few minutes." };
  }
  await db.from("payments").insert({
    purpose: "registration",
    registration_id: reg.id,
    razorpay_order_id: rzpOrder.id,
    amount_paise: amount,
  });

  return {
    ok: true,
    status: "pay",
    pay: {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      orderId: rzpOrder.id,
      amount,
      name: "Raamattva Vidya Peeth",
      description: target.title_en,
      prefill: { name: input.name, email: email ?? undefined, contact: phone ?? undefined },
    },
  };
}

const paidSchema = z.object({
  razorpay_order_id: z.string().min(5),
  razorpay_payment_id: z.string().min(5),
  razorpay_signature: z.string().min(10),
});

export async function confirmPayment(raw: z.input<typeof paidSchema>): Promise<{ ok: true; redirect?: string } | { ok: false; error: string }> {
  const parsed = paidSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Payment details were incomplete." };
  const p = parsed.data;
  if (!verifyCheckoutSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
    return { ok: false, error: "We could not verify this payment. If money was taken, it will be confirmed shortly or refunded." };
  }
  const payment = await recordPayment(p.razorpay_order_id, p.razorpay_payment_id);
  if (!payment) return { ok: false, error: "Payment received but not matched. Our team will confirm it with you." };
  if (payment.purpose === "order" && payment.order_id) {
    const { data } = await createAdminClient().from("orders").select("public_token").eq("id", payment.order_id).single();
    return { ok: true, redirect: `/order/${data?.public_token}` };
  }
  return { ok: true };
}
