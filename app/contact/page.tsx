import type { Metadata } from "next";
import { getSiteContent } from "@/lib/data";
import { Glance, PageHead, Tbc } from "@/components/ui";
import { EnquiryForm } from "./EnquiryForm";

export const metadata: Metadata = { title: "Contact", description: "Contact Raamattva Vidya Peeth about Gurukul admissions, courses, sessions or shop orders." };

export default async function Contact({ searchParams }: { searchParams: Promise<{ topic?: string; order?: string }> }) {
  const [{ topic, order }, content] = await Promise.all([searchParams, getSiteContent()]);
  const v = (k: string) => content[k]?.en || null;
  const link = (k: string) => {
    const url = v(k);
    return url ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url.replace(/^https?:\/\/(www\.)?/, "")}
      </a>
    ) : (
      <Tbc />
    );
  };
  const wa = v("contact.whatsapp");
  return (
    <>
      <PageHead
        eyebrow="संपर्क · Contact"
        title="Contact the Vidya Peeth"
        lede="Write to us about Gurukul admissions, courses, sessions or shop orders. Choose the topic so your message reaches the right person."
        crumbs={[{ label: "Contact" }]}
      />
      <section className="band">
        <div className="wrap split">
          <div className="stack-lg">
            <Glance
              rows={[
                ["WhatsApp", wa ? <a href={`https://wa.me/${wa.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{wa}</a> : <Tbc />],
                ["Email", v("contact.email") ? <a href={`mailto:${v("contact.email")}`}>{v("contact.email")}</a> : <Tbc />],
                ["Address", v("contact.address") ?? <Tbc />],
                ["Instagram", link("social.instagram")],
                ["YouTube", link("social.youtube")],
                ["Facebook", link("social.facebook")],
              ]}
            />
            {v("contact.map_url") ? (
              <a className="btn ghost" href={v("contact.map_url")!} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
              </a>
            ) : (
              <div className="slot">
                <b>Location</b>A map link will be added once the venue is confirmed.
              </div>
            )}
          </div>
          <EnquiryForm topic={topic} order={order} />
        </div>
      </section>
    </>
  );
}
