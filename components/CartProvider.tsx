"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { variantId: string; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  add: (variantId: string, qty: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "rvp-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved.filter((i) => typeof i?.variantId === "string" && i.qty > 0));
    } catch {
      /* storage unavailable: start empty */
    }
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      add: (variantId, qty) => {
        const existing = items.find((i) => i.variantId === variantId);
        persist(existing ? items.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(i.qty + qty, 20) } : i)) : [...items, { variantId, qty }]);
        setOpen(true);
      },
      setQty: (variantId, qty) => persist(qty <= 0 ? items.filter((i) => i.variantId !== variantId) : items.map((i) => (i.variantId === variantId ? { ...i, qty } : i))),
      remove: (variantId) => persist(items.filter((i) => i.variantId !== variantId)),
      replace: (next) => persist(next),
      clear: () => persist([]),
      open,
      setOpen,
    }),
    [items, open, persist]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
