import type { Metadata } from "next";
import Link from "next/link";
import { getResources, getVerses } from "@/lib/data";
import { Filters } from "@/components/Filters";
import { PageHead } from "@/components/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Wisdom and Resources",
  description: "Articles, reflections, videos and resources on Hanuman Saadhna, Raam Saadhna, meditation and spiritual living.",
};

const TOPICS = { hanuman: "Hanuman Saadhna", ram: "Raam Saadhna", meditation: "Meditation", living: "Spiritual Living" } as const;
const TYPES = { article: "Article", reflection: "Reflection", video: "Video", audio: "Audio", study_material: "Study material" } as const;

export default async function Wisdom() {
  const [verses, resources] = await Promise.all([getVerses(), getResources()]);
  return (
    <>
      <PageHead
        eyebrow="ज्ञान · Wisdom & Resources"
        title="Wisdom and resources"
        lede="Articles, reflections, videos and introductory resources on Hanuman Saadhna, Raam Saadhna, meditation and spiritual living. Some are open to all, and some are for enrolled students."
        crumbs={[{ label: "Wisdom" }]}
      />
      {verses.length > 0 && (
        <section className="band">
          <div className="wrap">
            <div className="head">
              <p className="eyebrow">Scripture and reflection</p>
              <h2>Verses for contemplation</h2>
              <p className="lede">
                Scriptural text and its translation are labelled <b>Scripture</b>. Swamiji&apos;s own contemplative interpretations are shown beside them, clearly marked as her
                reflection.
              </p>
            </div>
            <div className="stack-lg">
              {verses.map((v) => (
                <div className="split" style={{ gap: 18 }} key={v.id}>
                  <div className="scripture">
                    <span className="tag" style={{ justifySelf: "start" }}>
                      Scripture · {TOPICS[v.topic]}
                    </span>
                    <p className="verse" lang="hi">
                      {v.text_original.split("\n").map((l, i) => (
                        <span key={i} style={{ display: "block" }}>
                          {l}
                        </span>
                      ))}
                    </p>
                    {v.transliteration && <p className="small muted">{v.transliteration}</p>}
                    {v.translation && <p className="muted small">{v.translation}</p>}
                    <cite>{v.source}</cite>
                  </div>
                  {v.reflection && v.reflection_approved ? (
                    <div className="card stack">
                      <span className="tag paid" style={{ justifySelf: "start" }}>
                        Swamiji&apos;s reflection
                      </span>
                      <p>{v.reflection}</p>
                    </div>
                  ) : (
                    <div className="slot">
                      <b>Swamiji&apos;s reflection</b>Her contemplative interpretation of this verse will appear here, shown separately from the scripture itself.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="band alt">
        <div className="wrap">
          <div className="head">
            <p className="eyebrow">Library</p>
            <h2>Resources</h2>
          </div>
          {resources.length ? (
            <Filters
              className="grid g3"
              emptyText="No resources match these filters yet."
              groups={[
                { key: "topic", label: "Topic", options: Object.entries(TOPICS).map(([value, label]) => ({ value, label })) },
                { key: "access", label: "Access", options: [{ value: "free", label: "Free" }, { value: "students", label: "For enrolled students" }] },
              ]}
            >
              {resources.map((r) => (
                <Link key={r.id} href={`/wisdom/${r.slug}`} className="card stack" data-topic={r.topic} data-access={r.access} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="tags">
                    {r.access === "free" ? <span className="tag free">Free</span> : <span className="tag paid">For enrolled students</span>}
                    <span className="tag">{TYPES[r.type]}</span>
                  </div>
                  <h3 style={{ fontSize: "1.12rem" }}>{r.title_en}</h3>
                  {r.summary && <p className="small muted">{r.summary}</p>}
                  <p className="small muted">{TOPICS[r.topic]}</p>
                </Link>
              ))}
            </Filters>
          ) : (
            <div className="slot">
              <b>Coming soon</b>Articles, reflections and videos will be published here as they are prepared.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
