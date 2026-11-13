import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { getProducts } from "@/lib/data";
import { ProductCard } from "@/components/cards";
import { Filters } from "@/components/Filters";
import { PageHead } from "@/components/ui";

export const revalidate = 60;
export const metadata: Metadata = { title: "Spiritual Shop", description: "Rudraksha, malas and course kits from Raamattva Vidya Peeth, priced in INR." };

export default async function Shop({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const [{ c }, lang, products] = await Promise.all([searchParams, getLang(), getProducts()]);
  return (
    <>
      <PageHead
        eyebrow="सामग्री · Spiritual Shop"
        title="A thoughtfully curated spiritual shop"
        lede="Rudraksha, malas and course kits for your practice. Every listing shows exactly what you receive, its price in rupees and whether it is in stock."
        crumbs={[{ label: "Shop" }]}
      />
      <section className="band">
        <div className="wrap">
          <p className="notice" style={{ marginBottom: 22 }}>
            Buying a course kit does not enrol you in a course. Please register for the course separately on its <Link href="/courses">course page</Link>.
          </p>
          <p className="small" style={{ marginBottom: 22 }}>
            Not sure which rudraksha suits you? Book a <Link href="/sessions#rudraksha-consultation">rudraksha consultation as per your horoscope</Link>.
          </p>
          <Filters
            emptyText="No products in this category yet."
            initial={{ cat: c === "rudraksha" || c === "mala" || c === "course_kit" ? c : "all" }}
            className="grid g3"
            groups={[{ key: "cat", label: "Category", options: [{ value: "rudraksha", label: "Rudraksha" }, { value: "mala", label: "Malas & Bracelets" }, { value: "course_kit", label: "Course Kits" }] }]}
          >
            {products.map((p) => (
              <ProductCard key={p.id} p={p} lang={lang} />
            ))}
          </Filters>
        </div>
      </section>
      <section className="band alt">
        <div className="wrap grid g3">
          <div className="stack">
            <h3>Honest descriptions</h3>
            <p className="muted">Type, size, origin and certification are listed only after they are verified. We do not promise health, wealth, protection or spiritual results.</p>
          </div>
          <div className="stack">
            <h3>Shipping</h3>
            <p className="muted">
              Delivery areas, times and charges are set out on the <Link href="/shipping">shipping page</Link>.
            </p>
          </div>
          <div className="stack">
            <h3>Returns</h3>
            <p className="muted">
              See the <Link href="/refunds">returns and refund policy</Link> before you order.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
