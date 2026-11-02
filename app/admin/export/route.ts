import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "editor" && profile.role !== "admin")) return new NextResponse("Not allowed", { status: 403 });
  const url = new URL(req.url);
  const session = url.searchParams.get("session");
  const course = url.searchParams.get("course");
  const id = session ?? course;
  if (!id || !z.string().uuid().safeParse(id).success) return new NextResponse("Missing id", { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("name, phone, email, child_first_name, child_age, city, photo_consent, status, amount_paise, created_at")
    .eq(session ? "session_id" : "course_id", id)
    .order("created_at");
  const header = ["Name", "Phone", "Email", "Child", "Child age", "City", "Photo consent", "Status", "Amount (INR)", "Registered (UTC)"];
  const lines = (data ?? []).map((r) =>
    [r.name, r.phone, r.email, r.child_first_name, r.child_age, r.city, r.photo_consent ? "yes" : "no", r.status, (r.amount_paise / 100).toFixed(2), r.created_at].map(cell).join(",")
  );
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="registrations-${id.slice(0, 8)}.csv"` },
  });
}
