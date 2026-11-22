"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNav } from "./SiteNav";
import { BuildTag } from "./BuildTag";
import { Phrases } from "./Phrases";
import { useLang } from "@/lib/lang.ts";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { TRAVEL_TYPES } from "@/lib/match/travel-types.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { loadStats, type TestStats } from "@/lib/test-stats.ts";
import styles from "./TestStats.module.css";

const T = {
  en: {
    title: "Test statistics",
    lede: (n: number, today: number) => (n === 0 ? "No one has finished the test yet." : `${n.toLocaleString("en")} people have finished the test, ${today} of them today.`),
    note: "Anonymous: each finished test counts once, with no names or contact details. Updates every 30 seconds.",
    types: "Travel types",
    districts: "Matched districts",
    days: "The last 30 days",
    questions: "Answers, question by question",
    audience: "Language and device",
    en: "English",
    ko: "Korean",
    phone: "Phone",
    tablet: "Tablet",
    desktop: "Computer",
    empty: "Results appear here as people finish the test.",
    take: "Take the test",
    failed: "The statistics could not be loaded. Check the connection and reload.",
    loading: "Loading…",
    updated: (t: string) => `Updated ${t}`,
  },
  ko: {
    title: "테스트 통계",
    lede: (n: number, today: number) => (n === 0 ? "아직 테스트를 마친 사람이 없어요." : `지금까지 ${n.toLocaleString("ko")}명이 테스트를 마쳤어요. 오늘은 ${today}명이에요.`),
    note: "이름이나 연락처 없이, 테스트를 마친 한 번을 한 명으로 셉니다. 30초마다 새로 고쳐져요.",
    types: "여행 유형",
    districts: "추천된 지역",
    days: "최근 30일",
    questions: "문항별 선택",
    audience: "언어와 기기",
    en: "영어",
    ko: "한국어",
    phone: "휴대폰",
    tablet: "태블릿",
    desktop: "컴퓨터",
    empty: "테스트를 마친 결과가 여기에 쌓여요.",
    take: "테스트 하러 가기",
    failed: "통계를 불러오지 못했어요. 연결을 확인하고 새로 고쳐 주세요.",
    loading: "불러오는 중…",
    updated: (t: string) => `${t} 기준`,
  },
} as const;

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/** A labelled bar: the share of the total, with the count beside it. */
function Bar({ label, sub, n, total, max }: { label: string; sub?: string; n: number; total: number; max: number }) {
  return (
    <li className={styles.bar}>
      <span className={styles.barLabel}>
        {label}
        {sub && <span className={styles.barSub}>{sub}</span>}
      </span>
      <span className={styles.barTrack} aria-hidden="true">
        <span className={styles.barFill} style={{ transform: `scaleX(${max ? n / max : 0})` }} />
      </span>
      <span className={styles.barValue}>
        {n} <span className={styles.barPct}>{pct(n, total)}%</span>
      </span>
    </li>
  );
}

/** Two shares side by side in one bar, for a question's two answers or two languages. */
function Split({ left, right, a, b }: { left: string; right: string; a: number; b: number }) {
  const total = a + b;
  return (
    <div className={styles.split}>
      <div className={styles.splitTrack} aria-hidden="true">
        <span className={styles.splitA} style={{ flexGrow: total ? a : 1 }} />
        <span className={styles.splitB} style={{ flexGrow: total ? b : 1 }} />
      </div>
      <div className={styles.splitLabels}>
        <span>
          <strong>{pct(a, total)}%</strong> {left}
        </span>
        <span>
          {right} <strong>{pct(b, total)}%</strong>
        </span>
      </div>
    </div>
  );
}

