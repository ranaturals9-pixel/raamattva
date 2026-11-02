import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/lib/i18n";
import { getUser } from "@/lib/auth";
import { getSiteContent } from "@/lib/data";
import { Footer, Header } from "@/components/SiteChrome";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Raamattva Vidya Peeth", template: "%s · Raamattva Vidya Peeth" },
  description:
    "Raamattva Vidya Peeth, founded by Swami Ananta Giri: a Gurukul for children and a centre for spiritual learning with courses, sessions and a spiritual shop.",
  openGraph: {
    type: "website",
    siteName: "Raamattva Vidya Peeth",
    locale: "en_IN",
  },
};

export const viewport: Viewport = { themeColor: "#FBF7EE", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, user, content] = await Promise.all([getLang(), getUser(), getSiteContent()]);
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=Mukta:wght@300;400;600;700&family=Tiro+Devanagari+Hindi&display=swap"
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <CartProvider>
          <Header lang={lang} signedIn={Boolean(user)} />
          <main id="main">{children}</main>
          <Footer content={content} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
