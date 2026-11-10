"use client";

import Link from "next/link";
import { COPY } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { SiteNav } from "./SiteNav";
import styles from "./ComingSoon.module.css";

export type PageKey = "districts" | "story" | "metaverse" | "about";

const PAGES = {
  en: {
    districts: {
      lede: "A day course for each of the twelve districts, side by side. The places are being researched now.",
    },
    story: {
      lede: "Two thousand years of Seoul, from Hanseong Baekje to the city you are about to walk. Coming next.",
    },
    metaverse: {
      lede: "Meet travelers who found the same district. The first five rooms open together.",
      list: ["Jongno", "Dongdaemun", "Mapo", "Seongdong", "Yongsan"],
    },
    about: {
      lede: "The team behind Seoul, Curated. Introductions are on their way.",
    },
    cta: "Take the test",
    home: "Back to the start",
  },
  ko: {
    districts: {
      lede: "열두 개 구의 하루 코스를 한곳에서 비교해 보세요. 장소는 지금 조사하고 있습니다.",
    },
    story: {
      lede: "한성백제부터 지금 걷게 될 도시까지, 서울의 2천 년. 곧 이어집니다.",
    },
    metaverse: {
      lede: "같은 구를 고른 여행자들을 만나 보세요. 첫 다섯 개의 방이 함께 열립니다.",
      list: ["종로", "동대문", "마포", "성동", "용산"],
    },
    about: {
      lede: "Seoul, Curated를 만든 팀을 곧 소개합니다.",
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
        <p className={styles.lede}>{body.lede}</p>
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
        <p>{COPY[lang].proposal}</p>
      </footer>
    </div>
  );
}
