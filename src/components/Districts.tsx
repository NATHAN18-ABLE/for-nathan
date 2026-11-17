"use client";

import Link from "next/link";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { asset } from "@/lib/base-path.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import { COURSES, CHECKED, courseFor, type Course, type Stop } from "@/lib/districts/courses.ts";
import { SiteNav } from "./SiteNav";
import { Phrases } from "./Phrases";
import { BuildTag } from "./BuildTag";
import styles from "./Districts.module.css";

const T = {
  en: {
    lede: "Find your district with the test, then follow its day from morning to night. The first four courses are ready; the rest are on the way.",
    ready: "Courses you can follow now",
    soon: "Coming next",
    open: "See the day",
    preparing: "In preparation",
    back: "All twelve districts",
    length: "Length",
    start: "Start",
    checked: "Checked",
    nearby: "Just over the line",
    others: "Other days",
    note: "Opening hours, prices and pop-ups change. Check before you go. Place photos were gathered by the team during research.",
    test: "Take the test",
  },
  ko: {
    lede: "테스트로 나와 맞는 지역을 찾고, 그 지역의 하루를 아침부터 밤까지 따라가 보세요. 네 곳의 코스를 먼저 공개하고, 나머지도 준비하고 있습니다.",
    ready: "지금 따라갈 수 있는 코스",
    soon: "준비 중인 지역",
    open: "하루 코스 보기",
    preparing: "준비 중",
    back: "12개의 지역 전체",
    length: "걸리는 시간",
    start: "출발",
    checked: "정보 확인",
    nearby: "경계 너머 가까운 곳",
    others: "다른 지역의 하루",
    note: "영업시간과 가격, 팝업스토어는 바뀔 수 있으니 방문 전에 확인하세요. 장소 사진은 팀이 조사하며 모은 자료입니다.",
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

/** /districts: the four ready courses first, then the districts still in preparation. */
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
            {COURSES.map((c) => {
              const cover = c.stops.find((s) => s.photo)?.photo;
              return (
                <li key={c.slug}>
                  <Link className={styles.readyRow} href={`/districts/${c.slug}`}>
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
      </main>
    </Shell>
  );
}

function StopItem({ stop, lang }: { stop: Stop; lang: Lang }) {
  return (
    <li className={styles.stop}>
      {stop.way && <p className={styles.way}>{stop.way[lang]}</p>}
      <div className={styles.stopRow}>
        <time className={styles.time}>{stop.time}</time>
        <div className={styles.stopBody}>
          <h3 className={styles.stopName}>{stop.name[lang]}</h3>
          <p className={styles.kind}>{stop.kind[lang]}</p>
          <p className={styles.text}><Phrases text={stop.body[lang]} /></p>
          {stop.tip && <p className={styles.tip}><Phrases text={stop.tip[lang]} /></p>}
        </div>
        {stop.photo && (
          <figure className={styles.figure} style={{ maxWidth: stop.photo.width }}>
            <img
              src={asset(stop.photo.src)}
              alt={stop.photo.alt[lang]}
              width={stop.photo.width}
              height={stop.photo.height}
              loading="lazy"
              decoding="async"
            />
          </figure>
        )}
      </div>
    </li>
  );
}

/** /districts/[slug]: one district's day, read top to bottom like a timetable. */
export function CourseView({ slug }: { slug: string }) {
  const [lang, chooseLang] = useLang();
  const t = T[lang];
  const course = courseFor(slug) as Course;
  const others = COURSES.filter((c) => c.slug !== slug);
  return (
    <Shell lang={lang} chooseLang={chooseLang}>
      <main className={styles.main}>
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

        <h2 className="visually-hidden">{lang === "ko" ? "하루 일정" : "The day"}</h2>
        <ol className={styles.timeline}>
          {course.stops.map((s) => (
            <StopItem key={s.time} stop={s} lang={lang} />
          ))}
        </ol>

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
      </main>
    </Shell>
  );
}
