"use client";

import Link from "next/link";
import { COPY } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { asset } from "@/lib/base-path.ts";
import { TEAM } from "@/lib/team/team.ts";
import { SiteNav } from "./SiteNav";
import { Phrases } from "./Phrases";
import styles from "./AboutTeam.module.css";

const T = {
  en: {
    lede: "Six of us at Kyonggi University made this together. We hope it helps you find a Seoul of your own.",
    team: "The team",
    cta: "Take the test",
  },
  ko: {
    lede: "경기대학교 여섯 명이 함께 만들었습니다. 당신에게 꼭 맞는 서울을 찾아 주고 싶었습니다.",
    team: "팀원",
    cta: "테스트 시작하기",
  },
} as const;

export function AboutTeam() {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  const ko = lang === "ko";
  return (
    <div className={styles.page}>
      <SiteNav lang={lang} onLang={chooseLang} tone="dark" />
      <main className={styles.main}>
        <header className={styles.head}>
          <h1 className={styles.title}>{COPY[lang].nav.about}</h1>
          <p className={styles.hint}><Phrases text={COPY[lang].nav.hints.about} /></p>
          <p className={styles.lede}><Phrases text={t.lede} /></p>
        </header>

        <section aria-labelledby="team-heading">
          <h2 id="team-heading" className={styles.sectionLabel}>{t.team}</h2>
          <ul className={styles.grid}>
            {TEAM.map((m) => (
              <li key={m.slug} className={styles.member}>
                <div className={styles.frame}>
                  {m.photo ? (
                    <img className={styles.photo} src={asset(m.photo)} alt="" width={800} height={1000} loading="lazy" decoding="async" />
                  ) : (
                    <span className={styles.given} lang="ko" aria-hidden="true">{m.given}</span>
                  )}
                </div>
                <p className={styles.name}>
                  {m.name[lang]}
                  {!ko && <span className={styles.nameKo} lang="ko">{m.name.ko}</span>}
                </p>
                <p className={styles.meta}>
                  {m.school[lang]}
                  {m.role && <> · {m.role[lang]}</>}
                </p>
                {m.bio && <p className={styles.bio}><Phrases text={m.bio[lang]} /></p>}
              </li>
            ))}
          </ul>
        </section>

        <div className={styles.actions}>
          <Link className="btn btn-primary" href="/test">{t.cta}</Link>
        </div>
      </main>
      <footer className="site-footer">
        <p><Phrases text={COPY[lang].proposal} /></p>
      </footer>
    </div>
  );
}
