"use client";

import { useEffect, useRef } from "react";

import type { Answer, Question } from "@/lib/match/match.ts";
import type { Lang } from "@/lib/hero/copy.ts";
import { Phrases } from "./Phrases";
import styles from "./QuestionCard.module.css";

interface Props {
  question: Question;
  lang: Lang;
  index: number; // 1-based
  total: number;
  label: string; // "1 of 12"
  onAnswer: (answer: Answer) => void;
  onBack?: () => void;
  backLabel?: string;
  selected?: Answer;
  headingLevel?: "h2" | "h3";
}

export function QuestionCard({ question, lang, index, total, label, onAnswer, onBack, backLabel, selected, headingLevel = "h2" }: Props) {
  const Heading = headingLevel;
  const heading = useRef<HTMLHeadingElement>(null);
  // After an answer the next card replaces this one; keep keyboard focus on the new question
  // instead of dropping it to the page. The first question takes focus only from a keyboard user.
  useEffect(() => {
    if (index > 1) heading.current?.focus({ preventScroll: true });
  }, [index]);
  return (
    <div className={styles.card}>
      <div className={styles.progress} aria-label={label}>
        <ol className={styles.dots} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <li key={i} className={i < index ? styles.dotOn : styles.dot} />
          ))}
        </ol>
        <span className={styles.count}>{label}</span>
      </div>
      <Heading ref={heading} tabIndex={-1} className={styles.question}><Phrases text={question.prompt[lang]} /></Heading>
      <div className={styles.options}>
        {(["a", "b"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={styles.option}
            aria-pressed={selected === key}
            onClick={() => onAnswer(key)}
          >
            {question[key][lang]}
          </button>
        ))}
      </div>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack}>
          {backLabel ?? "Back"}
        </button>
      )}
    </div>
  );
}
