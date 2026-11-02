import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { inr, istDate } from "@/lib/format";
import { cancelRegistration, refundPayment } from "@/app/admin/actions";
import { AdminHead, Flash } from "@/components/admin/bits";

export default async function Registrations({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const status = ["confirmed", "pending_payment", "cancelled", "refunded"].includes(sp.status ?? "") ? sp.status! : "confirmed";
  const supabase = await createClient();
  const profile = await getProfile();
  const { data } = await supabase
    .from("registrations")
    .select("id, name, phone, email, status, child_first_name, child_age, photo_consent, amount_paise, created_at, session:sessions(id, title_en), course:courses(id, title_en), payments(id, status)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(300);
  type Row = {
    id: string; name: string; phone: string | null; email: string | null; status: string; child_first_name: string | null; child_age: number | null;
    photo_consent: boolean; amount_paise: number; created_at: string; session: { id: string; title_en: string } | null; course: { id: string; title_en: string } | null;
    payments: { id: string; status: string }[];
  };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <AdminHead title="Registrations" lede="Everyone registered for sessions, courses and the Gurukul." />
      <Flash sp={sp} />
      <div className="chipset">
        {[
          ["confirmed", "Confirmed"],
          ["pending_payment", "Awaiting payment"],
          ["cancelled", "Cancelled"],
          ["refunded", "Refunded"],
        ].map(([v, l]) => (
          <Link key={v} href={`/admin/registrations?status=${v}`} className="btn small ghost" aria-current={v === status ? "page" : undefined} style={v === status ? { background: "var(--ink)", color: "var(--on-accent)" } : undefined}>
            {l}
          </Link>
        ))}
      </div>
      {rows.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>For</th>
                <th>Child</th>
                <th>Contact</th>
                <th>Paid</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const paid = r.payments.find((p) => p.status === "paid");
                return (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>
                      {r.session ? <Link href={`/admin/sessions/${r.session.id}`}>{r.session.title_en}</Link> : r.course ? <Link href={`/admin/courses/${r.course.id}`}>{r.course.title_en}</Link> : "—"}
                    </td>
                    <td>{r.child_first_name ? `${r.child_first_name}, ${r.child_age}${r.photo_consent ? " · photo consent" : ""}` : "—"}</td>
                    <td className="small">
                      {r.phone}
                      {r.phone && r.email ? <br /> : null}
                      {r.email}
                    </td>
                    <td>{r.amount_paise ? inr(r.amount_paise) : "Free"}</td>
                    <td>{istDate(r.created_at)}</td>
                    <td>
                      <div className="ctas" style={{ gap: 6 }}>
                        {r.status === "confirmed" && !paid && (
                          <form action={cancelRegistration.bind(null, r.id, "/admin/registrations")}>
                            <button className="btn ghost small" type="submit">
                              Cancel
                            </button>
                          </form>
                        )}
                        {paid && profile?.role === "admin" && (
                          <form action={refundPayment.bind(null, paid.id, "/admin/registrations")}>
                            <button className="btn ghost small" type="submit">
                              Refund {inr(r.amount_paise)}
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">No registrations here.</div>
      )}
    </>
  );
}
