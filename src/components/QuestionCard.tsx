"use client";

import type { Answer, Question } from "@/lib/match/match.ts";
import styles from "./QuestionCard.module.css";

interface Props {
  question: Question;
  index: number; // 1-based
  total: number;
  label: string; // "1 of 12"
  onAnswer: (answer: Answer) => void;
  onBack?: () => void;
  backLabel?: string;
  selected?: Answer;
  headingLevel?: "h2" | "h3";
}

export function QuestionCard({ question, index, total, label, onAnswer, onBack, backLabel, selected, headingLevel = "h2" }: Props) {
  const Heading = headingLevel;
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
      <Heading className={styles.question}>{question.prompt}</Heading>
      <div className={styles.options}>
        {(["a", "b"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={styles.option}
            aria-pressed={selected === key}
            onClick={() => onAnswer(key)}
          >
            {question[key]}
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
