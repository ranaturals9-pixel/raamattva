"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { ENTITIES, type Field } from "@/lib/admin/config";
import { fromIstInput, inr, rupeesToPaise } from "@/lib/format";
import { layout, sendEmail, sendWhatsApp } from "@/lib/email";
import { razorpay } from "@/lib/razorpay";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

function readField(f: Field, fd: FormData): unknown {
  const raw = fd.get(f.name);
  const s = typeof raw === "string" ? raw.trim() : "";
  switch (f.type) {
    case "bool":
      return raw === "on";
    case "tri":
      return s === "yes" ? true : s === "no" ? false : null;
    case "number":
      return s === "" ? null : Number(s);
    case "money":
      return rupeesToPaise(s);
    case "lines":
      return s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    case "datetime":
      return fromIstInput(s);
    case "date":
      return s || null;
    case "ref":
      return s || null;
    case "select":
      return s || null;
    default:
      return s || null;
  }
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

export async function saveEntity(key: string, id: string | null, fd: FormData) {
  await requireStaff();
  const cfg = ENTITIES[key];
  if (!cfg) throw new Error("Unknown section");
  const supabase = await createClient();

  const row: Record<string, unknown> = {};
  for (const section of cfg.sections) for (const f of section.fields) row[f.name] = readField(f, fd);

  if ("slug" in row && !row.slug) row.slug = slugify(String(row.title_en ?? row.title ?? "item"));
  if (typeof row.slug === "string") row.slug = slugify(row.slug);
  if ("is_free" in row && row.is_free !== false) row.fee_paise = row.is_free === true ? null : row.fee_paise;
  if (row.status === "published" && (key === "announcements" || key === "resources")) {
    const { data: existing } = id ? await supabase.from(cfg.table).select("published_at").eq("id", id).maybeSingle() : { data: null };
    row.published_at = (existing as { published_at?: string } | null)?.published_at ?? new Date().toISOString();
  }

  if (cfg.extras?.includes("facts")) {
    const facts: Record<string, string> = {};
    for (const k of ["type", "size_mm", "origin", "certification"]) {
      const v = String(fd.get(`fact_${k}`) ?? "").trim();
      if (v) facts[k] = v;
    }
    row.verified_details = facts;
  }

  let savedId = id;
  if (id) {
    const { error } = await supabase.from(cfg.table).update(row).eq("id", id);
    if (error) redirect(`/admin/${key}/${id}?error=${encodeURIComponent(error.message)}`);
  } else {
    const { data, error } = await supabase.from(cfg.table).insert(row).select("id").single();
    if (error || !data) redirect(`/admin/${key}/new?error=${encodeURIComponent(error?.message ?? "Could not save")}`);
    savedId = data.id;
  }

  // ---- related records edited on the same form ----
  if (cfg.extras?.includes("modules")) {
    const lines = String(fd.get("modules") ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    await supabase.from("course_modules").delete().eq("course_id", savedId!);
    if (lines.length)
      await supabase.from("course_modules").insert(
        lines.map((l, i) => {
          const [title, ...rest] = l.split("|");
          return { course_id: savedId, position: i + 1, title_en: title.trim(), description: rest.join("|").trim() || null };
        })
      );
  }
  if (cfg.extras?.includes("faqs")) {
    const blocks = String(fd.get("faqs") ?? "")
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    await supabase.from("course_faqs").delete().eq("course_id", savedId!);
    const faqs = blocks
      .map((b, i) => {
        const [q, ...a] = b.split("\n");
        return { course_id: savedId, position: i + 1, question: q.replace(/^Q:\s*/i, "").trim(), answer: a.join("\n").replace(/^A:\s*/i, "").trim() };
      })
      .filter((f) => f.question && f.answer);
    if (faqs.length) await supabase.from("course_faqs").insert(faqs);
  }
  if (cfg.extras?.includes("meeting")) {
    await supabase.from("session_private").upsert({
      session_id: savedId,
      meeting_link: String(fd.get("meeting_link") ?? "").trim() || null,
      meeting_note: String(fd.get("meeting_note") ?? "").trim() || null,
    });
  }
  if (cfg.extras?.includes("variants")) {
    const ids = fd.getAll("v_id").map(String);
    const labels = fd.getAll("v_label").map(String);
    const skus = fd.getAll("v_sku").map(String);
    const prices = fd.getAll("v_price").map(String);
    const stocks = fd.getAll("v_stock").map(String);
    const actives = fd.getAll("v_active").map(String);
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i].trim();
      const vid = ids[i];
      if (!label) {
        if (vid) await supabase.from("product_variants").delete().eq("id", vid);
        continue;
      }
      const price = rupeesToPaise(prices[i]);
      if (price === null) continue;
      const v = {
        product_id: savedId,
        label,
        sku: skus[i].trim() || null,
        price_paise: price,
        stock: Math.max(0, Number(stocks[i]) || 0),
        is_active: actives[i] !== "no",
        position: i,
      };
      if (vid) await supabase.from("product_variants").update(v).eq("id", vid);
      else await supabase.from("product_variants").insert(v);
    }
  }
  if (cfg.extras?.includes("body")) {
    await supabase.from("resource_bodies").upsert({
      resource_id: savedId,
      body: String(fd.get("body") ?? "").trim() || null,
      video_id: String(fd.get("video_id") ?? "").trim() || null,
    });
  }

  revalidatePublic();
  redirect(`/admin/${key}/${savedId}?saved=1`);
}

