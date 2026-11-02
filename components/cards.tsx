import Link from "next/link";
import { pick, t, type Lang } from "@/lib/i18n-shared";
import { duration, inr, istDate, istDay, istTime } from "@/lib/format";
import { registrationState } from "@/lib/registration-state";
import { RegisterButton } from "./RegisterButton";
import { Photo, Tbc } from "./ui";
import type { Course } from "@/lib/types";
import type { ProductCard as ProductCardData, SessionWithSeats } from "@/lib/data";

const fmtLabel = (f: string | null, lang: Lang) =>
  f === "online" ? t("online", lang) : f === "in_person" ? t("in_person", lang) : f === "hybrid" ? t("hybrid", lang) : null;

export function FeeTag({ isFree, fee, lang }: { isFree: boolean | null; fee: number | null; lang: Lang }) {
  if (isFree) return <span className="tag free">{t("free", lang)}</span>;
  if (isFree === false && fee) return <span className="tag paid">{inr(fee)}</span>;
  return <span className="tag">Fee {t("tbc", lang).toLowerCase()}</span>;
}

export function CourseCard({ c, lang }: { c: Course; lang: Lang }) {
  return (
    <article className="card course-card">
      <div className="top">
        {c.title_hi && <p className="deva">{c.title_hi}</p>}
        <h3>{c.title_en}</h3>
      </div>
      <div className="body">
        <div className="tags">
          <span className="tag adults">{t("for_adults", lang)}</span>
          {fmtLabel(c.format, lang) ? <span className="tag">{fmtLabel(c.format, lang)}</span> : <span className="tag">Format {t("tbc", lang).toLowerCase()}</span>}
          <FeeTag isFree={c.is_free} fee={c.fee_paise} lang={lang} />
        </div>
        <p className="muted">{pick(c.summary_en, c.summary_hi, lang)}</p>
        <Link className="btn ghost small" href={`/courses/${c.slug}`}>
          {t("view_course", lang)}
        </Link>
      </div>
    </article>
  );
}

export function SessionCard({ s, lang }: { s: SessionWithSeats; lang: Lang }) {
  const state = registrationState(s, s.capacity ? s.seats_left : null);
  const when = s.starts_at ? `${istDate(s.starts_at, lang)} · ${istTime(s.starts_at, lang)}` : s.recurrence_text ?? null;
  const summary: [string, string][] = [
    ["When", when ?? "Date to be announced"],
    ["Format", fmtLabel(s.format, lang) ?? ""],
  ];
  if (s.format !== "online" && (s.city || s.venue)) summary.push(["Venue", [s.venue, s.city].filter(Boolean).join(", ")]);
  const day = s.starts_at ? istDay(s.starts_at) : null;
  return (
    <article className="card session" data-fee={s.is_free ? "free" : s.is_free === false ? "paid" : "tbc"} data-format={s.format} data-audience={s.audience}>
      <div className="date">
        {day ? (
          <>
            <b>{day.day}</b>
            <span>{day.month}</span>
          </>
        ) : s.recurrence_text ? (
          <>
            <b>Weekly</b>
            <span>{s.recurrence_text}</span>
          </>
        ) : (
          <>
            <b>Date</b>
            <span>to be announced</span>
          </>
        )}
      </div>
      <div className="stack" style={{ gap: 10, minWidth: 0 }}>
        <div className="tags">
          <FeeTag isFree={s.is_free} fee={s.fee_paise} lang={lang} />
          <span className="tag">{fmtLabel(s.format, lang)}</span>
          <span className={`tag ${s.audience === "children" ? "kids" : "adults"}`}>{s.audience === "children" ? t("for_children", lang) : t("for_adults", lang)}</span>
        </div>
        <h3>{pick(s.title_en, s.title_hi, lang)}</h3>
        <dl>
          <dt>Time</dt>
          <dd>{s.starts_at ? istTime(s.starts_at, lang) : <Tbc />}</dd>
          <dt>Duration</dt>
          <dd>{duration(s.duration_minutes) ?? <Tbc />}</dd>
          <dt>Facilitator</dt>
          <dd>{s.facilitator ?? <Tbc />}</dd>
          {s.format !== "online" && (
            <>
              <dt>Venue</dt>
              <dd>{s.venue || s.city ? [s.venue, s.city].filter(Boolean).join(", ") : <Tbc>To be announced</Tbc>}</dd>
            </>
          )}
          {s.capacity ? (
            <>
              <dt>Seats</dt>
              <dd>{s.seats_left ?? s.capacity} left</dd>
            </>
          ) : null}
          <dt>Recording</dt>
          <dd>{s.recording_available === null ? <Tbc /> : s.recording_available ? "Shared with registered participants" : "No recording"}</dd>
        </dl>
        {s.course_slug && (
          <p className="small">
            Part of <Link href={`/courses/${s.course_slug}`}>{s.course_title}</Link>
          </p>
        )}
      </div>
      <div className="act">
        <RegisterButton
          targetType="session"
          targetId={s.id}
          title={s.title_en}
          state={state}
          feePaise={s.fee_paise}
          forChildren={s.audience === "children"}
          summary={summary}
          labels={{ free: t("register_free", lang), paid: t("register_pay", lang), soon: t("opens_soon", lang), full: t("full", lang) }}
        />
      </div>
    </article>
  );
}

export function ProductCard({ p, lang }: { p: ProductCardData; lang: Lang }) {
  return (
    <Link className="product-card" href={`/shop/${p.slug}`} data-cat={p.category}>
      <Photo path={p.image?.storage_path} alt={p.image?.alt_text ?? p.title_en} placeholder={p.title_en} shape="sq" />
      <div className="tags">
        <span className="tag">{p.category === "rudraksha" ? "Rudraksha" : "Course Kit"}</span>
        {p.from_paise !== null && !p.in_stock && <span className="tag">{t("out_of_stock", lang)}</span>}
      </div>
      <h3 className="pname">{pick(p.title_en, p.title_hi, lang)}</h3>
      <p className="small">{p.from_paise !== null ? <span className="price">{inr(p.from_paise)}</span> : <Tbc>Price to be confirmed</Tbc>}</p>
    </Link>
  );
}
