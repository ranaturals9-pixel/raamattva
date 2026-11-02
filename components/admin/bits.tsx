import Link from "next/link";
import { inr, istDate, istTime } from "@/lib/format";

export function Flash({ sp }: { sp: { saved?: string; error?: string; notified?: string } }) {
  if (sp.error) return <p className="notice">{sp.error}</p>;
  if (sp.notified) return <p className="notice ok">Saved. Email sent to {sp.notified} registrant(s).</p>;
  if (sp.saved) return <p className="notice ok">Saved.</p>;
  return null;
}

export function AdminHead({ title, lede, action }: { title: string; lede?: string; action?: { href: string; label: string } }) {
  return (
    <div className="head row" style={{ margin: 0 }}>
      <div className="stack">
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)" }}>{title}</h1>
        {lede && <p className="muted">{lede}</p>}
      </div>
      {action && (
        <Link className="btn primary small" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Cell({ v, kind }: { v: unknown; kind?: string }) {
  if (v === null || v === undefined || v === "") return <span className="muted">—</span>;
  if (kind === "status") return <span className={`status-pill${v === "published" ? " ok" : " muted"}`}>{String(v)}</span>;
  if (kind === "money") return <>{inr(v as number)}</>;
  if (kind === "date") return <>{istDate(String(v))}</>;
  if (kind === "datetime") return <>{`${istDate(String(v))}, ${istTime(String(v))}`}</>;
  if (kind === "bool") return <>{v ? "Yes" : "No"}</>;
  return <>{String(v).replace(/_/g, " ")}</>;
}
