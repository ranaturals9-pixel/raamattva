"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { normalisePhone } from "@/lib/format";
import { paymentsConfigured, razorpay } from "@/lib/razorpay";
import type { PayPayload } from "./register";

const itemsSchema = z.array(z.object({ variantId: z.string().uuid(), qty: z.coerce.number().int().min(1).max(20) })).max(30);

export type CartLine = {
  variantId: string;
  qty: number;
  productSlug: string;
  title: string;
  variantLabel: string;
  unitPaise: number;
  stock: number;
  imagePath: string | null;
};

export type PricedCart = {
  lines: CartLine[];
  subtotalPaise: number;
  shippingPaise: number | null;
  totalPaise: number | null;
  problems: string[];
  checkoutReady: boolean;
};

async function shippingPaise(): Promise<number | null> {
  const db = createAdminClient();
  const { data } = await db.from("site_content").select("value_en, is_confirmed").eq("key", "shop.shipping_paise").maybeSingle();
  if (!data?.is_confirmed || data.value_en === null) return null;
  const n = Number(data.value_en);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Re-prices the cart from the database. The browser's copy is never trusted for prices. */
export async function priceCart(rawItems: unknown): Promise<PricedCart> {
  const parsed = itemsSchema.safeParse(rawItems);
  const items = parsed.success ? parsed.data : [];
  const empty: PricedCart = { lines: [], subtotalPaise: 0, shippingPaise: null, totalPaise: null, problems: [], checkoutReady: false };
  if (!items.length) return empty;

  const db = createAdminClient();
  const { data: variants } = await db
    .from("product_variants")
    .select("id, label, price_paise, stock, is_active, product:products(id, slug, title_en, status)")
    .in("id", items.map((i) => i.variantId));
  const { data: images } = await db.from("product_images").select("product_id, storage_path, position").order("position");

  const problems: string[] = [];
  const lines: CartLine[] = [];
  for (const item of items) {
    const v = (variants ?? []).find((x) => x.id === item.variantId) as
      | { id: string; label: string; price_paise: number; stock: number; is_active: boolean; product: { id: string; slug: string; title_en: string; status: string } | null }
      | undefined;
    if (!v || !v.is_active || !v.product || v.product.status !== "published") {
      problems.push("An item in your cart is no longer available and was removed.");
      continue;
    }
    const qty = Math.min(item.qty, Math.max(v.stock, 0));
    if (qty < item.qty) problems.push(`Only ${v.stock} of ${v.product.title_en} (${v.label}) left in stock.`);
    if (qty === 0) continue;
    lines.push({
      variantId: v.id,
      qty,
      productSlug: v.product.slug,
      title: v.product.title_en,
      variantLabel: v.label,
      unitPaise: v.price_paise,
      stock: v.stock,
      imagePath: (images ?? []).find((i) => i.product_id === v.product!.id)?.storage_path ?? null,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.unitPaise * l.qty, 0);
  const ship = await shippingPaise();
  return {
    lines,
    subtotalPaise: subtotal,
    shippingPaise: ship,
    totalPaise: ship === null ? null : subtotal + ship,
    problems,
    checkoutReady: lines.length > 0 && ship !== null && paymentsConfigured(),
  };
}

const orderSchema = z.object({
  items: itemsSchema.min(1),
  name: z.string().trim().min(2, "Please enter the recipient's name").max(120),
  phone: z.string().trim().min(8, "Please enter a mobile number").max(20),
  email: z.string().trim().email("Please enter a valid email").max(200).or(z.literal("")).optional().default(""),
  line1: z.string().trim().min(3, "Please enter the address").max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2, "Please enter the city").max(80),
  state: z.string().trim().min(2, "Please choose the state").max(80),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Please enter a 6-digit PIN code"),
  website: z.string().optional().default(""),
});

export async function createOrder(raw: z.input<typeof orderSchema>): Promise<{ ok: true; pay: PayPayload } | { ok: false; error: string }> {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const input = parsed.data;
  if (input.website) return { ok: false, error: "Please try again." };
  const phone = normalisePhone(input.phone);
  if (!phone) return { ok: false, error: "Please enter a valid mobile number." };

  const cart = await priceCart(input.items);
  if (cart.problems.length) return { ok: false, error: cart.problems[0] };
  if (!cart.checkoutReady || cart.totalPaise === null) return { ok: false, error: "Checkout is not open yet. Please contact us to order." };

  const db = createAdminClient();
  const user = await getUser();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email: input.email || null,
      phone,
      ship_name: input.name,
      ship_line1: input.line1,
      ship_line2: input.line2 || null,
      ship_city: input.city,
      ship_state: input.state,
      ship_pincode: input.pincode,
      subtotal_paise: cart.subtotalPaise,
      shipping_paise: cart.shippingPaise ?? 0,
      total_paise: cart.totalPaise,
    })
    .select("id, order_number")
    .single();
  if (error || !order) {
    console.error("order insert failed", error);
    return { ok: false, error: "Something went wrong creating your order. Please try again." };
  }
  await db.from("order_items").insert(
    cart.lines.map((l) => ({
      order_id: order.id,
      variant_id: l.variantId,
      title_snapshot: `${l.title} (${l.variantLabel})`,
      unit_price_paise: l.unitPaise,
      quantity: l.qty,
    }))
  );

  let rzpOrder: { id: string };
  try {
    rzpOrder = await razorpay().orders.create({
      amount: cart.totalPaise,
      currency: "INR",
      receipt: order.order_number,
      notes: { order_id: order.id, purpose: "order" },
    });
  } catch (e) {
    console.error("razorpay order failed", e);
    await db.from("orders").update({ status: "cancelled", notes: "Payment service unreachable at checkout" }).eq("id", order.id);
    return { ok: false, error: "The payment service is not responding. Please try again in a few minutes." };
  }
  await db.from("payments").insert({ purpose: "order", order_id: order.id, razorpay_order_id: rzpOrder.id, amount_paise: cart.totalPaise });

  return {
    ok: true,
    pay: {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      orderId: rzpOrder.id,
      amount: cart.totalPaise,
      name: "Raamattva Vidya Peeth",
      description: `Order ${order.order_number}`,
      prefill: { name: input.name, email: input.email || undefined, contact: phone },
    },
  };
}
