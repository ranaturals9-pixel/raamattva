import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLang, pick, t } from "@/lib/i18n";
import { getCourse, getSessions } from "@/lib/data";
import { inr, istDate } from "@/lib/format";
import { registrationState } from "@/lib/registration-state";
import { Glance, PageHead, Prose, Tbc } from "@/components/ui";
import { RegisterButton } from "@/components/RegisterButton";
import { SessionCard } from "@/components/cards";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCourse((await params).slug);
  if (!data) return { title: "Course not found" };
  return { title: data.course.seo_title ?? data.course.title_en, description: data.course.seo_description ?? data.course.summary_en ?? undefined };
}

const yesNo = (v: boolean | null, yes: string, no: string) => (v === null ? <Tbc /> : v ? yes : no);

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const [lang, data, sessions] = await Promise.all([getLang(), getCourse(slug), getSessions()]);
  if (!data) notFound();
  const { course: c, modules, faqs, kit } = data;
  const state = registrationState(c);
  const related = sessions.filter((s) => s.course_id === c.id);
  const format = c.format === "online" ? "Online" : c.format === "in_person" ? "In person" : c.format === "hybrid" ? "Online and in person" : null;
  const dates = c.starts_on ? `${istDate(`${c.starts_on}T00:00:00+05:30`)}${c.ends_on ? ` to ${istDate(`${c.ends_on}T00:00:00+05:30`)}` : ""}` : null;

  return (
    <>
      <PageHead
        eyebrow={<span className="deva" style={{ fontSize: "1rem", letterSpacing: 0, textTransform: "none" }}>{c.title_hi}</span>}
        title={c.title_en}
        lede={pick(c.summary_en, c.summary_hi, lang)}
        crumbs={[{ href: "/courses", label: "Courses" }, { label: c.title_en }]}
      >
        <div className="tags">
          <span className="tag adults">{t("for_adults", lang)}</span>
        </div>
      </PageHead>
      <section className="band">
        <div className="wrap split wide-left">
          <div className="stack-lg">
            <div className="stack">
              <h2>Overview and purpose</h2>
              <Prose text={pick(c.overview_en, c.overview_hi, lang)} />
              {!c.overview_en && <Tbc />}
            </div>
            <div className="stack">
              <h2>Who it is for</h2>
              {c.suitable_for.length ? (
                <ul className="dots">
                  {c.suitable_for.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <Tbc />
              )}
            </div>
            <div className="stack">
              <h2>What you will learn</h2>
              {c.outcomes.length ? (
                <ul className="dots">
                  {c.outcomes.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <div className="slot">
                  <b>Learning outcomes</b>The key teachings and practices of this course will be listed here once confirmed.
                </div>
              )}
            </div>
            <div className="stack">
              <h2>Course outline</h2>
              {modules.length ? (
                <ol className="outline">
                  {modules.map((m) => (
                    <li key={m.id}>
                      <span>
                        <b>{pick(m.title_en, m.title_hi, lang)}</b>
                        {m.description && <span className="small muted" style={{ display: "block" }}>{m.description}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="slot">
                  <b>Outline</b>The module-by-module outline will appear here once confirmed.
                </div>
              )}
            </div>
            <div className="stack">
              <h2>Teacher</h2>
              <p>{c.facilitator ?? <Tbc />}</p>
            </div>
            {related.length > 0 && (
              <div className="stack">
                <h2>Upcoming sessions for this course</h2>
                <div className="sessions">
                  {related.map((s) => (
                    <SessionCard key={s.id} s={s} lang={lang} />
                  ))}
                </div>
              </div>
            )}
            <div className="stack">
              <h2>Questions</h2>
              <div className="faq">
                {faqs.map((f) => (
                  <details key={f.id}>
                    <summary>{f.question}</summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
                <details>
                  <summary>How do I receive the class link?</summary>
                  <p>After you register, the link is sent in your confirmation and appears in your account. It is shared only with registered participants.</p>
                </details>
                <details>
                  <summary>Is the course kit included in the course fee?</summary>
                  <p>No. Course kits are bought separately in the shop, and buying a kit does not enrol you in the course.</p>
                </details>
                <details>
                  <summary>What if I need to cancel?</summary>
                  <p>
                    Please see our <Link href="/refunds">cancellation and refund policy</Link>.
                  </p>
                </details>
              </div>
            </div>
          </div>
          <aside className="stack sticky-side">
            <Glance
              rows={[
                ["Format", format ?? <Tbc />],
                ["Language", c.language ?? <Tbc />],
                ["Duration", c.duration_text ?? <Tbc />],
                ["Dates", dates ?? <Tbc />],
                ["Timings (IST)", c.timings_text ?? <Tbc />],
                ["Fee", c.is_free ? "Free" : c.is_free === false && c.fee_paise ? inr(c.fee_paise) : <Tbc />],
                ["Prerequisites", c.prerequisites ?? <Tbc />],
                [
                  "Course kit",
                  kit ? (
                    <>
                      <Link href={`/shop/${kit.slug}`}>{kit.title_en}</Link> · {c.kit_required === null ? <Tbc>Required or optional to be confirmed</Tbc> : c.kit_required ? "Required" : "Optional"}
                    </>
                  ) : c.kit_product_id === null ? (
                    "None"
                  ) : (
                    <Tbc />
                  ),
                ],
                ["Recordings", yesNo(c.recordings_included, "Included", "Not included")],
                ["Study material", yesNo(c.materials_included, "Included", "Not included")],
              ]}
            />
            <RegisterButton
              targetType="course"
              targetId={c.id}
              title={c.title_en}
              state={state}
              feePaise={c.fee_paise}
              forChildren={false}
              summary={[
                ["Dates", dates ?? "To be confirmed"],
                ["Format", format ?? "To be confirmed"],
              ]}
              labels={{ free: "Register for this course", paid: "Register and pay", soon: t("opens_soon", lang), full: t("full", lang) }}
              className="btn primary"
            />
            <p className="small muted">Registration is separate from buying a course kit.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
