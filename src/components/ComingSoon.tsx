"use client";

import Link from "next/link";
import { COPY } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { SiteNav } from "./SiteNav";
import { BuildTag } from "./BuildTag";
import { Phrases } from "./Phrases";
import styles from "./ComingSoon.module.css";

export type PageKey = "story" | "metaverse";

const PAGES = {
  en: {
    story: {
      lede: "Two thousand years of Seoul, from the Baekje kingdom to the city you are about to explore. Coming soon.",
    },
    metaverse: {
      lede: "Walk the streets of Seoul with friends before you go. Four rooms open first.",
      list: ["Jongno", "Seodaemun", "Yongsan", "Yeongdeungpo"],
    },
    cta: "Take the test",
    home: "Back to the start",
  },
  ko: {
    story: {
      lede: "한성백제부터 지금 걷게 될 도시까지, 서울의 2천 년을 담았습니다. 곧 공개됩니다.",
    },
    metaverse: {
      lede: "친구들과 함께 서울의 골목을 먼저 걸어 보세요. 네 개의 방이 먼저 열립니다.",
      list: ["종로", "서대문", "용산", "영등포"],
    },
    cta: "테스트 시작하기",
    home: "처음으로",
  },
} as const;

export function ComingSoon({ page }: { page: PageKey }) {
  const [lang, chooseLang] = useLang();
  const copy = PAGES[lang];
  const body = copy[page];
  return (
    <div className={styles.page}>
      <SiteNav lang={lang} onLang={chooseLang} tone="dark" />
      <main className={styles.main}>
        <h1 className={styles.title}>{COPY[lang].nav[page]}</h1>
        <p className={styles.lede}><Phrases text={body.lede} /></p>
        {"list" in body && (
          <ul className={styles.list}>
            {body.list.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
        <div className={styles.actions}>
          <Link className="btn btn-primary" href="/test">
            {copy.cta}
          </Link>
          <Link className={styles.home} href="/">
            {copy.home}
          </Link>
        </div>
      </main>
      <footer className="site-footer">
        <p>
          <Phrases text={COPY[lang].proposal} />
        </p>
        <BuildTag lang={lang} />
      </footer>
    </div>
  );
}
