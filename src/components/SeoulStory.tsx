"use client";

import Link from "next/link";
import { ArrowRight, Columns, CastleTurret, Train, Flag, Buildings, Plant, MapPin } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { asset } from "@/lib/base-path.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { ERAS, STORY, type Era } from "@/lib/story/eras.ts";
import { SiteNav } from "./SiteNav";
import { Phrases } from "./Phrases";
import { BuildTag } from "./BuildTag";
import styles from "./SeoulStory.module.css";

const T = {
  en: {
    scenes: "Seven scenes",
    calledThen: "The city was called",
    visit: "Where to see it",
    course: "day course",
    test: "Find your district",
    districts: "See the twelve districts",
  },
  ko: {
    scenes: "일곱 장면",
    calledThen: "그때의 이름",
    visit: "지금 가 볼 곳",
    course: "하루 코스",
    test: "테스트로 나의 지역 찾기",
    districts: "12개의 지역 보기",
  },
} as const;

// Districts outside the twelve courses, named only.
const EXTRA_DISTRICTS: Record<string, { en: string; ko: string }> = { gangdong: { en: "Gangdong", ko: "강동구" } };
const districtName = (slug: string, lang: Lang) => {
  const d = DISTRICTS.find((x) => x.slug === slug);
  return d ? (lang === "ko" ? d.nameKo : d.nameEn) : EXTRA_DISTRICTS[slug]?.[lang] ?? slug;
};

// Two thousand years read as one day: the earliest scenes in morning porcelain, the present at night.
type Tone = "morning" | "day" | "dusk" | "night";
const TONES: Record<string, Tone> = {
  prehistory: "morning",
  baekje: "morning",
  joseon: "day",
  modern: "dusk",
  liberation: "dusk",
  miracle: "night",
  today: "night",
};
// Shown when a scene has no photo: a tile with a mark for the period.
const GLYPHS: Record<string, PhosphorIcon> = {
  prehistory: Plant,
  baekje: Columns,
  joseon: CastleTurret,
  modern: Train,
  liberation: Flag,
  miracle: Buildings,
  today: Buildings,
};

function Scene({ era, prev, lang }: { era: Era; prev: Tone; lang: Lang }) {
  const t = T[lang];
  const Glyph = GLYPHS[era.id];
  return (
    <section className={styles.band} data-tone={TONES[era.id]} data-from={prev} id={era.id} aria-labelledby={`${era.id}-title`}>
      <div className={styles.inner}>
        <div className={styles.when}>
          <p className={styles.mark}>{era.mark[lang]}</p>
          <p className={styles.span}>{era.span[lang]}</p>
        </div>
        <div className={styles.body}>
          {era.cityName && (
            <p className={styles.cityName}>
              <span>{t.calledThen}</span> {era.cityName[lang]}
            </p>
          )}
          <h2 id={`${era.id}-title`} className={styles.title}>{era.title[lang]}</h2>
          <p className={styles.summary}><Phrases text={era.summary[lang]} /></p>
          <h3 className={styles.visitLabel}>{t.visit}</h3>
          <ul className={styles.places}>
            {era.places.map((p) => (
              <li key={p.name.en}>
                {p.inCourse ? (
                  <Link href={`/districts/${p.district}`} className={styles.placeLink}>
                    <span className={styles.placeName}>{p.name[lang]}</span>
                    <span className={styles.placeMeta}>
                      {districtName(p.district, lang)} {t.course}
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </span>
                  </Link>
                ) : (
                  <span className={styles.placePlain}>
                    <span className={styles.placeName}>{p.name[lang]}</span>
                    <span className={styles.placeMeta}>
                      <MapPin size={14} aria-hidden="true" />
                      {districtName(p.district, lang)}
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.media}>
          {era.photo ? (
            <figure className={styles.figure}>
              <img
                src={asset(era.photo.src)}
                alt={era.photo.alt[lang]}
                width={era.photo.width}
                height={era.photo.height}
                loading="lazy"
                decoding="async"
              />
              {era.photo.credit && (
                <figcaption className={styles.credit}>
                  <a href={era.photo.credit.url} target="_blank" rel="noopener noreferrer">{era.photo.credit.by}</a>
                  {" · "}
                  {era.photo.credit.license}
                </figcaption>
              )}
            </figure>
          ) : (
            <div className={styles.tile} aria-hidden="true">
              <Glyph size={48} weight="light" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function SeoulStory() {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  return (
    <div className={styles.page}>
      <SiteNav lang={lang} onLang={chooseLang} tone="dark" />
      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.head}>
            <h1 className={styles.pageTitle}>{COPY[lang].nav.story}</h1>
            <p className={styles.lead}><Phrases text={STORY.title[lang]} /></p>
            <p className={styles.intro}><Phrases text={STORY.intro[lang]} /></p>
          </header>

          {/* The seven scenes on one line, earliest to today; each station jumps to its scene. */}
          <nav className={styles.ribbon} aria-label={t.scenes}>
            <ol style={{ gridTemplateColumns: `repeat(${ERAS.length}, minmax(var(--station), 1fr))` }}>
              {ERAS.map((e) => (
                <li key={e.id} data-tone={TONES[e.id]}>
                  <a href={`#${e.id}`}>
                    <span className={styles.ribbonMark}>{e.mark[lang]}</span>
                    <span className={styles.ribbonDot} aria-hidden="true" />
                    <span className={styles.ribbonTitle}>{e.title[lang]}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className={styles.scenes}>
          {ERAS.map((e, i) => (
            <Scene key={e.id} era={e} prev={i === 0 ? "morning" : TONES[ERAS[i - 1].id]} lang={lang} />
          ))}
        </div>

        <section className={styles.closing} aria-label={lang === "ko" ? "맺음말" : "Closing"}>
          <div className={styles.container}>
            <p className={styles.closingText}><Phrases text={STORY.closing[lang]} /></p>
            <div className={styles.actions}>
              <Link className="btn btn-light" href="/test">{t.test}</Link>
              <Link className={styles.secondary} href="/districts">{t.districts}</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className={`site-footer ${styles.footer}`}>
        <p><Phrases text={COPY[lang].proposal} /></p>
        <BuildTag lang={lang} />
      </footer>
    </div>
  );
}
