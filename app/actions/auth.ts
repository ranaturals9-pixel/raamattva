"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalisePhone } from "@/lib/format";

function parseIdentifier(raw: string): { email: string } | { phone: string } | null {
  const v = raw.trim();
  if (v.includes("@")) return z.string().email().safeParse(v.toLowerCase()).success ? { email: v.toLowerCase() } : null;
  const phone = normalisePhone(v);
  return phone ? { phone } : null;
}

const phoneLogin = () => process.env.NEXT_PUBLIC_PHONE_LOGIN === "1";

export async function sendCode(identifier: string): Promise<{ ok: boolean; error?: string; sentTo?: string }> {
  const id = parseIdentifier(identifier);
  if (!id) return { ok: false, error: "Please enter a valid email or mobile number." };
  if ("phone" in id && !phoneLogin()) return { ok: false, error: "Sign-in by phone is not available yet. Please use your email." };
  const supabase = await createClient();
  const { error } =
    "email" in id
      ? await supabase.auth.signInWithOtp({ email: id.email, options: { shouldCreateUser: true } })
      : await supabase.auth.signInWithOtp({
          phone: id.phone,
          options: { shouldCreateUser: true, channel: process.env.OTP_CHANNEL === "whatsapp" ? "whatsapp" : "sms" },
        });
  if (error) {
    console.error("otp send failed", error.message);
    return { ok: false, error: "We could not send a code just now. Please try again in a minute." };
  }
  return { ok: true, sentTo: "email" in id ? id.email : id.phone };
}

export async function verifyCode(identifier: string, token: string, next: string): Promise<{ ok: false; error: string } | never> {
  const id = parseIdentifier(identifier);
  const code = token.replace(/\D/g, "");
  if (!id || code.length < 6) return { ok: false, error: "Please enter the code from your message." };
  const supabase = await createClient();
  const { data, error } =
    "email" in id
      ? await supabase.auth.verifyOtp({ email: id.email, token: code, type: "email" })
      : await supabase.auth.verifyOtp({ phone: id.phone, token: code, type: "sms" });
  if (error || !data.user) return { ok: false, error: "That code did not work. Please check it, or ask for a new one." };

  // Link registrations and orders made before signing in, and grant course access.
  await createAdminClient().rpc("claim_records", {
    p_user: data.user.id,
    p_email: data.user.email ?? null,
    p_phone: data.user.phone ? `+${data.user.phone.replace(/^\+/, "")}` : null,
  });

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
