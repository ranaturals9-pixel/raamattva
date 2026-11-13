import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Where the sign-in link in the email lands. Creates the session, links earlier records, then continues. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next") ?? "/account";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let userId: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : null;
  const user = result && !result.error ? result.data.user : null;
  if (user) {
    userId = user.id;
    email = user.email ?? null;
    phone = user.phone || null;
  }

  if (!userId) return NextResponse.redirect(new URL(`/login?error=link&next=${encodeURIComponent(next)}`, url.origin));

  await createAdminClient().rpc("claim_records", {
    p_user: userId,
    p_email: email,
    p_phone: phone ? `+${phone.replace(/^\+/, "")}` : null,
  });
  return NextResponse.redirect(new URL(next, url.origin));
}
