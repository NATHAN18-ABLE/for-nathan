"use client";

import { useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { TRAVEL_TYPES } from "@/lib/match/travel-types.ts";
import { matchDistricts, scoreAnswers, typeCode, type Answer } from "@/lib/match/match.ts";
import { QuestionCard } from "@/components/QuestionCard";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { useLang } from "@/lib/lang.ts";
import { asset } from "@/lib/base-path.ts";
import { Phrases } from "@/components/Phrases";
import { nearestRoom } from "@/lib/metaverse/queue.ts";
import { entryRoom, roomHref } from "@/lib/metaverse/open.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import styles from "./test.module.css";

const KEY = "seoul.answers";

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
            index={step + 1}
            total={QUESTIONS.length}
            label={`${step + 1} of ${QUESTIONS.length}`}
            onAnswer={(a) => save([...answers, a])}
            onBack={step > 0 ? () => save(answers.slice(0, -1)) : undefined}
            backLabel="Previous question"
          />
        </section>
      ) : (
        <Result answers={answers} onRestart={() => save([])} />
      )}
    </main>
  );
}

function Result({ answers, onRestart }: { answers: Answer[]; onRestart: () => void }) {
  const code = typeCode(answers);
  const type = TRAVEL_TYPES[code];
  const { best, runnerUp } = matchDistricts(scoreAnswers(answers));
  const room = nearestRoom(best.slug);
  const open = entryRoom(room);
  const nameOf = (slug: string) => DISTRICTS.find((d) => d.slug === slug)?.nameEn ?? slug;
  return (
    <section className={styles.result} aria-live="polite">
      <p className={styles.code}>{code}</p>
      <h1 className={styles.typeName}>{type.name}</h1>
      <p className={styles.typeLine}><Phrases text={type.line} /></p>
      <div className={styles.district}>
        <h2>
          Your Seoul is {best.nameEn} <span lang="ko">{best.nameKo}</span>
        </h2>
        <p>
          <Phrases text={`${best.line}.`} />
        </p>
        <p className={styles.runner}>
          Also close to you: {runnerUp.nameEn} <span lang="ko">{runnerUp.nameKo}</span>
        </p>
      </div>
      <p className={styles.note}>
        <Phrases text={`A day course for ${best.nameEn} is in preparation.`} />
        {open !== room && (
          <>
            {" "}
            <Phrases text={`The ${nameOf(room)} room opens soon. Until then, travelers meet in ${nameOf(open)}.`} />
          </>
        )}
      </p>
      <div className={styles.actions}>
        <Link className="btn btn-light" href={roomHref(room)}>
          Meet travelers in {nameOf(open)}
        </Link>
        <button type="button" className={styles.again} onClick={onRestart}>
          Take the test again
        </button>
      </div>
    </section>
  );
}
