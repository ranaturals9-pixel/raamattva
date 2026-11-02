import type { Metadata } from "next";
import Link from "next/link";
import { getLang, pick } from "@/lib/i18n";
import { getSiteContent } from "@/lib/data";
import { PageHead, Photo, Prose } from "@/components/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "About the Vidya Peeth",
  description: "The vision, purpose and approach of Raamattva Vidya Peeth, and its founder Swami Ananta Giri.",
};

const threads = [
  ["ज्ञान", "Wisdom", "Study of the scriptures and the teachings of the tradition."],
  ["भक्ति", "Devotion", "Prayer, chanting and bhajan as a living relationship with the Divine."],
  ["जागरूकता", "Awareness", "Meditation and self-reflection that steady the mind."],
  ["संस्कार", "Values", "Truthfulness, service, gratitude and respect, learnt early and practised daily."],
  ["आचरण", "Practical application", "Simple practices that fit into the life of a family or a working person."],
];

export default async function About() {
  const [lang, content] = await Promise.all([getLang(), getSiteContent()]);
  const vision = pick(content["about.vision"]?.en, content["about.vision"]?.hi, lang);
  const bio = pick(content["founder.bio"]?.en, content["founder.bio"]?.hi, lang);
  return (
    <>
      <PageHead
        eyebrow="About the Vidya Peeth"
        title="Where spiritual wisdom becomes part of everyday life"
        lede="Raamattva Vidya Peeth is a Gurukul and centre for spiritual learning founded by Swami Ananta Giri. It brings together teaching for children, courses for adults, regular sessions and resources for daily practice."
        crumbs={[{ label: "About" }]}
      />
      <section className="band">
        <div className="wrap split">
          <div className="stack-lg">
            <p className="eyebrow">Our vision</p>
            <h2>Learning that is lived</h2>
            {vision ? (
              <Prose text={vision} />
            ) : (
              <p className="lede">
                We hope to help each student carry spiritual wisdom into ordinary life: at home, at work and in their relationships. Study is meant to become practice, and practice is
                meant to become a way of living.
              </p>
            )}
          </div>
          <div className="stack-lg">
            <p className="eyebrow">Our purpose</p>
            <h2>A home for sincere learning</h2>
            <p className="lede">
              The Vidya Peeth offers a dignified, welcoming space for children, families, beginners and committed seekers to learn from the scriptures, practise together and grow in
              awareness.
            </p>
          </div>
        </div>
      </section>
      <section className="band alt">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Our approach</p>
            <h2>Five threads of spiritual education</h2>
          </div>
          <div className="grid g3">
            {threads.map(([d, h, p]) => (
              <div className="card pillar" key={h}>
                <p className="deva">{d}</p>
                <h3>{h}</h3>
                <p className="muted">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="band" id="founder">
        <div className="wrap split">
          <Photo path={content["founder.portrait_path"]?.en} alt="Swami Ananta Giri" placeholder="approved portrait of Swami Ananta Giri" />
          <div className="stack-lg">
            <p className="eyebrow">The founder</p>
            <h2>Swami Ananta Giri</h2>
            {bio ? (
              <Prose text={bio} />
            ) : (
              <div className="slot">
                <b>Approved biography</b>Swamiji&apos;s biography will appear here once she has reviewed and approved it.
              </div>
            )}
            <div className="ctas">
              <Link className="btn primary" href="/courses">
                Learn with Swamiji
              </Link>
              <Link className="btn ghost" href="/sessions">
                Upcoming sessions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
