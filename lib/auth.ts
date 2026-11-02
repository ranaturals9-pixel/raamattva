import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data as { id: string; full_name: string | null; phone: string | null; email: string | null; role: UserRole } | null;
}

export async function requireUser(next = "/account") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireStaff() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "editor" && profile.role !== "admin") redirect("/account?denied=1");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireStaff();
  if (profile.role !== "admin") redirect("/admin?denied=1");
  return profile;
}
