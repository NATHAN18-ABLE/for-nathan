"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import styles from "./SiteNav.module.css";

type Props = {
  lang: Lang;
  onLang: (next: Lang) => void;
  // "light": white type over imagery. "dark": ink type over porcelain.
  tone?: "light" | "dark";
  // On the home page the test lives at the end of the scroll, so the link scrolls there.
  onTest?: () => void;
};

const ROUTES = [
  { key: "test", href: "/test" },
  { key: "districts", href: "/districts" },
  { key: "story", href: "/story" },
  { key: "metaverse", href: "/metaverse" },
  { key: "about", href: "/about" },
] as const;

export function SiteNav({ lang, onLang, tone = "light", onTest }: Props) {
  const t = COPY[lang].nav;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const isCurrent = (href: string) => pathname?.replace(/\/$/, "") === href;

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    sheet.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) menuButton.current?.focus();
  };

  const links = (inSheet: boolean) =>
    ROUTES.map(({ key, href }) => (
      <Link
        key={key}
        href={href}
        className={inSheet ? styles.sheetLink : styles.link}
        aria-current={isCurrent(href) ? "page" : undefined}
        onClick={(e) => {
          if (key === "test" && onTest) {
            e.preventDefault();
            onTest();
          }
          if (inSheet) close(false);
        }}
      >
        {t[key]}
      </Link>
    ));

  const langToggle = (
    <div className={styles.lang} role="group" aria-label={t.language}>
      <button type="button" aria-pressed={lang === "en"} onClick={() => onLang("en")}>
        EN
      </button>
      <span aria-hidden="true">|</span>
      <button type="button" aria-pressed={lang === "ko"} onClick={() => onLang("ko")}>
        KO
      </button>
    </div>
  );

  return (
    <>
      <header className={styles.nav} data-tone={tone}>
        <Link className={styles.wordmark} href="/">
          Seoul, Curated
        </Link>
        <nav className={styles.links} aria-label={t.main}>
          {links(false)}
          {langToggle}
        </nav>
        <button
          ref={menuButton}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen(true)}
        >
          {t.menu}
        </button>
      </header>

      <div
        ref={sheet}
        id="site-menu"
        className={styles.sheet}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label={t.main}
        inert={!open}
      >
        <div className={styles.sheetTop}>
          <Link className={styles.wordmark} href="/" onClick={() => close(false)}>
            Seoul, Curated
          </Link>
          <button type="button" className={styles.menuButton} onClick={() => close()}>
            {t.close}
          </button>
        </div>
        <nav className={styles.sheetLinks} aria-label={t.main}>
          {links(true)}
        </nav>
        <div className={styles.sheetFoot}>{langToggle}</div>
      </div>
    </>
  );
}
