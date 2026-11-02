"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { inr } from "@/lib/format";

type V = { id: string; label: string; price_paise: number; stock: number };

export function AddToCart({ variants, labels }: { variants: V[]; labels: { add: string; out: string; option: string } }) {
  const { add } = useCart();
  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [vid, setVid] = useState(firstInStock?.id);
  const [qty, setQty] = useState(1);
  const v = variants.find((x) => x.id === vid);
  if (!v) return null;
  const out = v.stock <= 0;

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!out) add(v.id, Math.min(qty, v.stock));
      }}
    >
      <p className="price" style={{ fontSize: "1.6rem" }}>
        {inr(v.price_paise)}
      </p>
      <p className="small muted">{out ? labels.out : v.stock <= 5 ? `Only ${v.stock} left` : "In stock"}</p>
      {variants.length > 1 && (
        <div className="field">
          <label htmlFor="variant">{labels.option}</label>
          <select id="variant" value={vid} onChange={(e) => setVid(e.target.value)}>
            {variants.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label} · {inr(x.price_paise)}
                {x.stock <= 0 ? " · out of stock" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field" style={{ maxWidth: 140 }}>
        <label htmlFor="qty">Quantity</label>
        <input id="qty" type="number" min={1} max={Math.max(1, Math.min(20, v.stock))} value={qty} inputMode="numeric" onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
      </div>
      <button className="btn primary" type="submit" disabled={out}>
        {out ? labels.out : labels.add}
      </button>
    </form>
  );
}
