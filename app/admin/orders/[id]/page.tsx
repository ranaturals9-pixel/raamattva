import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { inr, istDate, istTime } from "@/lib/format";
import { refundPayment, updateOrder } from "@/app/admin/actions";
import { AdminHead, Flash } from "@/components/admin/bits";

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const profile = await getProfile();
  const [{ data: o }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("payments").select("*").eq("order_id", id).order("created_at"),
  ]);
  if (!o) notFound();
  const paid = payments?.find((p) => p.status === "paid");

  return (
    <>
      <p className="crumb">
        <Link href="/admin/orders">Orders</Link> / {o.order_number}
      </p>
      <AdminHead title={`Order ${o.order_number}`} lede={`Placed ${istDate(o.created_at)}, ${istTime(o.created_at)} · ${o.status.replace(/_/g, " ")}`} />
      <Flash sp={sp} />
      {o.notes && <p className="notice">{o.notes}</p>}
      <div className="split">
        <div className="card stack">
          <h2 style={{ fontSize: "1.2rem" }}>Items</h2>
          {(items ?? []).map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>
                {i.title_snapshot} × {i.quantity}
              </span>
              <b>{inr(i.unit_price_paise * i.quantity)}</b>
            </div>
          ))}
          <div className="summary">
            <div>
              <span>Shipping</span>
              <span>{inr(o.shipping_paise)}</span>
            </div>
            <div>
              <span>Total</span>
              <b>{inr(o.total_paise)}</b>
            </div>
          </div>
          {o.invoice_number && <p className="small">Invoice {o.invoice_number}</p>}
          {paid && (
            <p className="small muted">
              Razorpay payment {paid.razorpay_payment_id} · {paid.method ?? "method not recorded"}
            </p>
          )}
        </div>
        <div className="card stack">
          <h2 style={{ fontSize: "1.2rem" }}>Deliver to</h2>
          <p>
            {o.ship_name}
            <br />
            {o.ship_line1}
            {o.ship_line2 && (
              <>
                <br />
                {o.ship_line2}
              </>
            )}
            <br />
            {o.ship_city}, {o.ship_state} {o.ship_pincode}
          </p>
          <p className="small">
            {o.phone}
            {o.email && (
              <>
                <br />
                {o.email}
              </>
            )}
          </p>
        </div>
      </div>

      {o.status !== "pending_payment" && o.status !== "refunded" && (
        <form action={updateOrder.bind(null, o.id)} className="card stack">
          <h2 style={{ fontSize: "1.2rem" }}>Dispatch</h2>
          <p className="small muted">Book the courier in Shiprocket, then enter the details here. Setting the status to Shipped messages the customer with the tracking link.</p>
          <div className="grid g2">
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={o.status}>
                <option value="paid">Paid, to pack</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="courier">Courier</label>
              <input id="courier" name="courier" defaultValue={o.courier ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="awb_number">Tracking (AWB) number</label>
              <input id="awb_number" name="awb_number" defaultValue={o.awb_number ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="tracking_url">Tracking link</label>
              <input id="tracking_url" name="tracking_url" type="url" defaultValue={o.tracking_url ?? ""} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Internal notes</label>
            <textarea id="notes" name="notes" rows={2} defaultValue={o.notes ?? ""} />
          </div>
          <button className="btn primary" type="submit" style={{ justifySelf: "start" }}>
            Save
          </button>
        </form>
      )}

      {paid && profile?.role === "admin" && (
        <form action={refundPayment.bind(null, paid.id, `/admin/orders/${o.id}`)} className="card stack">
          <h2 style={{ fontSize: "1.2rem" }}>Refund</h2>
          <p className="small muted">Refunds the full {inr(paid.amount_paise)} through Razorpay, returns the items to stock if not yet shipped, and emails the customer.</p>
          <details>
            <summary className="btn ghost small" style={{ display: "inline-flex" }}>
              Refund this order
            </summary>
            <button className="btn primary small" type="submit" style={{ marginTop: 10 }}>
              Confirm refund of {inr(paid.amount_paise)}
            </button>
          </details>
        </form>
      )}
    </>
  );
}
