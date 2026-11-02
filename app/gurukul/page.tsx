import type { Metadata } from "next";
import Link from "next/link";
import { getLang, pick } from "@/lib/i18n";
import { getAnnouncements, getGallery, getSessions, getSiteContent } from "@/lib/data";
import { SessionCard } from "@/components/cards";
import { Glance, PageHead, Photo, Tbc } from "@/components/ui";
import { inr } from "@/lib/format";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Gurukul for Children",
  description: "Weekend online Gurukul workshops and offline city workshops for children at Raamattva Vidya Peeth.",
};

const activities = [
  ["मंत्र · श्लोक", "Mantra and shloka learning", "Correct pronunciation, meaning and memorisation of mantras and shlokas suited to each age."],
  ["कथा", "Devotional stories", "Stories from the Ramayana, the Bhagavad Gita and the Puranas, and what they teach."],
  ["भजन", "Bhajans", "Singing together, learning simple bhajans and their meaning."],
  ["ध्यान", "Age-appropriate meditation", "Short guided sittings that help children settle, focus and feel calm."],
  ["संस्कार", "Values education", "Gratitude, honesty, kindness and respect for parents, teachers and elders."],
  ["सृजन", "Creative learning", "Drawing, crafts and activities that bring each week's theme to life."],
];

export default async function Gurukul() {
  const [lang, content, sessions, announcements, gallery] = await Promise.all([getLang(), getSiteContent(), getSessions(), getAnnouncements("gurukul"), getGallery()]);
  const kids = sessions.filter((s) => s.audience === "children");
  const weekly = kids.find((s) => s.slug === "weekend-gurukul");
  const ages = pick(content["gurukul.age_groups"]?.en, content["gurukul.age_groups"]?.hi, lang);
  const language = pick(content["gurukul.language"]?.en, content["gurukul.language"]?.hi, lang);

  return (
    <>
      <PageHead
        eyebrow="गुरुकुल · Gurukul"
        title="Gurukul for children and young learners"
        lede="The Gurukul helps children grow in devotion, values and awareness in a joyful, age-appropriate way. Children join a two-hour online workshop every weekend, and from time to time we hold offline workshops in different cities."
        crumbs={[{ label: "Gurukul" }]}
      >
        <div className="tags">
          <span className="tag kids">For children and young learners</span>
          <span className="tag">Registration by parent or guardian</span>
        </div>
      </PageHead>

      <section className="band">
        <div className="wrap split wide-left">
          <div>
            <div className="head">
              <p className="eyebrow">Programme details</p>
              <h2>At a glance</h2>
            </div>
            <Glance
              rows={[
                ["Age groups", ages || <Tbc />],
                ["Weekend workshop", <>Every weekend, 2 hours, online · {weekly?.starts_at ? "see timing below" : <Tbc>Timing to be confirmed</Tbc>}</>],
                ["Offline workshops", "In different cities, announced below"],
                ["Language", language || <Tbc />],
                ["Fees", weekly?.is_free ? "Free" : weekly?.is_free === false && weekly.fee_paise ? inr(weekly.fee_paise) : <Tbc />],
              ]}
            />
          </div>
          <div>
            <div className="head">
              <p className="eyebrow">Announcements</p>
              <h2>News for families</h2>
            </div>
            {announcements.length ? (
              <div className="stack">
                {announcements.map((a) => (
                  <div className="card stack" key={a.id}>
                    <h3>{pick(a.title_en, a.title_hi, lang)}</h3>
                    {a.body && <p className="muted">{a.body}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="slot">
                <b>No announcements yet</b>New workshop timings and offline cities will be posted here.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="band alt" id="register">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Register your child</p>
            <h2>Upcoming Gurukul workshops</h2>
            <p className="lede">A parent or guardian registers each child. We ask only for what we need to share workshop details with you.</p>
          </div>
          <div className="sessions">
            {kids.map((s) => (
              <SessionCard key={s.id} s={s} lang={lang} />
            ))}
            {!kids.length && <div className="card empty">New Gurukul workshops will be announced here.</div>}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">What children learn</p>
            <h2>Gurukul activities</h2>
          </div>
          <div className="grid g3">
            {activities.map(([d, h, p]) => (
              <div className="card pillar" key={h}>
                <p className="deva">{d}</p>
                <h3>{h}</h3>
                <p className="muted">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Gallery</p>
            <h2>Moments from the Gurukul</h2>
            <p className="lede">Photographs of children are published only with written consent from a parent or guardian.</p>
          </div>
          {gallery.length ? (
            <div className="gallery">
              {gallery.map((g) => (
                <Photo key={g.id} path={g.storage_path} alt={g.alt_text} placeholder={g.alt_text} shape="sq" />
              ))}
            </div>
          ) : (
            <div className="slot">
              <b>Gallery</b>Photographs will be added after the first workshops, with each family&apos;s consent.
            </div>
          )}
          <p className="small muted" style={{ marginTop: 18 }}>
            Questions about the Gurukul? <Link href="/contact?topic=gurukul">Send us a message</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
