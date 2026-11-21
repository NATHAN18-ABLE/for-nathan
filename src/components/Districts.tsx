"use client";

import Link from "next/link";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { asset } from "@/lib/base-path.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { COURSES, CHECKED, courseFor, type Course, type Stop, type Icon, type Mode } from "@/lib/districts/courses.ts";
import {
  Bank, BeerStein, Binoculars, Bus, CaretDown, CastleTurret, Church, Clock, Coffee, CurrencyKrw, Flask, GameController, MusicNotes, PaintBrush, HandPalm, ForkKnife, HandsPraying, Info,
  Mountains, Path, PersonSimpleWalk, ShoppingBag, Sneaker, Storefront, Subway, Tent, Tree, Waves,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { SiteNav } from "./SiteNav";
import { Phrases } from "./Phrases";
import { BuildTag } from "./BuildTag";
import { useReveal } from "@/lib/ui/reveal.ts";
import styles from "./Districts.module.css";

const T = {
  en: {
    lede: "Find your district with the test, then follow its day from morning to night.",
    ready: "Courses you can follow now",
    soon: "Coming next",
    open: "See the day",
    preparing: "In preparation",
    back: "All twelve districts",
    length: "Length",
    start: "Start",
    checked: "Checked",
    nearby: "Just over the line",
    extra: "If you have more time",
    others: "Other days",
    note: "Prices are rough ranges per person. Opening hours, prices and pop-ups change, so check before you go. Place photos were gathered by the team during research.",
    more: "Details",
    day: "The day at a glance",
    stay: "Time here",
    cost: "Cost",
    test: "Take the test",
  },
  ko: {
    lede: "테스트로 나와 맞는 지역을 찾고, 그 지역의 하루를 아침부터 밤까지 따라가 보세요.",
    ready: "지금 따라갈 수 있는 코스",
    soon: "준비 중인 지역",
    open: "하루 코스 보기",
    preparing: "준비 중",
    back: "12개의 지역 전체",
    length: "걸리는 시간",
    start: "출발",
    checked: "정보 확인",
    nearby: "경계 너머 가까운 곳",
    extra: "시간이 더 있다면",
    others: "다른 지역의 하루",
    note: "가격은 1인 기준 대략적인 범위입니다. 영업시간과 가격, 팝업스토어는 바뀔 수 있으니 방문 전에 확인하세요. 장소 사진은 팀이 조사하며 모은 자료입니다.",
    more: "자세히 보기",
    day: "하루 한눈에 보기",
    stay: "머무는 시간",
    cost: "비용",
    test: "테스트 하러 가기",
  },
} as const;

const districtOf = (slug: string) => DISTRICTS.find((d) => d.slug === slug)!;
const nameOf = (slug: string, lang: Lang) => (lang === "ko" ? districtOf(slug).nameKo : districtOf(slug).nameEn);
const otherName = (slug: string, lang: Lang) => (lang === "ko" ? districtOf(slug).nameEn : districtOf(slug).nameKo);

function Shell({ lang, chooseLang, children }: { lang: Lang; chooseLang: (l: Lang) => void; children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <SiteNav lang={lang} onLang={chooseLang} tone="dark" />
      {children}
      <footer className="site-footer">
        <p><Phrases text={COPY[lang].proposal} /></p>
        <BuildTag lang={lang} />
      </footer>
    </div>
  );
}

/** /districts: the ready courses in district order, then any still in preparation. */
export function DistrictsIndex() {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  const ready = COURSES.map((c) => c.slug);
  const later = DISTRICTS.filter((d) => !ready.includes(d.slug));
  return (
    <Shell lang={lang} chooseLang={chooseLang}>
      <main className={styles.main}>
        <header className={styles.indexHead}>
          <h1 className={styles.indexTitle}>{COPY[lang].nav.districts}</h1>
          <p className={styles.lede}><Phrases text={t.lede} /></p>
        </header>

        <section aria-labelledby="ready-heading">
          <h2 id="ready-heading" className={styles.groupLabel}>{t.ready}</h2>
          <ul className={styles.readyList}>
            {[...COURSES].sort((x, y) => DISTRICTS.findIndex((d) => d.slug === x.slug) - DISTRICTS.findIndex((d) => d.slug === y.slug)).map((c) => {
              const cover = c.stops.find((s) => s.photo)?.photo;
              return (
                <li key={c.slug}>
                  <Link className={styles.readyRow} href={`/districts/${c.slug}`}>
                    {!cover && (() => {
                      const Glyph = ICONS[c.stops[0].icon];
                      return (
                        <span className={styles.readyTile} aria-hidden="true">
                          <Glyph size={36} weight="light" />
                        </span>
                      );
                    })()}
                    {cover && (
                      <img
                        className={styles.readyPhoto}
                        src={asset(cover.src)}
                        alt=""
                        width={cover.width}
                        height={cover.height}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className={styles.readyText}>
                      <span className={styles.readyName}>
                        {nameOf(c.slug, lang)}
                        <span className={styles.readyArea}>{c.area[lang]}</span>
                      </span>
                      <span className={styles.readyTitle}><Phrases text={c.title[lang]} /></span>
                      <span className={styles.readyMeta}>
                        {c.length[lang]} · {c.stops.length} {lang === "ko" ? "곳" : "stops"}
                      </span>
                    </span>
                    <span className={styles.readyGo}>{t.open}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {later.length > 0 && (
        <section aria-labelledby="soon-heading">
          <h2 id="soon-heading" className={styles.groupLabel}>{t.soon}</h2>
          <ul className={styles.soonList}>
            {later.map((d) => (
              <li key={d.slug} className={styles.soonRow}>
                <span className={styles.soonName}>
                  {lang === "ko" ? d.nameKo : d.nameEn}
                  <span className={styles.soonOther} lang={lang === "ko" ? "en" : "ko"}>{lang === "ko" ? d.nameEn : d.nameKo}</span>
                </span>
                <span className={styles.soonLine}><Phrases text={d.line[lang]} /></span>
              </li>
            ))}
          </ul>
        </section>
        )}
      </main>
    </Shell>
  );
}

const ICONS: Record<Icon, PhosphorIcon> = {
  park: Tree, shops: ShoppingBag, shoe: Sneaker, cafe: Coffee, food: ForkKnife, river: Waves,
  history: CastleTurret, view: Binoculars, hike: Mountains, temple: HandsPraying, trail: Path,
  tent: Tent, museum: Bank, market: Storefront, church: Church, beer: BeerStein, art: PaintBrush, perfume: Flask,
  game: GameController, music: MusicNotes, pottery: HandPalm,
};
const MODES: Record<Mode, PhosphorIcon> = { walk: PersonSimpleWalk, metro: Subway, bus: Bus };

// The page moves through the day: porcelain morning, warm afternoon, rose dusk, navy night.
type Tone = "morning" | "day" | "dusk" | "night";
const toneAt = (time: string): Tone => {
  const h = Number(time.slice(0, 2)) + Number(time.slice(3)) / 60;
  return h < 12 ? "morning" : h < 17 ? "day" : h < 19 ? "dusk" : "night";
};
const anchor = (time: string) => `stop-${time.replace(":", "")}`;

/** The day as a subway-style line: one station per stop, filled with that hour's colour. */
function RouteMap({ stops, lang, label }: { stops: Stop[]; lang: Lang; label: string }) {
  return (
    <nav className={styles.route} aria-label={label}>
      <ol style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(var(--station), 1fr))` }}>
        {stops.map((s) => (
          <li key={s.time} data-tone={toneAt(s.time)}>
            <a href={`#${anchor(s.time)}`}>
              <time className={styles.routeTime}>{s.time}</time>
              <span className={styles.routeDot} aria-hidden="true" />
              <span className={styles.routeName}>{s.short[lang]}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StopBand({ stop, prev, lang, t }: { stop: Stop; prev: Tone; lang: Lang; t: (typeof T)[Lang] }) {
  const tone = toneAt(stop.time);
  const Glyph = ICONS[stop.icon];
  const Way = stop.mode ? MODES[stop.mode] : null;
  return (
    <li className={styles.band} data-tone={tone} data-from={prev} id={anchor(stop.time)}>
      <div className={styles.bandInner}>
        {stop.way && (
          <p className={styles.way}>
            {Way && <Way size={18} weight="regular" aria-hidden="true" />}
            <span>{stop.way[lang]}</span>
          </p>
        )}
        <article className={styles.stop} data-reveal>
          <time className={styles.time}>{stop.time}</time>
          <div className={styles.stopMain}>
            <h3 className={styles.stopName}>{stop.name[lang]}</h3>
            <p className={styles.summary}><Phrases text={stop.summary[lang]} /></p>
            <ul className={styles.chips}>
              <li>
                <Clock size={16} aria-hidden="true" />
                <span className="visually-hidden">{t.stay}: </span>
                {stop.stay[lang]}
              </li>
              {stop.cost && (
                <li>
                  <CurrencyKrw size={16} aria-hidden="true" />
                  <span className="visually-hidden">{t.cost}: </span>
                  {stop.cost[lang]}
                </li>
              )}
              {stop.note && (
                <li data-note>
                  <Info size={16} aria-hidden="true" />
                  {stop.note[lang]}
                </li>
              )}
            </ul>
            <details className={styles.details}>
              <summary>
                {t.more}
                <CaretDown size={14} weight="bold" aria-hidden="true" />
              </summary>
              <p><Phrases text={stop.body[lang]} /></p>
              {stop.tip && <p className={styles.tip}><Phrases text={stop.tip[lang]} /></p>}
            </details>
          </div>
          <div className={styles.media}>
            {stop.photo ? (
              <figure className={styles.figure}>
                <img
                  src={asset(stop.photo.src)}
                  alt={stop.photo.alt[lang]}
                  width={stop.photo.width}
                  height={stop.photo.height}
                  loading="lazy"
                  decoding="async"
                />
                {stop.photo.credit && (
                  <figcaption className={styles.credit}>
                    <a href={stop.photo.credit.url} target="_blank" rel="noopener noreferrer">
                      {stop.photo.credit.by}
                    </a>
                    {" · "}
                    {stop.photo.credit.license}
                  </figcaption>
                )}
              </figure>
            ) : (
              <div className={styles.tile} aria-hidden="true">
                <Glyph size={44} weight="light" />
                <span>{stop.kind[lang]}</span>
              </div>
            )}
          </div>
        </article>
      </div>
    </li>
  );
}

/** /districts/[slug]: one district's day, from a route map down through each stop, morning to night. */
export function CourseView({ slug }: { slug: string }) {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  const course = courseFor(slug) as Course;
  const others = COURSES.filter((c) => c.slug !== slug);
  const tones = course.stops.map((s) => toneAt(s.time));
  useReveal([slug]);
  return (
    <Shell lang={lang} chooseLang={chooseLang}>
      <main className={styles.courseMain}>
        <div className={styles.container}>
          <Link className={styles.back} href="/districts">{t.back}</Link>
          <header className={styles.courseHead}>
            <h1 className={styles.courseTitle}>
              {nameOf(slug, lang)}{" "}
              <span className={styles.courseOther} lang={lang === "ko" ? "en" : "ko"}>{otherName(slug, lang)}</span>
            </h1>
            <p className={styles.courseLine}><Phrases text={course.title[lang]} /></p>
            <p className={styles.intro}><Phrases text={course.intro[lang]} /></p>
            <dl className={styles.facts}>
              <div>
                <dt>{t.length}</dt>
                <dd>{course.length[lang]}</dd>
              </div>
              <div>
                <dt>{t.start}</dt>
                <dd>{course.start[lang]}</dd>
              </div>
              <div>
                <dt>{t.checked}</dt>
                <dd>{CHECKED[lang]}</dd>
              </div>
            </dl>
          </header>
          <RouteMap stops={course.stops} lang={lang} label={t.day} />
        </div>

        <h2 className="visually-hidden">{lang === "ko" ? "하루 일정" : "The day"}</h2>
        <ol className={styles.day}>
          {course.stops.map((s, i) => (
            <StopBand key={s.time} stop={s} prev={i === 0 ? "morning" : tones[i - 1]} lang={lang} t={t} />
          ))}
        </ol>
        <div className={styles.dayEnd} data-from={tones[tones.length - 1]} aria-hidden="true" />

        <div className={styles.container}>
          {course.more && (
            <aside className={styles.nearby}>
              <h2 className={styles.nearbyLabel}>{t.extra}</h2>
              <p><Phrases text={course.more[lang]} /></p>
            </aside>
          )}
          {course.nearby && (
            <aside className={styles.nearby}>
              <h2 className={styles.nearbyLabel}>{t.nearby}</h2>
              <p><Phrases text={course.nearby[lang]} /></p>
            </aside>
          )}

          <p className={styles.note}><Phrases text={t.note} /></p>

          <nav className={styles.others} aria-label={t.others}>
            <h2 className={styles.groupLabel}>{t.others}</h2>
            <ul>
              {others.map((c) => (
                <li key={c.slug}>
                  <Link href={`/districts/${c.slug}`}>
                    <span className={styles.otherName}>{nameOf(c.slug, lang)}</span>
                    <span className={styles.otherTitle}>{c.title[lang]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <Link className="btn btn-primary" href="/test">{t.test}</Link>
          </div>
        </div>
      </main>
    </Shell>
  );
}
