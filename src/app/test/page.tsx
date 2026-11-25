"use client";

import { useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { TRAVEL_TYPES } from "@/lib/match/travel-types.ts";
import { matchDistricts, scoreAnswers, typeCode, type Answer } from "@/lib/match/match.ts";
import { QuestionCard } from "@/components/QuestionCard";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { useLang } from "@/lib/lang.ts";
import type { Lang } from "@/lib/hero/copy.ts";
import { asset } from "@/lib/base-path.ts";
import { Phrases } from "@/components/Phrases";
import { OPEN_ROOMS, wardrobeHref } from "@/lib/metaverse/open.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { courseFor } from "@/lib/districts/courses.ts";
import { deviceKind, saveResult } from "@/lib/test-stats.ts";
import styles from "./test.module.css";

const KEY = "seoul.answers";

const T = {
  en: {
    of: (n: number, total: number) => `${n} of ${total}`,
    back: "Previous question",
    yourSeoul: "Your Seoul is",
    also: "Also close to you:",
    course: (d: string) => `A day course for ${d} is in preparation.`,
    seeDay: (d: string) => `See a day in ${d}`,
    meet: (open: string) => `Walk ${open} with friends first`,
    other: "Walk another district in the metaverse",
    again: "Take the test again",
  },
  ko: {
    of: (n: number, total: number) => `${n} / ${total}`,
    back: "이전 질문",
    yourSeoul: "당신의 서울은",
    also: "이곳도 잘 맞아요:",
    course: (d: string) => `${d} 하루 코스는 준비 중입니다.`,
    seeDay: (d: string) => `${d}의 하루 코스 보기`,
    meet: (open: string) => `친구들과 ${open} 먼저 걸어 보기`,
    other: "다른 지역 메타버스로 걸어보기",
    again: "테스트 다시 하기",
  },
} as const;

export default function TestPage() {
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [lang, chooseLang] = useLang();

  useEffect(() => {
    let saved: Answer[] = [];
    try {
      const raw = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(raw)) saved = raw.filter((a): a is Answer => a === "a" || a === "b").slice(0, QUESTIONS.length);
    } catch {}
    setAnswers(saved);
  }, []);

  const save = (next: Answer[]) => {
    setAnswers(next);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const backdrop = {
    "--night-d": `url(${asset("/hero/night-d.jpg")})`,
    "--night-m": `url(${asset("/hero/night-m.jpg")})`,
  } as React.CSSProperties;

  if (!answers) return <main className={styles.page} style={backdrop} aria-busy="true" />;

  const step = answers.length;
  const done = step >= QUESTIONS.length;

  return (
    <main className={styles.page} style={backdrop}>
      <SiteNav lang={lang} onLang={chooseLang} />
      {!done ? (
        <section className={styles.center} aria-live="polite">
          <QuestionCard
            key={step}
            question={QUESTIONS[step]}
            lang={lang}
            index={step + 1}
            total={QUESTIONS.length}
            label={T[lang].of(step + 1, QUESTIONS.length)}
            onAnswer={(a) => save([...answers, a])}
            onBack={step > 0 ? () => save(answers.slice(0, -1)) : undefined}
            backLabel={T[lang].back}
          />
        </section>
      ) : (
        <Result lang={lang} answers={answers} onRestart={() => save([])} />
      )}
    </main>
  );
}

function Result({ lang, answers, onRestart }: { lang: Lang; answers: Answer[]; onRestart: () => void }) {
  const t = T[lang];
  const code = typeCode(answers);
  const type = TRAVEL_TYPES[code];
  const { best, runnerUp } = matchDistricts(scoreAnswers(answers));
  // Count this result once in the anonymous statistics.
  useEffect(() => {
    saveResult({ type_code: code, best: best.slug, runner_up: runnerUp.slug, answers: answers.join(""), lang, device: deviceKind() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.join("")]);
  // Only a district with its own room links straight into it; otherwise the visitor picks one.
  const own = OPEN_ROOMS.includes(best.slug);
  const ko = lang === "ko";
  const name = (d: { nameEn: string; nameKo: string }) => (ko ? d.nameKo : d.nameEn);
  // Rooms are named after the area without the "-gu" ending (종로, 서대문).
  const roomName = (slug: string) => {
    const d = DISTRICTS.find((x) => x.slug === slug);
    if (!d) return slug;
    return ko ? d.nameKo.replace(/구$/, "") || d.nameKo : d.nameEn;
  };
  return (
    <section className={styles.result} aria-live="polite">
      <p className={styles.code}>{code}</p>
      <h1 className={styles.typeName}>{type.name[lang]}</h1>
      <p className={styles.typeLine}><Phrases text={type.line[lang]} /></p>
      <div className={styles.district}>
        <h2>
          {t.yourSeoul} {name(best)}{" "}
          <span lang={ko ? "en" : "ko"}>{ko ? best.nameEn : best.nameKo}</span>
        </h2>
        <p>
          <Phrases text={`${best.line[lang]}.`} />
        </p>
        <p className={styles.runner}>
          {t.also} {name(runnerUp)} <span lang={ko ? "en" : "ko"}>{ko ? runnerUp.nameEn : runnerUp.nameKo}</span>
        </p>
      </div>
      {courseFor(best.slug) && (
        <p className={styles.courseLink}>
          <Link href={`/districts/${best.slug}`}>{t.seeDay(name(best))}</Link>
        </p>
      )}
      <p className={styles.note}>
        {!courseFor(best.slug) && <Phrases text={t.course(name(best))} />}

      </p>
      <div className={styles.actions}>
        <Link className="btn btn-light" href={own ? wardrobeHref(best.slug) : "/metaverse"}>
          {own ? t.meet(roomName(best.slug)) : t.other}
        </Link>
        <button type="button" className={styles.again} onClick={onRestart}>
          {t.again}
        </button>
      </div>
    </section>
  );
}
