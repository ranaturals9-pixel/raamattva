import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { getSessions } from "@/lib/data";
import { SessionCard } from "@/components/cards";
import { Filters } from "@/components/Filters";
import { PageHead } from "@/components/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Sessions and Events",
  description: "Upcoming free and paid satsangs, gatherings, workshops and programmes at Raamattva Vidya Peeth, in India Standard Time.",
};

export default async function Sessions() {
  const [lang, sessions] = await Promise.all([getLang(), getSessions()]);
  return (
    <>
      <PageHead
        eyebrow="सत्र · Sessions & Events"
        title="Upcoming sessions and events"
        lede="Satsangs, gatherings, workshops and multi-session programmes, both free and paid. All times are shown in India Standard Time (IST)."
        crumbs={[{ label: "Sessions & Events" }]}
      />
      <section className="band">
        <div className="wrap">
          {sessions.length ? (
            <Filters
              className="sessions"
              emptyText="No sessions match these filters yet."
              groups={[
                { key: "fee", label: "Fee", options: [{ value: "free", label: "Free" }, { value: "paid", label: "Paid" }] },
                { key: "format", label: "Format", options: [{ value: "online", label: "Online" }, { value: "in_person", label: "In person" }] },
                { key: "audience", label: "For", options: [{ value: "adults", label: "Adults" }, { value: "children", label: "Children" }] },
              ]}
            >
              {sessions.map((s) => (
                <SessionCard key={s.id} s={s} lang={lang} />
              ))}
            </Filters>
          ) : (
            <div className="card empty">New sessions will be announced here.</div>
          )}
        </div>
      </section>
      <section className="band alt">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Good to know</p>
            <h2>How sessions work</h2>
          </div>
          <div className="grid g2">
            <div className="card stack">
              <h3>Free sessions</h3>
              <p className="muted">Register with your name and WhatsApp number or email. No payment details are needed.</p>
            </div>
            <div className="card stack">
              <h3>Paid sessions</h3>
              <p className="muted">Pay securely by UPI, card or net banking. Your seat is confirmed, and your confirmation sent, only after the payment succeeds.</p>
            </div>
            <div className="card stack">
              <h3>Meeting links</h3>
              <p className="muted">Links for online sessions are shared only with registered participants, in their confirmation and in their account.</p>
            </div>
            <div className="card stack">
              <h3>Cancellation and rescheduling</h3>
              <p className="muted">
                If a session is cancelled or moved, everyone registered is told directly. See the <Link href="/refunds">cancellation and refund policy</Link> for paid sessions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
