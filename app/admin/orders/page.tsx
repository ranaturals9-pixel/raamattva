import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inr, istDate } from "@/lib/format";
import { AdminHead } from "@/components/admin/bits";

const TABS = [
  ["paid", "To pack"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
  ["refunded", "Refunded"],
  ["pending_payment", "Unpaid"],
];

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: s } = await searchParams;
  const status = TABS.some(([v]) => v === s) ? s! : "paid";
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, ship_name, ship_city, phone, total_paise, created_at, status")
    .eq("status", status)
    .order("created_at", { ascending: status === "paid" })
    .limit(300);

  return (
    <>
      <AdminHead title="Orders" lede="Paid orders appear under To pack. Unpaid ones are abandoned checkouts and need no action." />
      <div className="chipset">
        {TABS.map(([v, l]) => (
          <Link key={v} href={`/admin/orders?status=${v}`} className="btn small ghost" style={v === status ? { background: "var(--ink)", color: "var(--on-accent)" } : undefined}>
            {l}
          </Link>
        ))}
      </div>
      {data?.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>City</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{o.order_number}</Link>
                  </td>
                  <td>
                    {o.ship_name}
                    <br />
                    <span className="small muted">{o.phone}</span>
                  </td>
                  <td>{o.ship_city}</td>
                  <td>{inr(o.total_paise)}</td>
                  <td>{istDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">No orders here.</div>
      )}
    </>
  );
}