export async function deleteEntity(key: string, id: string) {
  await requireAdmin();
  const cfg = ENTITIES[key];
  const supabase = await createClient();
  const { error } = await supabase.from(cfg.table).delete().eq("id", id);
  if (error) redirect(`/admin/${key}/${id}?error=${encodeURIComponent("Could not delete. It may have registrations or orders; archive it instead.")}`);
  revalidatePublic();
  redirect(`/admin/${key}`);
}

// ---------------- images and files ----------------

export async function addProductImage(productId: string, path: string, alt: string) {
  await requireStaff();
  const supabase = await createClient();
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: alt || "Product photograph", position: count ?? 0 });
  revalidatePublic();
}

export async function removeProductImage(imageId: string, productId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("product_images").delete().eq("id", imageId).select("storage_path").single();
  if (data?.storage_path) await supabase.storage.from("public-media").remove([data.storage_path]);
  revalidatePublic();
  redirect(`/admin/products/${productId}`);
}

export async function setResourceFile(resourceId: string, path: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("resource_bodies").upsert({ resource_id: resourceId, file_path: path });
}

export async function addGalleryPhoto(path: string, alt: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("gallery_photos").insert({ storage_path: path, alt_text: alt || "Gurukul activity", status: "draft" });
}

export async function saveGalleryPhoto(id: string, fd: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const showsChildren = fd.get("shows_children") === "on";
  const consent = fd.getAll("consent").map(String);
  const status = String(fd.get("status") ?? "draft");
  const { error } = await supabase
    .from("gallery_photos")
    .update({
      alt_text: String(fd.get("alt_text") ?? "").trim() || "Gurukul activity",
      caption: String(fd.get("caption") ?? "").trim() || null,
      shows_children: showsChildren,
      consent_registration_ids: consent,
      status,
    })
    .eq("id", id);
  revalidatePublic();
  redirect(
    `/admin/gallery?${error ? `error=${encodeURIComponent(error.message.includes("child_photo_consent") ? "A photo showing children needs at least one guardian's consent before it can be published." : error.message)}` : "saved=1"}`
  );
}

export async function deleteGalleryPhoto(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_photos").delete().eq("id", id).select("storage_path").single();
  if (data?.storage_path) await supabase.storage.from("public-media").remove([data.storage_path]);
  revalidatePublic();
  redirect("/admin/gallery");
}

// ---------------- site text ----------------

export async function saveSiteContent(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const keys = fd.getAll("key").map(String);
  const rows = keys.map((k) => ({
    key: k,
    value_en: String(fd.get(`en:${k}`) ?? "").trim() || null,
    value_hi: String(fd.get(`hi:${k}`) ?? "").trim() || null,
    is_confirmed: fd.get(`ok:${k}`) === "on",
    updated_at: new Date().toISOString(),
  }));
  const newKey = String(fd.get("new_key") ?? "").trim();
  if (newKey && /^[a-z0-9_.]+$/.test(newKey)) rows.push({ key: newKey, value_en: null, value_hi: null, is_confirmed: false, updated_at: new Date().toISOString() });
  const { error } = await supabase.from("site_content").upsert(rows);
  revalidatePublic();
  redirect(`/admin/content?${error ? `error=${encodeURIComponent(error.message)}` : "saved=1"}`);
}

export async function setContentImage(key: string, path: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("site_content").upsert({ key, value_en: path, is_confirmed: true, updated_at: new Date().toISOString() });
  revalidatePublic();
}

// ---------------- orders ----------------

