"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Phrases } from "@/components/Phrases";
import { useLang } from "@/lib/lang.ts";
import { COPY } from "@/lib/hero/copy.ts";
import { MAX_INSTANCES, ROOMS, nearestRoom } from "@/lib/metaverse/queue.ts";
import { matchDistricts, scoreAnswers, type Answer } from "@/lib/match/match.ts";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { OPEN_ROOMS } from "@/lib/metaverse/open.ts";
import styles from "./RoomList.module.css";

// Rooms and their hour: a bright day in the forest, dusk in the old town, sunset, night.
const PLAN: Record<string, { place: { en: string; ko: string }; hour: { en: string; ko: string }; sky: [string, string] }> = {
  jongno: { place: { en: "Seosulla-gil, along the Jongmyo wall", ko: "서순라길, 종묘 돌담길" }, hour: { en: "Autumn evening", ko: "가을 저녁" }, sky: ["#2f3b6b", "#eea07c"] },
  seodaemun: { place: { en: "Ansan Jarak-gil forest boardwalk", ko: "안산 자락길 숲길" }, hour: { en: "Autumn day", ko: "가을 낮" }, sky: ["#8ec3ea", "#e6f0ea"] },
  yongsan: { place: { en: "Haebangchon hillside stairs", ko: "해방촌 언덕 계단길" }, hour: { en: "Sunset", ko: "해 질 녘" }, sky: ["#8fa6d6", "#f2c9a5"] },
  yeongdeungpo: { place: { en: "Mullae ironworks alleys", ko: "문래 철공소 골목" }, hour: { en: "Night", ko: "밤" }, sky: ["#1d2a5a", "#4a4f7a"] },
};

const TEXT = {
  en: {
    lede: "Walk the streets of Seoul with friends before you go. Each room holds up to thirty people, and a new room opens when one fills up.",
    enter: "Enter",
    wardrobe: "Choose your traveler in the wardrobe",
    soon: "Opening soon",
    here: (n: number) => (n === 1 ? "1 traveler here" : `${n} travelers here`),
    yours: "Your room",
    near: (d: string) => `Closest room to ${d}`,
  },
  ko: {
    lede: "친구들과 함께 서울의 골목을 먼저 걸어 보세요. 방마다 30명까지 들어갈 수 있고, 가득 차면 같은 방이 하나 더 열립니다.",
    enter: "들어가기",
    wardrobe: "옷장에서 내 캐릭터 꾸미기",
    soon: "곧 열려요",
    here: (n: number) => `지금 ${n}명`,
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
      // Count everyone across the room's copies (01, 02, …).
      const per: Record<string, number[]> = {};
      stops = OPEN_ROOMS.flatMap((slug) =>
        Array.from({ length: MAX_INSTANCES }, (_, i) =>
          watchRoom(slug, i + 1, (n) => {
            per[slug] = per[slug] ?? [];
            per[slug][i] = n;
            setCounts((c) => ({ ...c, [slug]: per[slug].reduce((a, b) => a + (b ?? 0), 0) }));
          }),
        ),
      );
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
        <Link className={styles.wardrobe} href="/metaverse/wardrobe">
          {t.wardrobe}
          <span aria-hidden="true">→</span>
        </Link>
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
                      <span className={styles.count}>{t.here(counts[slug] ?? 0)}</span>
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
