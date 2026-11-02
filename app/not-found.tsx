import Link from "next/link";

export default function NotFound() {
  return (
    <section className="band">
      <div className="wrap narrow stack-lg" style={{ textAlign: "center" }}>
        <p className="eyebrow">Page not found</p>
        <h1>This page could not be found</h1>
        <p className="lede" style={{ marginInline: "auto" }}>It may have moved, or the link may be incomplete.</p>
        <div className="ctas" style={{ justifyContent: "center" }}>
          <Link className="btn primary" href="/">
            Go to the home page
          </Link>
          <Link className="btn ghost" href="/sessions">
            Upcoming sessions
          </Link>
        </div>
      </div>
    </section>
  );
}
