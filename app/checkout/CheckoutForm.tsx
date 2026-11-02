"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { createOrder, priceCart, type PricedCart } from "@/app/actions/shop";
import { confirmPayment } from "@/app/actions/register";
import { payWithRazorpay } from "@/lib/razorpay-client";
import { inr } from "@/lib/format";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export function CheckoutForm() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();

  useEffect(() => {
    start(async () => setPriced(await priceCart(items)));
  }, [items]);

  if (!priced) return <p className="empty">Loading your cart…</p>;
  if (!priced.lines.length)
    return (
      <div className="card empty">
        Your cart is empty. <Link href="/shop">Visit the shop</Link>.
      </div>
    );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const res = await createOrder({
      items: priced!.lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
      name: String(f.get("name")),
      phone: String(f.get("phone")),
      email: String(f.get("email") ?? ""),
      line1: String(f.get("line1")),
      line2: String(f.get("line2") ?? ""),
      city: String(f.get("city")),
      state: String(f.get("state")),
      pincode: String(f.get("pincode")),
      website: String(f.get("website") ?? ""),
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    const paid = await payWithRazorpay(res.pay);
    if (paid === "failed-to-load") {
      setBusy(false);
      setError("The payment window could not open. Please check your connection and try again.");
      return;
    }
    if (!paid) {
      setBusy(false);
      setError("Payment was not completed, so your order has not been placed. You can try again.");
      return;
    }
    const conf = await confirmPayment(paid);
    if (!conf.ok) {
      setBusy(false);
      setError(conf.error);
      return;
    }
    clear();
    router.push(conf.redirect ?? "/account");
  }

  return (
    <div className="split wide-left">
      <form className="card stack" onSubmit={onSubmit}>
        <h2 style={{ fontSize: "1.4rem" }}>Delivery details</h2>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <div className="row2">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="phone">Mobile (WhatsApp)</label>
            <input id="phone" name="phone" required type="tel" autoComplete="tel" inputMode="tel" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email (for your receipt)</label>
          <input id="email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="line1">Address</label>
          <input id="line1" name="line1" required autoComplete="address-line1" />
        </div>
        <div className="field">
          <label htmlFor="line2">Landmark or area (optional)</label>
          <input id="line2" name="line2" autoComplete="address-line2" />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" required autoComplete="address-level2" />
          </div>
          <div className="field">
            <label htmlFor="pincode">PIN code</label>
            <input id="pincode" name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="state">State</label>
          <select id="state" name="state" required defaultValue="">
            <option value="" disabled>
              Choose your state
            </option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {error && <p className="notice">{error}</p>}
        {!priced.checkoutReady && (
          <p className="notice">Online checkout is not open yet. Please <Link href="/contact?topic=shop">contact us</Link> to order.</p>
        )}
        <p className="small muted">
          By paying you agree to our <Link href="/shipping">shipping</Link> and <Link href="/refunds">returns</Link> policies.
        </p>
        <button className="btn primary" type="submit" disabled={busy || !priced.checkoutReady}>
          {busy ? "Please wait…" : priced.totalPaise !== null ? `Pay ${inr(priced.totalPaise)} securely` : "Pay securely"}
        </button>
      </form>
      <aside className="card stack sticky-side">
        <h2 style={{ fontSize: "1.4rem" }}>Your order</h2>
        {priced.problems.map((p) => (
          <p key={p} className="notice">
            {p}
          </p>
        ))}
        {priced.lines.map((l) => (
          <div key={l.variantId} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>
              {l.title} <span className="small muted">({l.variantLabel}) × {l.qty}</span>
            </span>
            <b>{inr(l.unitPaise * l.qty)}</b>
          </div>
        ))}
        <div className="summary">
          <div>
            <span>Subtotal</span>
            <span>{inr(priced.subtotalPaise)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>{priced.shippingPaise === null ? "To be confirmed" : priced.shippingPaise === 0 ? "Free" : inr(priced.shippingPaise)}</span>
          </div>
          <div>
            <span>Total</span>
            <b>{priced.totalPaise === null ? "—" : inr(priced.totalPaise)}</b>
          </div>
        </div>
        <p className="small muted">UPI, cards and net banking accepted. All prices in Indian rupees.</p>
      </aside>
    </div>
  );
}
