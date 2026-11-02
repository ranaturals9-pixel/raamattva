import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLang, pick, t } from "@/lib/i18n";
import { getProduct } from "@/lib/data";
import { AddToCart } from "@/components/AddToCart";
import { Glance, Photo, Tbc } from "@/components/ui";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getProduct((await params).slug);
  return d ? { title: d.product.title_en, description: d.product.description ?? undefined } : { title: "Product not found" };
}

const RUDRAKSHA_FACTS: [string, string][] = [
  ["type", "Type"],
  ["size_mm", "Size (mm)"],
  ["origin", "Origin"],
  ["certification", "Certification"],
];

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [lang, data] = await Promise.all([getLang(), getProduct(slug)]);
  if (!data) notFound();
  const { product: p, variants, images, course } = data;
  const isKit = p.category === "course_kit";
  const facts = p.verified_details ?? {};

  return (
    <>
      <div className="wrap" style={{ paddingBlock: "28px 0" }}>
        <p className="crumb">
          <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / {p.title_en}
        </p>
      </div>
      <section className="band" style={{ paddingTop: 24 }}>
        <div className="wrap pd">
          <div className="stack">
            <Photo path={images[0]?.storage_path} alt={images[0]?.alt_text ?? p.title_en} placeholder={p.title_en} shape="sq" priority />
            {images.length > 1 && (
              <div className="thumb-row">
                {images.slice(1, 5).map((im) => (
                  <Photo key={im.id} path={im.storage_path} alt={im.alt_text} placeholder={im.alt_text} shape="sq" />
                ))}
              </div>
            )}
          </div>
          <div className="stack-lg">
            <div className="stack" style={{ gap: 8 }}>
              <div className="tags">
                <span className="tag">{isKit ? "Course Kit" : "Rudraksha"}</span>
              </div>
              <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>{pick(p.title_en, p.title_hi, lang)}</h1>
            </div>
            {p.description && <p className="lede">{p.description}</p>}
            {isKit && course && (
              <p className="notice">
                This kit is a separate purchase. Buying it does not enrol you in {course.title_en}. <Link href={`/courses/${course.slug}`}>Register for the course</Link> on its own page.
              </p>
            )}
            {variants.length ? (
              <AddToCart variants={variants} labels={{ add: t("add_to_cart", lang), out: t("out_of_stock", lang), option: isKit ? "Option" : "Choose" }} />
            ) : (
              <div className="stack">
                <p>
                  <Tbc>Price to be confirmed</Tbc>
                </p>
                <button className="btn primary" type="button" disabled>
                  {t("not_available", lang)}
                </button>
              </div>
            )}
            <Glance
              rows={
                isKit
                  ? [
                      ["Related course", course ? <Link href={`/courses/${course.slug}`}>{course.title_en}</Link> : <Tbc />],
                      ["Required or optional", p.kit_required === null ? <Tbc /> : p.kit_required ? "Required for the course" : "Optional"],
                      ["Contents", p.kit_contents.length ? <ul className="dots">{p.kit_contents.map((k) => <li key={k}>{k}</li>)}</ul> : <Tbc>Itemised list to be confirmed</Tbc>],
                    ]
                  : RUDRAKSHA_FACTS.map(([k, label]) => [label, facts[k] ? facts[k] : <Tbc key={k}>Shown once verified</Tbc>])
              }
            />
            <div className="faq">
              {p.care_instructions && (
                <details open>
                  <summary>Care instructions</summary>
                  <p>{p.care_instructions}</p>
                </details>
              )}
              <details>
                <summary>Shipping</summary>
                <p>
                  See our <Link href="/shipping">shipping policy</Link> for delivery areas, times and charges.
                </p>
              </details>
              <details>
                <summary>Returns</summary>
                <p>
                  See our <Link href="/refunds">returns and refund policy</Link> before ordering.
                </p>
              </details>
              {!isKit && (
                <details>
                  <summary>A note on claims</summary>
                  <p>We describe rudraksha by verified physical details only. We do not promise health, wealth, protection or spiritual results.</p>
                </details>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