function Days({ days, lang }: { days: TestStats["days"]; lang: Lang }) {
  // every day of the last 30, including the empty ones
  const byDay = new Map(days.map((d) => [d.day, d.n]));
  const list = Array.from({ length: 30 }, (_, k) => {
    const d = new Date(Date.now() + 9 * 3600e3 - (29 - k) * 86400e3); // Korea time
    const key = d.toISOString().slice(0, 10);
    return { key, n: byDay.get(key) ?? 0, label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}` };
  });
  const max = Math.max(1, ...list.map((d) => d.n));
  return (
    <div className={styles.days} role="img" aria-label={list.filter((d) => d.n).map((d) => `${d.label}: ${d.n}`).join(", ") || "0"}>
      {list.map((d, i) => (
        <div key={d.key} className={styles.day}>
          <span className={styles.dayCount}>{d.n || ""}</span>
          <span className={styles.dayBar} style={{ height: `${(d.n / max) * 100}%` }} />
          <span className={styles.dayLabel}>{i % 5 === 4 || i === 0 ? d.label : ""}</span>
        </div>
      ))}
      <span className={styles.srOnly}>{lang === "ko" ? "날짜별 테스트 수" : "Tests per day"}</span>
    </div>
  );
}

/** /stats: totals of the anonymous test results, refreshed every 30 seconds. Not linked from the menu. */
export function TestStatsPage() {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  const [stats, setStats] = useState<TestStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [at, setAt] = useState("");

  useEffect(() => {
    let live = true;
    const load = () =>
      loadStats().then(
        (s) => {
          if (!live) return;
          setStats(s);
          setFailed(false);
          setAt(new Date().toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-GB", { hour: "2-digit", minute: "2-digit" }));
        },
        () => live && setFailed(true),
      );
    load();
    const id = setInterval(load, 30000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [lang]);

  const name = (slug: string) => {
    const d = DISTRICTS.find((x) => x.slug === slug);
    return d ? (lang === "ko" ? d.nameKo : d.nameEn) : slug;
  };
  const total = stats?.total ?? 0;
  const typeMax = Math.max(0, ...(stats?.types ?? []).map((x) => x.n));
  const districtMax = Math.max(0, ...(stats?.districts ?? []).map((x) => x.n));

  return (
    <div className={styles.page}>
      <SiteNav lang={lang} onLang={chooseLang} tone="dark" />
      <main className={styles.main}>
        <header className={styles.head}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.lede} aria-live="polite">
            {failed && !stats ? t.failed : stats ? <Phrases text={t.lede(total, stats.today)} /> : t.loading}
          </p>
          <p className={styles.note}>
            <Phrases text={t.note} />
            {at && <span className={styles.updated}> {t.updated(at)}</span>}
          </p>
        </header>

        {stats && total === 0 && (
          <p className={styles.empty}>
            <Phrases text={t.empty} /> <Link href="/test">{t.take}</Link>
          </p>
        )}

        {stats && total > 0 && (
          <>
            <div className={styles.grid}>
              <section aria-labelledby="types-h">
                <h2 id="types-h" className={styles.h2}>{t.types}</h2>
                <ol className={styles.bars}>
                  {stats.types.map((x) => (
                    <Bar key={x.code} label={TRAVEL_TYPES[x.code]?.name[lang] ?? x.code} sub={x.code} n={x.n} total={total} max={typeMax} />
                  ))}
                </ol>
              </section>
              <section aria-labelledby="districts-h">
                <h2 id="districts-h" className={styles.h2}>{t.districts}</h2>
                <ol className={styles.bars}>
                  {stats.districts.map((x) => (
                    <Bar key={x.slug} label={name(x.slug)} n={x.n} total={total} max={districtMax} />
                  ))}
                </ol>
              </section>
            </div>

            <section aria-labelledby="days-h">
              <h2 id="days-h" className={styles.h2}>{t.days}</h2>
              <Days days={stats.days} lang={lang} />
            </section>

            <section aria-labelledby="q-h">
              <h2 id="q-h" className={styles.h2}>{t.questions}</h2>
              <ol className={styles.questions}>
                {QUESTIONS.map((q, i) => {
                  const c = stats.questions.find((x) => x.i === i + 1) ?? { a: 0, b: 0 };
                  return (
                    <li key={q.id} className={styles.question}>
                      <p className={styles.prompt}>
                        <span className={styles.qNum}>{i + 1}</span>
                        <span>
                          <Phrases text={q.prompt[lang]} />
                        </span>
                      </p>
                      <Split left={q.a[lang]} right={q.b[lang]} a={c.a} b={c.b} />
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="aud-h">
              <h2 id="aud-h" className={styles.h2}>{t.audience}</h2>
              <div className={styles.audience}>
                <Split left={t.ko} right={t.en} a={stats.langs.ko ?? 0} b={stats.langs.en ?? 0} />
                <ul className={styles.devices}>
                  {(["phone", "tablet", "desktop"] as const).map((k) => (
                    <li key={k}>
                      <strong>{pct(stats.devices[k] ?? 0, total)}%</strong> {t[k]} <span className={styles.barPct}>{stats.devices[k] ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
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
