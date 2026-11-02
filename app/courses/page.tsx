import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { getCourses } from "@/lib/data";
import { CourseCard } from "@/components/cards";
import { PageHead } from "@/components/ui";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Courses",
  description: "Adult courses at Raamattva Vidya Peeth: Hanuman Saadhna, Ram Saadhna and Essentials of Meditation.",
};

export default async function Courses() {
  const [lang, courses] = await Promise.all([getLang(), getCourses()]);
  return (
    <>
      <PageHead
        eyebrow="पाठ्यक्रम · Courses"
        title="Courses for adult seekers"
        lede={
          <>
            Structured courses in devotion and meditation. Each course page lists its format, schedule, fee, kit and what is included. Children&apos;s programmes are in the{" "}
            <Link href="/gurukul">Gurukul</Link>.
          </>
        }
        crumbs={[{ label: "Courses" }]}
      >
        <div className="tags">
          <span className="tag adults">For adults</span>
        </div>
      </PageHead>
      <section className="band">
        <div className="wrap">
          <div className="grid g3">
            {courses.map((c) => (
              <CourseCard key={c.id} c={c} lang={lang} />
            ))}
          </div>
          {!courses.length && <div className="card empty">Courses will be announced soon.</div>}
        </div>
      </section>
    </>
  );
}
