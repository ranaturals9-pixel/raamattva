import type { Metadata } from "next";
import { PageHead } from "@/components/ui";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function Checkout() {
  return (
    <>
      <PageHead eyebrow="Checkout" title="Delivery and payment" lede="Check your order, enter where it should go, and pay securely." crumbs={[{ href: "/shop", label: "Shop" }, { label: "Checkout" }]} />
      <section className="band">
        <div className="wrap">
          <CheckoutForm />
        </div>
      </section>
    </>
  );
}
