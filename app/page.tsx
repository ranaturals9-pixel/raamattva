import Link from "next/link";
import { getLang, pick, t } from "@/lib/i18n";
import { getCourses, getProducts, getSessions, getSiteContent } from "@/lib/data";
import { CourseCard, ProductCard, SessionCard } from "@/components/cards";
import { Photo } from "@/components/ui";

export const revalidate = 60;

export default async function Home() {
  const [lang, content, courses, sessions, products] = await Promise.all([getLang(), getSiteContent(), getCourses(), getSessions(), getProducts()]);
  const c = (k: string, fallback = "") => pick(content[k]?.en, content[k]?.hi, lang) || fallback;
  const bio = c("founder.bio");

  return (
    <>
      <div className="wrap hero">
        <div className="stack-lg">
          <p className="founded">{t("founded", lang)}</p>
          <h1>{c("home.headline", "A Sacred Space to Learn, Practise, and Grow")}</h1>
          <p className="tagline">{c("home.tagline", "Rooted in Wisdom. Growing in Awareness.")}</p>
          <p className="lede">{c("home.intro")}</p>
          <div className="ctas">
            <Link className="btn primary" href="/courses">
              {t("explore_courses", lang)}
            </Link>
            <Link className="btn ghost" href="/sessions">
              {t("view_sessions", lang)}
            </Link>
          </div>
        </div>
        <Photo path={content["home.hero_path"]?.en} alt="Raamattva Vidya Peeth" placeholder="the Vidya Peeth or a moment of practice" illustrate priority />
      </div>

      <section className="band alt">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Two paths of learning</p>
            <h2>For children, and for adult seekers</h2>
            <p className="lede">The Gurukul is for children and young learners. Courses are designed for adults. Each has its own registration.</p>
          </div>
          <div className="grid g2">
            <div className="card pillar">
              <p className="deva">गुरुकुल</p>
              <h3>Gurukul for children</h3>
              <div className="tags">
                <span className="tag kids">Children &amp; young learners</span>
              </div>
              <p className="muted">
                Two-hour online workshops every weekend, and offline workshops held from time to time in different cities. Children learn mantra and shloka, devotional stories, bhajans,
                meditation and values.
              </p>
              <Link className="more" href="/gurukul">
                Explore the Gurukul →
              </Link>
            </div>
            <div className="card pillar">
              <p className="deva">पाठ्यक्रम</p>
              <h3>Courses for adults</h3>
              <div className="tags">
                <span className="tag adults">Adults</span>
              </div>
              <p className="muted">Structured courses in Hanuman Saadhna, Ram Saadhna and meditation, for beginners and those deepening an existing practice.</p>
              <Link className="more" href="/courses">
                Explore courses →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {courses.length > 0 && (
        <section className="band">
          <div className="wrap">
            <div className="head row">
              <div className="stack">
                <p className="eyebrow">Featured courses</p>
                <h2>Begin your saadhna</h2>
              </div>
              <Link className="btn ghost small" href="/courses">
                All courses
              </Link>
            </div>
            <div className="grid g3">
              {courses.slice(0, 3).map((x) => (
                <CourseCard key={x.id} c={x} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="band alt">
        <div className="wrap">
          <div className="head row">
            <div className="stack">
              <p className="eyebrow">Free and paid</p>
              <h2>Upcoming sessions</h2>
            </div>
            <Link className="btn ghost small" href="/sessions">
              Full schedule
            </Link>
          </div>
          <div className="sessions">
            {sessions.slice(0, 3).map((s) => (
              <SessionCard key={s.id} s={s} lang={lang} />
            ))}
            {!sessions.length && <div className="card empty">New sessions will be announced here.</div>}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap split">
          <Photo path={content["founder.portrait_path"]?.en} alt="Swami Ananta Giri" placeholder="portrait of Swami Ananta Giri" />
          <div className="stack-lg">
            <p className="eyebrow">The founder</p>
            <h2>Swami Ananta Giri</h2>
            {bio ? (
              <p className="lede">{bio.split(/\n{2,}/)[0]}</p>
            ) : (
              <div className="slot">
                <b>Approved biography</b>A short introduction to Swamiji will appear here once approved.
              </div>
            )}
            <div>
              <Link className="btn ghost" href="/about#founder">
                About Swamiji
              </Link>
            </div>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="band alt">
          <div className="wrap">
            <div className="head row">
              <div className="stack">
                <p className="eyebrow">Spiritual shop</p>
                <h2>For your practice</h2>
              </div>
              <Link className="btn ghost small" href="/shop">
                Visit the shop
              </Link>
            </div>
            <div className="grid g4">
              {products.slice(0, 4).map((p) => (
                <ProductCard key={p.id} p={p} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
