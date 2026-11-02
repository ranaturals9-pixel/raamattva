import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { layout, notifyTeam, sendEmail, sendWhatsApp } from "@/lib/email";
import { duration, inr, istDate, istTime } from "@/lib/format";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

/**
 * Confirm a registration and send its confirmation. Safe to call more than once:
 * the message goes out only on the first transition to confirmed.
 */
export async function confirmRegistration(registrationId: string, opts: { fromStatus: "pending_payment" | "new" }) {
  const db = createAdminClient();

  let reg;
  if (opts.fromStatus === "pending_payment") {
    const { data } = await db
      .from("registrations")
      .update({ status: "confirmed" })
      .eq("id", registrationId)
      .eq("status", "pending_payment")
      .select("*")
      .maybeSingle();
    if (!data) return; // already confirmed (or cancelled): nothing more to do
    reg = data;
  } else {
    const { data } = await db.from("registrations").select("*").eq("id", registrationId).single();
    reg = data;
  }
  if (!reg) return;

  if (reg.user_id && reg.course_id) {
    await db.from("enrolments").upsert(
      { user_id: reg.user_id, course_id: reg.course_id, registration_id: reg.id, revoked_at: null },
      { onConflict: "user_id,course_id" }
    );
  }

  const rows: [string, string][] = [];
  let title = "";
  let link: { label: string; href: string } | undefined;

  if (reg.session_id) {
    const [{ data: s }, { data: priv }] = await Promise.all([
      db.from("sessions").select("*").eq("id", reg.session_id).single(),
      db.from("session_private").select("meeting_link, meeting_note").eq("session_id", reg.session_id).maybeSingle(),
    ]);
    title = s?.title_en ?? "Session";
    if (reg.child_first_name) rows.push(["Child", `${reg.child_first_name}${reg.child_age ? `, age ${reg.child_age}` : ""}`]);
    rows.push(["When", s?.starts_at ? `${istDate(s.starts_at)}, ${istTime(s.starts_at)}` : s?.recurrence_text ?? "Date to be announced"]);
    if (s?.duration_minutes) rows.push(["Duration", duration(s.duration_minutes)!]);
    if (s?.format !== "online" && (s?.venue || s?.city)) rows.push(["Venue", [s.venue, s.city].filter(Boolean).join(", ")]);
    if (priv?.meeting_link) {
      rows.push(["Joining link", priv.meeting_link]);
      link = { label: "Join the session", href: priv.meeting_link };
    } else if (s?.format !== "in_person") {
      rows.push(["Joining link", "We will send it before the session"]);
    }
    if (priv?.meeting_note) rows.push(["Note", priv.meeting_note]);
  } else if (reg.course_id) {
    const { data: c } = await db.from("courses").select("*").eq("id", reg.course_id).single();
    title = c?.title_en ?? "Course";
    if (c?.starts_on) rows.push(["Starts", istDate(`${c.starts_on}T00:00:00+05:30`)]);
    if (c?.timings_text) rows.push(["Timings", c.timings_text]);
    link = { label: "Open my account", href: `${site()}/account` };
  }
  if (reg.amount_paise > 0) rows.push(["Paid", inr(reg.amount_paise)]);
  rows.push(["Reference", reg.id.slice(0, 8).toUpperCase()]);

  const greeting = `Namaste ${reg.name},`;
  const line = reg.child_first_name
    ? `${reg.child_first_name} is registered for ${title}.`
    : `You are registered for ${title}.`;

  await Promise.all([
    sendEmail(reg.email, `Registered: ${title}`, layout(`You are registered`, rows, [greeting, line], link)),
    sendWhatsApp(reg.phone, "registration_confirmed", { name: reg.name, title }),
    notifyTeam(`New registration: ${title}`, [
      ["Name", reg.name],
      ["Phone", reg.phone ?? "-"],
      ["Email", reg.email ?? "-"],
      ...(reg.child_first_name ? ([["Child", `${reg.child_first_name}, ${reg.child_age}`]] as [string, string][]) : []),
      ["Amount", reg.amount_paise ? inr(reg.amount_paise) : "Free"],
    ]),
  ]);
}

/** Mark an order paid: invoice number, stock, confirmation. Idempotent. */
export async function confirmOrder(orderId: string) {
  const db = createAdminClient();
  const { data: paid } = await db
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();
  if (!paid) return; // already confirmed: nothing more to do
  // Invoice number only once the order is definitely paid, so numbers have no gaps.
  const { data: invoice } = await db.rpc("next_invoice_number");
  const { data: order } = await db.from("orders").update({ invoice_number: invoice as string }).eq("id", orderId).select("*").single();
  if (!order) return;

  const { error: stockErr } = await db.rpc("decrement_stock_for_order", { p_order_id: order.id });
  if (stockErr) {
    await db.from("orders").update({ notes: `Stock problem at payment: ${stockErr.message}. Check stock and contact the customer.` }).eq("id", order.id);
    await notifyTeam(`Stock problem on order ${order.order_number}`, [["Order", order.order_number], ["Problem", stockErr.message]]);
  }

  const { data: items } = await db.from("order_items").select("*").eq("order_id", order.id);
  const rows: [string, string][] = [
    ["Order number", order.order_number],
    ...((items ?? []).map((i) => [`${i.title_snapshot} × ${i.quantity}`, inr(i.unit_price_paise * i.quantity)]) as [string, string][]),
    ["Shipping", order.shipping_paise ? inr(order.shipping_paise) : "Free"],
    ["Total paid", inr(order.total_paise)],
    ["Deliver to", `${order.ship_name}, ${order.ship_line1}${order.ship_line2 ? ", " + order.ship_line2 : ""}, ${order.ship_city}, ${order.ship_state} ${order.ship_pincode}`],
  ];
  await Promise.all([
    sendEmail(
      order.email,
      `Order ${order.order_number} confirmed`,
      layout("Thank you for your order", rows, [`Namaste ${order.ship_name},`, "We have received your payment. We will message you with tracking details once your order is dispatched."], {
        label: "View your order",
        href: `${site()}/order/${order.public_token}`,
      })
    ),
    sendWhatsApp(order.phone, "order_confirmed", { name: order.ship_name, order: order.order_number }),
    notifyTeam(`New order ${order.order_number}`, [["Customer", order.ship_name], ["Phone", order.phone], ["Total", inr(order.total_paise)]]),
  ]);
}

/**
 * Record a successful Razorpay payment and fulfil what it paid for.
 * Called from the checkout handler (after signature check) and from the webhook.
 */
export async function recordPayment(razorpayOrderId: string, razorpayPaymentId: string, method?: string | null, raw?: unknown) {
  const db = createAdminClient();
  const { data: updated } = await db
    .from("payments")
    .update({ status: "paid", razorpay_payment_id: razorpayPaymentId, method: method ?? null, raw_event: raw ?? null })
    .eq("razorpay_order_id", razorpayOrderId)
    .neq("status", "paid")
    .select("*")
    .maybeSingle();

  const payment = updated ?? (await db.from("payments").select("*").eq("razorpay_order_id", razorpayOrderId).maybeSingle()).data;
  if (!payment) return null;

  if (payment.purpose === "registration" && payment.registration_id) {
    await confirmRegistration(payment.registration_id, { fromStatus: "pending_payment" });
  } else if (payment.purpose === "order" && payment.order_id) {
    await confirmOrder(payment.order_id);
  }
  return payment as { purpose: "registration" | "order"; registration_id: string | null; order_id: string | null };
}