export async function updateOrder(orderId: string, fd: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const status = String(fd.get("status") ?? "");
  const allowed = ["paid", "packed", "shipped", "delivered", "cancelled"];
  const { data: before } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!before) redirect("/admin/orders");
  const patch: Record<string, unknown> = {
    courier: String(fd.get("courier") ?? "").trim() || null,
    awb_number: String(fd.get("awb_number") ?? "").trim() || null,
    tracking_url: String(fd.get("tracking_url") ?? "").trim() || null,
    notes: String(fd.get("notes") ?? "").trim() || null,
  };
  if (allowed.includes(status) && before.status !== "pending_payment" && before.status !== "refunded") patch.status = status;
  await supabase.from("orders").update(patch).eq("id", orderId);

  if (patch.status === "shipped" && before.status !== "shipped") {
    const track = patch.tracking_url as string | null;
    await sendEmail(
      before.email,
      `Order ${before.order_number} is on its way`,
      layout(
        "Your order has been dispatched",
        [
          ["Order", before.order_number],
          ["Courier", (patch.courier as string) ?? "-"],
          ["Tracking number", (patch.awb_number as string) ?? "-"],
        ],
        [`Namaste ${before.ship_name},`, "Your order has left us and is on its way."],
        track ? { label: "Track your parcel", href: track } : undefined
      )
    );
    await sendWhatsApp(before.phone, "order_shipped", { order: before.order_number, tracking: track ?? "" });
  }
  if (patch.status === "cancelled" && before.status !== "cancelled" && ["paid", "packed"].includes(before.status)) {
    await createAdminClient().rpc("restore_stock_for_order", { p_order_id: orderId });
  }
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=1`);
}

// ---------------- refunds (admin only) ----------------

export async function refundPayment(paymentId: string, back: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data: p } = await db.from("payments").select("*").eq("id", paymentId).single();
  if (!p || p.status !== "paid" || !p.razorpay_payment_id) redirect(`${back}?error=${encodeURIComponent("This payment cannot be refunded.")}`);
  try {
    await razorpay().payments.refund(p.razorpay_payment_id, { amount: p.amount_paise, speed: "normal", notes: { reason: "Refund from admin" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Razorpay refused the refund";
    redirect(`${back}?error=${encodeURIComponent(msg)}`);
  }
  await db.from("payments").update({ status: "refunded" }).eq("id", p.id);

  let email: string | null = null;
  let name = "";
  if (p.registration_id) {
    const { data: r } = await db.from("registrations").update({ status: "refunded" }).eq("id", p.registration_id).select("email, name").single();
    email = r?.email ?? null;
    name = r?.name ?? "";
  } else if (p.order_id) {
    const { data: o } = await db.from("orders").select("status, email, ship_name").eq("id", p.order_id).single();
    if (o && ["paid", "packed"].includes(o.status)) await db.rpc("restore_stock_for_order", { p_order_id: p.order_id });
    await db.from("orders").update({ status: "refunded" }).eq("id", p.order_id);
    email = o?.email ?? null;
    name = o?.ship_name ?? "";
  }
  await sendEmail(
    email,
    "Your refund has been issued",
    layout("Refund issued", [["Amount", inr(p.amount_paise)]], [`Namaste ${name},`, "We have issued your refund. Banks usually take 5 to 7 working days to show it in your account."])
  );
  redirect(`${back}?saved=1`);
}

// ---------------- registrations ----------------

export async function cancelRegistration(regId: string, back: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("registrations").update({ status: "cancelled" }).eq("id", regId).neq("status", "refunded");
  redirect(`${back}?saved=1`);
}

const notifySchema = z.object({ subject: z.string().trim().min(3).max(120), message: z.string().trim().min(5).max(3000) });

export async function notifyRegistrants(sessionId: string, fd: FormData) {
  await requireStaff();
  const parsed = notifySchema.safeParse({ subject: fd.get("subject"), message: fd.get("message") });
  if (!parsed.success) redirect(`/admin/sessions/${sessionId}?error=${encodeURIComponent("Please write a subject and a message.")}`);
  const supabase = await createClient();
  const { data: regs } = await supabase.from("registrations").select("name, email, phone").eq("session_id", sessionId).eq("status", "confirmed");
  let sent = 0;
  for (const r of regs ?? []) {
    const ok = await sendEmail(r.email, parsed.data.subject, layout(parsed.data.subject, [], [`Namaste ${r.name},`, ...parsed.data.message.split(/\n{2,}/)]));
    await sendWhatsApp(r.phone, "session_update", { name: r.name, message: parsed.data.message });
    if (ok) sent++;
  }
  redirect(`/admin/sessions/${sessionId}?saved=1&notified=${sent}`);
}

// ---------------- enquiries ----------------

export async function setEnquiryHandled(id: string, handled: boolean) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("enquiries").update({ handled }).eq("id", id);
  revalidatePath("/admin/enquiries");
}

// ---------------- team (admin only) ----------------

export async function setRole(fd: FormData) {
  await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "");
  if (!["student", "editor", "admin"].includes(role)) redirect("/admin/team?error=Choose%20a%20role");
  const db = createAdminClient();
  const { data: profile } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) redirect(`/admin/team?error=${encodeURIComponent("No account with that email yet. Ask them to sign in once on the website, then try again.")}`);
  await db.from("profiles").update({ role }).eq("id", profile.id);
  redirect("/admin/team?saved=1");
}
