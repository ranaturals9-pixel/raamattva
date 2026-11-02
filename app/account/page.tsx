import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/app/actions/auth";
import { duration, inr, istDate, istTime } from "@/lib/format";
import { videoEmbedUrl } from "@/lib/video";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const ORDER_STATUS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid, being prepared",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function Account({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const user = await requireUser("/account");
  // Link anything registered or bought before signing in.
  await createAdminClient().rpc("claim_records", {
    p_user: user.id,
    p_email: user.email ?? null,
    p_phone: user.phone ? `+${user.phone.replace(/^\+/, "")}` : null,
  });

  const supabase = await createClient();
  const profile = await getProfile();
  const [{ data: regs }, { data: enrols }, { data: recordings }, { data: orders }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, status, child_first_name, child_age, photo_consent, created_at, session:sessions(id, title_en, starts_at, recurrence_text, duration_minutes, format, city, venue), course:courses(slug, title_en)")
      .order("created_at", { ascending: false }),
    supabase.from("enrolments").select("course:courses(id, slug, title_en, timings_text, starts_on)"),
    supabase.from("recordings").select("id, title, video_id, recorded_on, course_id, session_id").order("recorded_on", { ascending: false }),
    supabase.from("orders").select("id, order_number, status, total_paise, created_at, public_token, tracking_url").neq("status", "pending_payment").order("created_at", { ascending: false }),
  ]);

  type Reg = {
    id: string;
    status: string;
    child_first_name: string | null;
    child_age: number | null;
    photo_consent: boolean;
    session: { id: string; title_en: string; starts_at: string | null; recurrence_text: string | null; duration_minutes: number | null; format: string; city: string | null; venue: string | null } | null;
    course: { slug: string; title_en: string } | null;
  };
  const registrations = (regs ?? []) as unknown as Reg[];
  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const sessionIds = [...new Set(confirmed.map((r) => r.session?.id).filter(Boolean))] as string[];
  const { data: links } = sessionIds.length
    ? await supabase.from("session_private").select("session_id, meeting_link, meeting_note").in("session_id", sessionIds)
    : { data: [] as { session_id: string; meeting_link: string | null; meeting_note: string | null }[] };

  const courses = ((enrols ?? []) as unknown as { course: { id: string; slug: string; title_en: string; timings_text: string | null; starts_on: string | null } | null }[])
    .map((e) => e.course)
    .filter(Boolean) as { id: string; slug: string; title_en: string; timings_text: string | null; starts_on: string | null }[];
  const { data: studentResources } = courses.length
    ? await supabase.from("resources").select("slug, title_en, type").eq("access", "students").eq("status", "published").in("course_id", courses.map((c) => c.id))
    : { data: [] as { slug: string; title_en: string; type: string }[] };

  const sessionsAhead = confirmed.filter((r) => r.session && !r.child_first_name);
  const children = confirmed.filter((r) => r.child_first_name);

  return (
    <>
      <PageHead eyebrow="खाता · My account" title={`Namaste${profile?.full_name ? `, ${profile.full_name}` : ""}`} lede={`Signed in as ${user.email ?? user.phone}.`} crumbs={[{ label: "Account" }]}>
        <div className="ctas">
          {(profile?.role === "admin" || profile?.role === "editor") && (
            <Link className="btn primary small" href="/admin">
              Open admin
            </Link>
          )}
          <form action={signOut}>
            <button className="btn ghost small" type="submit">
              Sign out
            </button>
          </form>
        </div>
        {denied && <p className="notice">That area is for the Vidya Peeth team only.</p>}
      </PageHead>

      <section className="band">
        <div className="wrap stack-lg">
          <div className="stack">
            <h2>My courses</h2>
            {courses.length ? (
              <div className="grid g3">
                {courses.map((c) => (
                  <div className="card stack" key={c.id}>
                    <h3>{c.title_en}</h3>
                    {c.timings_text && <p className="small muted">{c.timings_text} (IST)</p>}
                    <Link className="btn ghost small" href={`/courses/${c.slug}`}>
                      Course page
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                You are not enrolled in a course yet. <Link href="/courses">Browse courses</Link>.
              </p>
            )}
          </div>

          <div className="stack">
            <h2>Upcoming sessions</h2>
            {sessionsAhead.length ? (
              <div className="sessions">
                {sessionsAhead.map((r) => {
                  const s = r.session!;
                  const link = links?.find((l) => l.session_id === s.id);
                  return (
                    <div className="card stack" key={r.id}>
                      <h3>{s.title_en}</h3>
                      <p className="small">
                        {s.starts_at ? `${istDate(s.starts_at)} · ${istTime(s.starts_at)}` : s.recurrence_text ?? "Date to be announced"}
                        {s.duration_minutes ? ` · ${duration(s.duration_minutes)}` : ""}
                      </p>
                      {s.format !== "online" && (s.venue || s.city) && <p className="small">Venue: {[s.venue, s.city].filter(Boolean).join(", ")}</p>}
                      {link?.meeting_link ? (
                        <a className="btn primary small" style={{ justifySelf: "start" }} href={link.meeting_link} target="_blank" rel="noopener noreferrer">
                          Join session
                        </a>
                      ) : (
                        s.format !== "in_person" && <p className="small muted">The joining link will appear here before the session.</p>
                      )}
                      {link?.meeting_note && <p className="small muted">{link.meeting_note}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">
                No upcoming sessions. <Link href="/sessions">See what is coming up</Link>.
              </p>
            )}
          </div>

          {children.length > 0 && (
            <div className="stack">
              <h2>Gurukul registrations</h2>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Child</th>
                      <th>Workshop</th>
                      <th>Photo consent</th>
                      <th>Joining link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((r) => {
                      const link = links?.find((l) => l.session_id === r.session?.id);
                      return (
                        <tr key={r.id}>
                          <td>
                            {r.child_first_name}, {r.child_age}
                          </td>
                          <td>{r.session?.title_en}</td>
                          <td>{r.photo_consent ? "Given" : "Not given"}</td>
                          <td>{link?.meeting_link ? <a href={link.meeting_link} target="_blank" rel="noopener noreferrer">Join</a> : "Sent before the workshop"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="small muted">
                To change photo consent or remove a child&apos;s details, <Link href="/contact?topic=gurukul">send us a message</Link>.
              </p>
            </div>
          )}

          <div className="stack">
            <h2>Recordings</h2>
            {recordings?.length ? (
              <div className="grid g2">
                {recordings.map((rec) => {
                  const url = videoEmbedUrl(rec.video_id);
                  return (
                    <div className="stack" key={rec.id}>
                      {url ? (
                        <div className="video">
                          <iframe src={url} title={rec.title} loading="lazy" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture" allowFullScreen />
                        </div>
                      ) : (
                        <div className="slot">Video player not connected yet.</div>
                      )}
                      <b>{rec.title}</b>
                      {rec.recorded_on && <span className="small muted">Recorded {istDate(`${rec.recorded_on}T00:00:00+05:30`)}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">Recordings you are entitled to will appear here.</p>
            )}
          </div>

          <div className="stack">
            <h2>Study material</h2>
            {studentResources?.length ? (
              <ul className="dots">
                {studentResources.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/wisdom/${r.slug}`}>{r.title_en}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Notes and resources for your courses will appear here.</p>
            )}
          </div>

          <div className="stack">
            <h2>Shop orders</h2>
            {orders?.length ? (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/order/${o.public_token}`}>{o.order_number}</Link>
                        </td>
                        <td>{istDate(o.created_at)}</td>
                        <td>{inr(o.total_paise)}</td>
                        <td>
                          {ORDER_STATUS[o.status] ?? o.status}
                          {o.tracking_url && (
                            <>
                              {" · "}
                              <a href={o.tracking_url} target="_blank" rel="noopener noreferrer">
                                Track
                              </a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">
                No orders yet. <Link href="/shop">Visit the shop</Link>.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
