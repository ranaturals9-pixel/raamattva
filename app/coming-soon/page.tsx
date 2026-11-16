import type { Metadata } from "next";
import { getSiteContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Raamattva Vidya Peeth · Coming soon",
  description: "Raamattva Vidya Peeth, founded by Swami Ananta Giri. Our website is coming soon.",
  robots: { index: false, follow: false },
};

export default async function ComingSoon() {
  const content = await getSiteContent();
  const wa = content["contact.whatsapp"]?.en ?? null;
  const tagline = content["home.tagline"]?.en ?? "Rooted in Wisdom. Growing in Awareness.";
  return (
    <main className="soon">
      <div className="soon-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.webp" alt="Raamattva Vidya Peeth" width={240} height={223} className="soon-logo" />
        <p className="eyebrow">Founded by Swami Ananta Giri</p>
        <h1>Our website is coming soon</h1>
        <p className="tagline">{tagline}</p>
        <p className="lede">
          A Gurukul for children and a centre for spiritual learning, with courses in Hanuman Saadhna, Raam Saadhna, Swarayoga and meditation.
        </p>
        {wa && (
          <p className="soon-contact">
            For courses and enquiries, message us on WhatsApp:{" "}
            <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              {wa}
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
