"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { setLanguage } from "@/app/actions/misc";
import type { Lang } from "@/lib/i18n-shared";

export function LangButton({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="iconbtn lang"
      type="button"
      aria-label={lang === "hi" ? "Switch to English" : "हिंदी में देखें"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLanguage(lang === "hi" ? "en" : "hi");
          router.refresh();
        })
      }
    >
      {lang === "hi" ? "English" : "हिंदी"}
    </button>
  );
}

export function CartButton({ label }: { label: string }) {
  const { count, setOpen } = useCart();
  return (
    <button className="iconbtn" type="button" aria-label={label} onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8h14l-1.4 11H6.4Z M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span className="count">{count}</span>
    </button>
  );
}

export function MainNav({ items, extra }: { items: { href: string; label: string }[]; extra: { href: string; label: string } }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <div className="header-nav">
        <nav className={`main${open ? " open" : ""}`} id="mainnav" aria-label="Main">
          <ul>
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={active(i.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                  {i.label}
                </Link>
              </li>
            ))}
            <li className="only-narrow">
              <Link href={extra.href} aria-current={active(extra.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                {extra.label}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <button className="iconbtn menu-toggle" type="button" aria-expanded={open} aria-controls="mainnav" aria-label="Menu" onClick={() => setOpen(!open)}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
