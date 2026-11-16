"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Phrases } from "@/components/Phrases";
import { useLang } from "@/lib/lang.ts";
import { COPY } from "@/lib/hero/copy.ts";
import { CAPACITY, ROOMS, nearestRoom } from "@/lib/metaverse/queue.ts";
import { matchDistricts, scoreAnswers, type Answer } from "@/lib/match/match.ts";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { OPEN_ROOMS } from "@/lib/metaverse/open.ts";
import styles from "./RoomList.module.css";

// Planned rooms, in the order of the day: morning to night.
const PLAN: Record<string, { place: { en: string; ko: string }; hour: { en: string; ko: string }; sky: [string, string] }> = {
  jongno: { place: { en: "Seosulla-gil, along the Jongmyo wall", ko: "서순라길, 종묘 돌담길" }, hour: { en: "Morning", ko: "오전" }, sky: ["#c9dcee", "#f7f2e8"] },
  seodaemun: { place: { en: "Ansan forest boardwalk", ko: "안산 자락길" }, hour: { en: "Afternoon", ko: "오후" }, sky: ["#b9d4ea", "#eef1e6"] },
  yongsan: { place: { en: "Haebangchon hillside stairs", ko: "해방촌 언덕 계단길" }, hour: { en: "Sunset", ko: "해 질 녘" }, sky: ["#8fa6d6", "#f2c9a5"] },
  yeongdeungpo: { place: { en: "Mullae metal-workshop alleys", ko: "문래 철공소 골목" }, hour: { en: "Night", ko: "밤" }, sky: ["#1d2a5a", "#4a4f7a"] },
};

const TEXT = {
  en: {
    lede: "Meet travelers who found the same district. Each room holds ten people at a time; when it is full, you wait in line.",
    enter: "Enter",
    soon: "Opening soon",
    here: (n: number) => `${n} of ${CAPACITY} here`,
    yours: "Your room",
    near: (d: string) => `Closest room to ${d}`,
  },
  ko: {
    lede: "같은 구를 고른 여행자들을 만나 보세요. 방마다 한 번에 열 명까지 들어갈 수 있고, 가득 차면 줄을 서서 기다려요.",
    enter: "들어가기",
    soon: "곧 열려요",
    here: (n: number) => `${CAPACITY}명 중 ${n}명`,
    yours: "나의 방",
    near: (d: string) => `${d}와 가장 가까운 방`,
  },
} as const;

export function RoomList() {
  const [lang, chooseLang] = useLang();
  const t = TEXT[lang];
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<{ room: string; from: string | null } | null>(null);

  useEffect(() => {
    try {
      const a = JSON.parse(sessionStorage.getItem("seoul.answers") ?? "[]") as Answer[];
      if (Array.isArray(a) && a.length >= QUESTIONS.length) {
        const best = matchDistricts(scoreAnswers(a)).best.slug;
        const room = nearestRoom(best);
        setMine({ room, from: room === best ? null : best });
      }
    } catch {}
  }, []);

  useEffect(() => {
    let stops: (() => void)[] = [];
    import("@/lib/metaverse/realtime.ts").then(({ watchRoom }) => {
      stops = OPEN_ROOMS.map((slug) => watchRoom(slug, (n) => setCounts((c) => ({ ...c, [slug]: n }))));
    });
    return () => stops.forEach((s) => s());
  }, []);

  const name = (slug: string) => {
    const d = DISTRICTS.find((x) => x.slug === slug);
    return lang === "ko" ? d?.nameKo ?? slug : d?.nameEn ?? slug;
  };

  return (
    <div className={styles.page}>
      <SiteNav lang={lang} onLang={chooseLang} tone="dark" />
      <main className={styles.main}>
        <h1 className={styles.title}>{COPY[lang].nav.metaverse}</h1>
        <p className={styles.lede}>
          <Phrases text={t.lede} />
        </p>
        <ol className={styles.rooms}>
          {ROOMS.map((slug) => {
            const plan = PLAN[slug];
            const built = OPEN_ROOMS.includes(slug);
            const isMine = mine?.room === slug;
            return (
              <li key={slug} className={styles.row} data-mine={isMine}>
                <span className={styles.sky} style={{ background: `linear-gradient(${plan.sky[0]}, ${plan.sky[1]})` }} aria-hidden="true" />
                <div className={styles.text}>
                  <h2>
                    {name(slug)}
                    {isMine && <span className={styles.badge}>{t.yours}</span>}
                  </h2>
                  <p>
                    <span className="phrase">{plan.place[lang]}</span> <span className="phrase">· {plan.hour[lang]}</span>
                  </p>
                  {isMine && mine?.from && <p className={styles.note}>{t.near(name(mine.from))}</p>}
                </div>
                <div className={styles.action}>
                  {built ? (
                    <>
                      <span className={styles.count}>{t.here(Math.min(CAPACITY, counts[slug] ?? 0))}</span>
                      <Link className={isMine ? "btn btn-primary" : "btn"} href={`/metaverse/${slug}`}>
                        {t.enter}
                      </Link>
                    </>
                  ) : (
                    <span className={styles.soon}>{t.soon}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </main>
      <footer className="site-footer">
        <p>
          <Phrases text={COPY[lang].proposal} />
        </p>
      </footer>
    </div>
  );
}
