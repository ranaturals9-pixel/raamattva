"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useCart } from "./CartProvider";
import { priceCart, type PricedCart } from "@/app/actions/shop";
import { inr } from "@/lib/format";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const [priced, setPriced] = useState<PricedCart | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    start(async () => setPriced(await priceCart(items)));
  }, [open, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={() => setOpen(false)} />
      <aside className="drawer" aria-label="Cart">
        <header>
          <h3>Your cart</h3>
          <button className="x" type="button" aria-label="Close cart" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
        <div className="items">
          {!items.length && <p className="empty">Your cart is empty.</p>}
          {items.length > 0 && !priced && <p className="empty">Loading…</p>}
          {priced?.problems.map((p) => (
            <p key={p} className="notice" style={{ marginTop: 12 }}>
              {p}
            </p>
          ))}
          {priced?.lines.map((l) => (
            <div className="line" key={l.variantId}>
              <div>
                <Link href={`/shop/${l.productSlug}`} onClick={() => setOpen(false)}>
                  <b>{l.title}</b>
                </Link>
                <div className="small muted">{l.variantLabel}</div>
              </div>
              <b>{inr(l.unitPaise * l.qty)}</b>
              <div className="qty">
                <button type="button" aria-label="Remove one" onClick={() => setQty(l.variantId, l.qty - 1)}>
                  −
                </button>
                <span>{l.qty}</span>
                <button type="button" aria-label="Add one" disabled={l.qty >= l.stock} onClick={() => setQty(l.variantId, l.qty + 1)}>
                  +
                </button>
              </div>
              <button type="button" className="btn ghost small" onClick={() => remove(l.variantId)}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <footer>
          <p className="small muted">The cart holds shop products only. Courses and sessions are registered on their own pages.</p>
          {priced && priced.lines.length > 0 && (
            <div className="summary">
              <div>
                <span>Subtotal</span>
                <b>{inr(priced.subtotalPaise)}</b>
              </div>
              <div>
                <span>Shipping</span>
                <span>{priced.shippingPaise === null ? "To be confirmed" : priced.shippingPaise === 0 ? "Free" : inr(priced.shippingPaise)}</span>
              </div>
            </div>
          )}
          <Link
            className="btn primary"
            href="/checkout"
            aria-disabled={!priced?.lines.length || pending}
            onClick={(e) => {
              if (!priced?.lines.length) e.preventDefault();
              else setOpen(false);
            }}
          >
            Proceed to checkout
          </Link>
        </footer>
      </aside>
    </>
  );
}
