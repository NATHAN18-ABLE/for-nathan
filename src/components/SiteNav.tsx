"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { asset } from "@/lib/base-path.ts";
import { Phrases } from "./Phrases";
import styles from "./SiteNav.module.css";

type Props = {
  lang: Lang;
  onLang: (next: Lang) => void;
  // "light": white type over imagery. "dark": ink type over porcelain.
  tone?: "light" | "dark";
};

// The pictures run from dusk to deep night down the list.
const ROUTES = [
  { key: "test", href: "/test" },
  { key: "districts", href: "/districts" },
  { key: "story", href: "/story" },
  { key: "metaverse", href: "/metaverse" },
  { key: "about", href: "/about" },
] as const;

// The files carry a version in their name so a changed picture never comes from an old cache.
// focus: where the subject sits, kept in view when the tall panel crops a wide photo.
const PICTURES: Record<(typeof ROUTES)[number]["key"], { file: string; focus: string }> = {
  test: { file: "test-v2.jpg", focus: "50% 50%" }, // Heunginjimun at dusk
  districts: { file: "districts-v2.jpg", focus: "50% 50%" }, // Lotte World Tower and Seokchon Lake
  story: { file: "story-v2.jpg", focus: "22% 50%" }, // the city wall path at night
  metaverse: { file: "metaverse-v2.jpg", focus: "53% 50%" }, // Namsan and the night city
  about: { file: "about.jpg", focus: "50% 50%" },
};
const image = (key: keyof typeof PICTURES) => asset(`/menu/${PICTURES[key].file}`);

export function SiteNav({ lang, onLang, tone = "light" }: Props) {
  const t = COPY[lang].nav;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const isCurrent = (href: string) => pathname?.replace(/\/$/, "") === href;

  useEffect(() => {
    if (!open) return;
    const here = ROUTES.findIndex((r) => isCurrent(r.href));
    setActive(here < 0 ? 0 : here);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) menuButton.current?.focus();
  };

  const mark = (
    <>
      <img
        className={styles.logo}
        src={asset("/brand/logo-128.png")}
        srcSet={`${asset("/brand/logo-64.png")} 1x, ${asset("/brand/logo-128.png")} 2x, ${asset("/brand/logo-256.png")} 3x`}
        alt=""
        width={32}
        height={32}
        decoding="async"
      />
      <span className={styles.wordText} aria-hidden="true">
        <span className={styles.wordStrong}>Seoul,</span> Curated
      </span>
    </>
  );

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
        <Link className={styles.wordmark} href="/" aria-label="Seoul, Curated" translate="no">
          {mark}
        </Link>
        <nav className={styles.links} aria-label={t.main}>
          {ROUTES.map(({ key, href }) => (
            <Link key={key} href={href} className={styles.link} aria-current={isCurrent(href) ? "page" : undefined}>
              {t[key]}
            </Link>
          ))}
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
        <div className={styles.sheetMain}>
          <div className={styles.sheetTop}>
            <Link className={styles.wordmark} href="/" aria-label="Seoul, Curated" translate="no" onClick={() => close(false)}>
              {mark}
            </Link>
            <button type="button" className={styles.menuButton} onClick={() => close()}>
              {t.close}
            </button>
          </div>
          <nav className={styles.sheetLinks} aria-label={t.main}>
            {ROUTES.map(({ key, href }, i) => (
              <Link
                key={key}
                href={href}
                className={styles.sheetLink}
                aria-current={isCurrent(href) ? "page" : undefined}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => close(false)}
              >
                <span className={styles.sheetText}>
                  <span className={styles.sheetLabel}>{t[key]}</span>
                  <span className={styles.sheetHint}><Phrases text={t.hints[key]} /></span>
                </span>
                <img
                  className={styles.thumb}
                  src={image(key)}
                  alt=""
                  width={64}
                  height={64}
                  style={{ objectPosition: PICTURES[key].focus }}
                  loading="lazy"
                  decoding="async"
                />
              </Link>
            ))}
          </nav>
          <div className={styles.sheetFoot}>{langToggle}</div>
        </div>

        <div className={styles.panel} aria-hidden="true">
          {ROUTES.map(({ key }, i) => (
            <img
              key={key}
              className={styles.panelImage}
              data-active={i === active}
              src={image(key)}
              alt=""
              style={{ objectPosition: PICTURES[key].focus }}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>
    </>
  );
}
