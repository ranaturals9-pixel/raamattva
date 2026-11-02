import Link from "next/link";
import { storageUrl } from "@/lib/format";

export function Tbc({ children = "To be confirmed" }: { children?: React.ReactNode }) {
  return <span className="tbc">{children}</span>;
}

/** Shows a value, or a "To be confirmed" chip when it is empty. */
export function Val({ v, suffix }: { v: React.ReactNode; suffix?: string }) {
  if (v === null || v === undefined || v === "") return <Tbc />;
  return (
    <>
      {v}
      {suffix}
    </>
  );
}

const DIYA = (
  <svg className="illus" viewBox="0 0 240 240" aria-hidden="true">
    <path d="M120 40c15 19 15 35 0 48-15-13-15-29 0-48Z" fill="var(--saffron)" opacity=".9" />
    <path d="M120 58c6 8 6 15 0 21-6-6-6-13 0-21Z" fill="var(--tint)" />
    <path d="M60 122c10 30 34 44 60 44s50-14 60-44Z" fill="var(--earth)" opacity=".85" />
    <path d="M54 122h132" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
    <path d="M120 96v26" stroke="var(--gold-ink)" strokeWidth="3" strokeLinecap="round" />
    <g fill="none" stroke="var(--gold)" strokeWidth="1.6" opacity=".9">
      <path d="M120 200c-10-12-10-22 0-30 10 8 10 18 0 30Z" />
      <path d="M120 200c-16-4-26-12-28-24 14-2 24 6 28 24Z" />
      <path d="M120 200c16-4 26-12 28-24-14-2-24 6-28 24Z" />
      <path d="M70 204h100" />
    </g>
  </svg>
);

/** Arch-framed photograph. Without a photo it shows a respectful placeholder, never a stock image. */
export function Photo({
  path,
  alt,
  placeholder,
  shape = "arch",
  illustrate = false,
  priority = false,
}: {
  path?: string | null;
  alt: string;
  placeholder: string;
  shape?: "arch" | "wide" | "sq";
  illustrate?: boolean;
  priority?: boolean;
}) {
  const url = storageUrl(path);
  const cls = `arch${shape === "wide" ? " wide" : shape === "sq" ? " sq" : ""}${url ? " has-img" : ""}`;
  if (url) {
    return (
      <div className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
      </div>
    );
  }
  return (
    <div className={cls} role="img" aria-label={`Photograph to be added: ${placeholder}`}>
      {illustrate && DIYA}
      <span className="ph-label">Photograph to be added: {placeholder}</span>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  lede,
  crumbs,
  children,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  crumbs: { href?: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="wrap pagehead">
      <p className="crumb">
        <Link href="/">Home</Link>
        {crumbs.map((c) => (
          <span key={c.label}>
            {" / "}
            {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
          </span>
        ))}
      </p>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </div>
  );
}

export function Glance({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="glance">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Plain text with blank-line paragraphs, for content typed into the admin area. */
export function Prose({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <div className="prose">
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i}>{p.slice(3)}</h2>
          ) : p.split("\n").every((l) => l.trim().startsWith("- ")) ? (
            <ul key={i}>
              {p.split("\n").map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{p}</p>
          )
        )}
    </div>
  );
}
