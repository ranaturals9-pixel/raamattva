import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { recordPayment } from "@/lib/fulfil";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook. Backs up the checkout handler: if a visitor pays and closes
 * the page before returning, this still confirms the registration or order.
 * Events to enable: payment.captured, order.paid, refund.processed
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: Record<string, { entity: Record<string, unknown> }> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload.payment?.entity as { id: string; order_id: string; method?: string } | undefined;
      if (payment?.order_id) await recordPayment(payment.order_id, payment.id, payment.method ?? null, event);
    } else if (event.event === "refund.processed") {
      const refund = event.payload.refund?.entity as { payment_id: string } | undefined;
      if (refund?.payment_id) {
        await createAdminClient().from("payments").update({ status: "refunded" }).eq("razorpay_payment_id", refund.payment_id);
      }
    }
  } catch (e) {
    console.error("webhook handling failed", e);
    return NextResponse.json({ error: "processing failed" }, { status: 500 }); // Razorpay retries
  }
  return NextResponse.json({ ok: true });
}
