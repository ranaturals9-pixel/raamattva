import Link from "next/link";
import { t, type Lang } from "@/lib/i18n-shared";
import { CartButton, LangButton, MainNav } from "./HeaderControls";
import type { SiteContent } from "@/lib/types";

export const Mark = ({ size = 40 }: { size?: number }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/logo-mark.webp" alt="" width={size} height={Math.round(size * 0.983)} className="logo-mark" />
);

export function Header({ lang, signedIn }: { lang: Lang; signedIn: boolean }) {
  const items = [
    { href: "/", label: t("nav_home", lang) },
    { href: "/about", label: t("nav_about", lang) },
    { href: "/gurukul", label: t("nav_gurukul", lang) },
    { href: "/courses", label: t("nav_courses", lang) },
    { href: "/sessions", label: t("nav_sessions", lang) },
    { href: "/shop", label: t("nav_shop", lang) },
    { href: "/wisdom", label: t("nav_wisdom", lang) },
    { href: "/contact", label: t("nav_contact", lang) },
  ];
  return (
    <header className="site">
      <div className="wrap bar">
        <Link className="brand" href="/" aria-label="Raamattva Vidya Peeth home">
          <Mark />
          <span>
            <b>Raamattva Vidya Peeth</b>
            <small>{t("founded", lang)}</small>
          </span>
        </Link>
        <MainNav items={items} extra={{ href: signedIn ? "/account" : "/login", label: signedIn ? t("my_account", lang) : t("sign_in", lang) }} />
        <LangButton lang={lang} />
        <Link className="iconbtn acct" href={signedIn ? "/account" : "/login"} aria-label={signedIn ? t("my_account", lang) : t("sign_in", lang)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="only-wide">{signedIn ? t("account", lang) : t("sign_in", lang)}</span>
        </Link>
        <CartButton label={t("cart", lang)} />
      </div>
    </header>
  );
}

export function Footer({ content }: { content: SiteContent }) {
  const social = (["instagram", "youtube", "facebook"] as const)
    .map((k) => ({ k, url: content[`social.${k}`]?.en }))
    .filter((s) => s.url);
  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div className="about stack">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.webp" alt="Raamattva Vidya Peeth" width={180} height={167} loading="lazy" className="logo-full" />
            <p className="small">Founded by Swami Ananta Giri</p>
            <p className="tagline">{content["home.tagline"]?.en ?? "Rooted in Wisdom. Growing in Awareness."}</p>
            {social.length > 0 && (
              <p className="small">
                {social.map((s, i) => (
                  <span key={s.k}>
                    {i > 0 && " · "}
                    <a href={s.url!} target="_blank" rel="noopener noreferrer" style={{ display: "inline" }}>
                      {s.k[0].toUpperCase() + s.k.slice(1)}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
          <div>
            <h4>Learn</h4>
            <Link href="/about">About the Vidya Peeth</Link>
            <Link href="/gurukul">Gurukul for children</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/sessions">Sessions &amp; Events</Link>
            <Link href="/wisdom">Wisdom &amp; Resources</Link>
          </div>
          <div>
            <h4>Shop</h4>
            <Link href="/shop?c=rudraksha">Rudraksha</Link>
            <Link href="/shop?c=mala">Malas &amp; Bracelets</Link>
            <Link href="/shop?c=course_kit">Course Kits</Link>
            <Link href="/account">Orders &amp; account</Link>
            <Link href="/shipping">Shipping</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link href="/contact">Contact</Link>
            <Link href="/refunds">Cancellations &amp; refunds</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} Raamattva Vidya Peeth. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
