"use client";

import type { PayPayload } from "@/app/actions/register";

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout. Resolves with the signed response, or null if the person closes it. */
export async function payWithRazorpay(pay: PayPayload): Promise<RzpResponse | null | "failed-to-load"> {
  const ok = await loadScript();
  if (!ok || !window.Razorpay) return "failed-to-load";
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: pay.key,
      order_id: pay.orderId,
      amount: pay.amount,
      currency: "INR",
      name: pay.name,
      description: pay.description,
      prefill: pay.prefill,
      theme: { color: "#94500F" },
      handler: (r: RzpResponse) => resolve(r),
      modal: { ondismiss: () => resolve(null), confirm_close: true },
    });
    rzp.on("payment.failed", () => {
      /* Razorpay shows the failure and lets the person retry inside the same window. */
    });
    rzp.open();
  });
}
