import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { inr, istDate } from "@/lib/format";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid, being prepared",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.string().uuid().safeParse(token).success) notFound();
  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, status, total_paise, shipping_paise, subtotal_paise, created_at, courier, awb_number, tracking_url, ship_city")
    .eq("public_token", token)
    .maybeSingle();
  if (!order) notFound();
  const { data: items } = await db.from("order_items").select("title_snapshot, unit_price_paise, quantity").eq("order_id", order.id);

  return (
    <>
      <PageHead
        eyebrow="Order"
        title={order.status === "pending_payment" ? "Your order is waiting for payment" : "Thank you for your order"}
        lede={`Order ${order.order_number}, placed ${istDate(order.created_at)}.`}
        crumbs={[{ label: "Order" }]}
      />
      <section className="band">
        <div className="wrap narrow stack-lg">
          <div className="card stack">
            <p>
              Status: <span className={`status-pill${order.status === "delivered" ? " ok" : ""}`}>{STATUS[order.status] ?? order.status}</span>
            </p>
            {(items ?? []).map((i) => (
              <div key={i.title_snapshot} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>
                  {i.title_snapshot} × {i.quantity}
                </span>
                <b>{inr(i.unit_price_paise * i.quantity)}</b>
              </div>
            ))}
            <div className="summary">
              <div>
                <span>Shipping</span>
                <span>{order.shipping_paise ? inr(order.shipping_paise) : "Free"}</span>
              </div>
              <div>
                <span>Total</span>
                <b>{inr(order.total_paise)}</b>
              </div>
            </div>
            {order.tracking_url ? (
              <p>
                Shipped with {order.courier ?? "our courier"} · AWB {order.awb_number}.{" "}
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                  Track your parcel
                </a>
              </p>
            ) : (
              order.status === "paid" && <p className="muted">We will message you with tracking details once it is dispatched.</p>
            )}
          </div>
          <p className="small muted">
            Need help? <Link href={`/contact?topic=shop&order=${order.order_number}`}>Contact us</Link> with your order number. Sign in with the same phone or email to see all your
            orders in your account.
          </p>
        </div>
      </section>
    </>
  );
}
