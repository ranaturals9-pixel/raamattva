import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { paymentsConfigured } from "@/lib/razorpay";
import { AdminHead } from "@/components/admin/bits";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const [regs, toShip, enquiries, upcoming] = await Promise.all([
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("created_at", weekAgo),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "packed"]),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("handled", false),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "published").or(`starts_at.is.null,starts_at.gte.${new Date().toISOString()}`),
  ]);

  const setup: [string, boolean, string][] = [
    ["Payments (Razorpay keys)", paymentsConfigured(), "Add the Razorpay keys in Vercel's environment settings."],
    ["Payment webhook", Boolean(process.env.RAZORPAY_WEBHOOK_SECRET), "Add the webhook in Razorpay and its secret in Vercel."],
    ["Confirmation emails", Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), "Add a Resend API key and sender address."],
    ["Team notifications", Boolean(process.env.TEAM_NOTIFY_EMAIL), "Set TEAM_NOTIFY_EMAIL to the inbox that should hear about new registrations."],
    ["Video recordings (Bunny Stream)", Boolean(process.env.BUNNY_STREAM_LIBRARY_ID), "Add the Bunny Stream library ID and token key."],
    ["Sign-in by phone", process.env.NEXT_PUBLIC_PHONE_LOGIN === "1", "Connect an SMS or WhatsApp provider in Supabase Auth, then turn this on."],
  ];

  const tiles: [string, number | null, string][] = [
    ["Registrations this week", regs.count, "/admin/registrations"],
    ["Orders to dispatch", toShip.count, "/admin/orders?status=paid"],
    ["Open enquiries", enquiries.count, "/admin/enquiries"],
    ["Upcoming sessions", upcoming.count, "/admin/sessions"],
  ];

  return (
    <>
      <AdminHead title="Overview" lede="What needs attention today." />
      {denied && <p className="notice">That section is for admins only.</p>}
      <div className="grid g4">
        {tiles.map(([label, n, href]) => (
          <Link key={label} href={href} className="card stack" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="small muted">{label}</span>
            <b style={{ fontFamily: "var(--f-display)", fontWeight: 400, fontSize: "2rem" }}>{n ?? 0}</b>
          </Link>
        ))}
      </div>
      <div className="stack">
        <h2 style={{ fontSize: "1.4rem" }}>Setup checklist</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>What to do</th>
              </tr>
            </thead>
            <tbody>
              {setup.map(([name, ok, todo]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{ok ? <span className="status-pill ok">Connected</span> : <span className="status-pill">Needs setup</span>}</td>
                  <td className="small">{ok ? "—" : todo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
