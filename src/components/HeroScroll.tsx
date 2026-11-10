"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QUESTIONS } from "@/lib/match/questions.ts";
import { DISTRICTS } from "@/lib/match/districts.ts";
import type { Answer } from "@/lib/match/match.ts";
import { frameAt, scrollWindows, type Timing } from "@/lib/hero/timeline.ts";
import { COPY, DISTRICT_ORDER, type Lang } from "@/lib/hero/copy.ts";
import { asset } from "@/lib/base-path.ts";
import Link from "next/link";
import { QuestionCard } from "./QuestionCard";
import styles from "./HeroScroll.module.css";

interface Ridge {
  ridge: [number, number][];
  tower: { x: number; tip: number; antennaBase: number; deckTop: number; deckBottom: number; deckHalfWidth: number; shaftHalfWidth: number; base: number };
  antennas: { x: number; top: number; base: number }[];
}

// Scroll map (share of the pinned track).
const UI_OUT = 0.06;
const FRAMES_FROM = 0.07;
const FRAMES_TO = 0.74;
// After the last frame: the photo overexposes toward porcelain while the cobalt line
// traces its own ridge and tower on top, so the drawing reads as the same view.
const GLOW_FROM = 0.74;
const GLOW_LEN = 0.14;
const LINE_FROM = 0.765;
const LINE_LEN = 0.11;
const PORCELAIN_FROM = 0.8;
const PORCELAIN_LEN = 0.1;
const AFTER_FROM = 0.905;
const AFTER_LEN = 0.07;
const END_ZOOM = 0.12;

// Portrait frames are a 9:16 slice of the 16:9 frames, centred on the tower.
const MOBILE_SLICE = { x0: 0.573 - (9 / 16) / (16 / 9) / 2, w: (9 / 16) / (16 / 9) };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const phase = (p: number, from: number, len: number) => clamp01((p - from) / len);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);
const frameUrl = (set: string, i: number) => asset(`/hero/${set}/${String(i + 1).padStart(4, "0")}.webp`);

function loadOrder(n: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < n; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
  }
  if (!seen.has(n - 1)) order.push(n - 1);
  return order;
}

export function HeroScroll() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [reduced, setReduced] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [ridge, setRidge] = useState<Ridge | null>(null);
  const ridgeRef = useRef<Ridge | null>(null);
  const t = COPY[lang];

  const trackRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const porcelainRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("seoul.lang");
      if (saved === "en" || saved === "ko") setLang(saved);
    } catch {}
    const rm = matchMedia("(prefers-reduced-motion: reduce)");
    const pm = matchMedia("(max-aspect-ratio: 4/5)");
    const sync = () => {
      setReduced(rm.matches);
      setPortrait(pm.matches);
    };
    sync();
    rm.addEventListener("change", sync);
    pm.addEventListener("change", sync);
    fetch(asset("/hero/ridge.json"))
      .then((r) => r.json())
      .then((data: Ridge) => {
        ridgeRef.current = data;
        setRidge(data);
      })
      .catch(() => {});
    return () => {
      rm.removeEventListener("change", sync);
      pm.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const chooseLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem("seoul.lang", next);
    } catch {}
  };

  const startTest = (answer: Answer) => {
    try {
      sessionStorage.setItem("seoul.answers", JSON.stringify([answer]));
    } catch {}
    router.push("/test");
  };

  const jumpToTest = () => {
    const track = trackRef.current;
    if (!track || reduced) {
      document.getElementById("first-question")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      return;
    }
    const top = track.offsetTop + (track.offsetHeight - window.innerHeight) * 0.985;
    window.scrollTo({ top, behavior: "smooth" });
  };

  // Main scroll-driven scene.
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    gsap.registerPlugin(ScrollTrigger);
    const set = portrait ? "m" : "d";
    let timing: Timing | null = null;
    let windows: ReturnType<typeof scrollWindows> = [];
    const frames: (HTMLImageElement | null)[] = [];
    let target = 0;
    let current = -1;
    let drawn = -1;
    let raf = 0;
    let cancelled = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      drawn = -1;
    };

    const nearest = (i: number) => {
      for (let d = 0; d < frames.length; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    };

    const cover = (img: HTMLImageElement, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      ctx.globalAlpha = 1;
    };

    // Screen position of the tower's observation deck on the last frame.
    const deckPoint = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const fw = portrait ? 9 : 16;
      const fh = portrait ? 16 : 9;
      const s = Math.max(cw / fw, ch / fh);
      const w = fw * s;
      const h = fh * s;
      const rg = ridgeRef.current;
      const tx = rg ? rg.tower.x : 0.574;
      const ty = rg ? (rg.tower.deckTop + rg.tower.deckBottom) / 2 : 0.58;
      const nx = portrait ? (tx - MOBILE_SLICE.x0) / MOBILE_SLICE.w : tx;
      return { x: (cw - w) / 2 + nx * w, y: (ch - h) / 2 + ty * h };
    };

    const render = (p: number) => {
      if (timing) {
        const f = frameAt(p, timing, windows);
        const key = Math.round(f * 20);
        if (key !== drawn) {
          const i0 = Math.floor(f);
          const a = f - i0;
          const base = nearest(i0);
          if (base) {
            cover(base, 1);
            const next = frames[i0 + 1];
            if (a > 0.04 && next) cover(next, a);
            drawn = key;
          }
        }
      }
      const u = phase(p, 0, UI_OUT);
      const panel = panelRef.current;
      const chips = chipsRef.current;
      if (panel) {
        panel.style.opacity = String(1 - u);
        panel.style.transform = `translateY(${-28 * easeOut(u)}px)`;
        panel.style.visibility = u >= 1 ? "hidden" : "visible";
      }
      if (chips) {
        chips.style.opacity = String(1 - u);
        chips.style.transform = `translateY(${24 * easeOut(u)}px)`;
        chips.style.visibility = u >= 1 ? "hidden" : "visible";
      }
      const z = phase(p, GLOW_FROM, GLOW_LEN);
      const deck = deckPoint();
      const scene = sceneRef.current;
      if (scene) {
        scene.style.transformOrigin = `${deck.x}px ${deck.y}px`;
        scene.style.transform = `scale(${1 + END_ZOOM * easeOut(z)})`;
      }
      // Exposure rises like a camera opening up toward the tower lights.
      canvas.style.filter = z > 0 ? `brightness(${1 + 1.6 * z * z}) saturate(${1 - 0.7 * z})` : "";
      const bloom = bloomRef.current;
      if (bloom) {
        bloom.style.opacity = String(smooth(phase(p, GLOW_FROM, GLOW_LEN * 0.6)) * (1 - phase(p, PORCELAIN_FROM + 0.04, 0.05)));
        bloom.style.setProperty("--bx", `${deck.x}px`);
        bloom.style.setProperty("--by", `${deck.y}px`);
        bloom.style.setProperty("--br", `${5 + 14 * z}vmax`);
      }
      const w = smooth(phase(p, PORCELAIN_FROM, PORCELAIN_LEN));
      const porcelain = porcelainRef.current;
      if (porcelain) porcelain.style.opacity = String(w);
      const scrim = scrimRef.current;
      if (scrim) scrim.style.opacity = String(1 - w);
      const c = phase(p, AFTER_FROM, AFTER_LEN);
      const line = lineRef.current;
      if (line) {
        const r = easeOut(phase(p, LINE_FROM, LINE_LEN));
        const r2 = easeOut(phase(p, LINE_FROM + 0.02, LINE_LEN));
        line.style.setProperty("--draw", String(1 - r));
        line.style.setProperty("--draw-tower", String(1 - r2));
        // On tall screens the drawing rises and steps back behind the question card.
        const settle = portrait ? easeOut(c) : 0;
        line.style.opacity = r > 0 ? String(1 - 0.7 * settle) : "0";
        line.style.transform = `translateY(${-0.3 * canvas.clientHeight * settle}px)`;
      }
      const after = afterRef.current;
      if (after) {
        after.style.opacity = String(c);
        after.style.transform = `translateY(${32 * (1 - easeOut(c))}px)`;
        after.style.visibility = c > 0 ? "visible" : "hidden";
        after.style.pointerEvents = c > 0.6 ? "auto" : "none";
      }
      navRef.current?.setAttribute("data-tone", p > PORCELAIN_FROM + 0.02 ? "ink" : "light");
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const next = current < 0 ? target : current + (target - current) * 0.16;
      if (Math.abs(next - current) < 0.00005 && current >= 0) return;
      current = next;
      render(current);
    };

    resize();
    window.addEventListener("resize", resize);

    fetch(asset("/hero/timing.json"))
      .then((r) => r.json())
      .then((data: Timing) => {
        if (cancelled) return;
        timing = data;
        windows = scrollWindows(data, FRAMES_FROM, FRAMES_TO);
        frames.length = data.frames;
        frames.fill(null);
        for (const i of loadOrder(data.frames)) {
          const img = new Image();
          img.decoding = "async";
          img.src = frameUrl(set, i);
          img.decode().then(
            () => {
              if (cancelled) return;
              frames[i] = img;
              drawn = -1;
            },
            () => {},
          );
        }
      })
      .catch(() => {});

    const st = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        target = self.progress;
      },
    });
    target = st.progress;
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      st.kill();
    };
  }, [reduced, portrait]);

  const lineGeometry = useMemo(() => {
    if (!ridge) return null;
    const vw = portrait ? 900 : 1600;
    const vh = portrait ? 1600 : 900;
    const X = (x: number) => (portrait ? ((x - MOBILE_SLICE.x0) / MOBILE_SLICE.w) * vw : x * vw);
    const Y = (y: number) => y * vh;
    const ridgePath = ridge.ridge.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(" ");
    const tw = ridge.tower;
    const sx = portrait ? vw / MOBILE_SLICE.w : vw; // scale for horizontal widths
    const shaft = tw.shaftHalfWidth * sx;
    const deck = tw.deckHalfWidth * sx;
    const cx = X(tw.x);
    const f = (n: number) => n.toFixed(1);
    const dt = Y(tw.deckTop);
    const db = Y(tw.deckBottom);
    const mid = (dt + db) / 2;
    const bulge = (db - dt) * 0.35;
    const mast = Y(tw.antennaBase) - (db - dt) * 0.9;
    const towerPath = [
      // tapering shaft
      `M${f(cx - shaft)} ${f(Y(tw.base))} L${f(cx - shaft * 0.72)} ${f(db)}`,
      `M${f(cx + shaft)} ${f(Y(tw.base))} L${f(cx + shaft * 0.72)} ${f(db)}`,
      // observation deck: a soft drum, wider at its waist
      `M${f(cx - deck * 0.8)} ${f(db)} Q${f(cx - deck - bulge)} ${f(mid)} ${f(cx - deck * 0.8)} ${f(dt)}`,
      `M${f(cx + deck * 0.8)} ${f(db)} Q${f(cx + deck + bulge)} ${f(mid)} ${f(cx + deck * 0.8)} ${f(dt)}`,
      `M${f(cx - deck * 0.8)} ${f(db)} L${f(cx + deck * 0.8)} ${f(db)}`,
      `M${f(cx - deck * 0.8)} ${f(dt)} L${f(cx + deck * 0.8)} ${f(dt)}`,
      `M${f(cx - deck)} ${f(mid)} L${f(cx + deck)} ${f(mid)}`,
      // upper mast and antenna
      `M${f(cx - shaft * 0.45)} ${f(dt)} L${f(cx - shaft * 0.3)} ${f(mast)} L${f(cx)} ${f(Y(tw.tip))} L${f(cx + shaft * 0.3)} ${f(mast)} L${f(cx + shaft * 0.45)} ${f(dt)}`,
    ].join(" ");
    const antennaPath = ridge.antennas
      .map((a) => {
        const ax = X(a.x);
        const half = 0.006 * sx;
        return `M${(ax - half).toFixed(1)} ${Y(a.base).toFixed(1)} L${ax.toFixed(1)} ${Y(a.top).toFixed(1)} L${(ax + half).toFixed(1)} ${Y(a.base).toFixed(1)}`;
      })
      .join(" ");
    return { vw, vh, ridgePath, towerPath, antennaPath };
  }, [ridge, portrait]);

  const districts = DISTRICT_ORDER.map((slug) => DISTRICTS.find((d) => d.slug === slug)!);
  const first = QUESTIONS[0];

  const nav = (
    <header ref={navRef} className={styles.nav} data-tone="light">
      <Link className={styles.wordmark} href="/">
        Seoul, Curated
      </Link>
      <nav className={styles.links} aria-label="Main">
        <button type="button" className={styles.link} onClick={jumpToTest}>
          {t.nav.test}
        </button>
        <a className={styles.link} href="#about">
          {t.nav.about}
        </a>
        <div className={styles.lang} role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => chooseLang("en")}>
            EN
          </button>
          <span aria-hidden="true">|</span>
          <button type="button" aria-pressed={lang === "ko"} onClick={() => chooseLang("ko")}>
            KO
          </button>
        </div>
      </nav>
    </header>
  );

  const panel = (
    <div ref={panelRef} className={styles.panel}>
      <h1 className={styles.headline}>{t.headline}</h1>
      <p className={styles.sub}>{t.sub}</p>
      <button type="button" className="btn btn-primary" onClick={jumpToTest}>
        {t.cta}
      </button>
      <p className={styles.time}>{t.time}</p>
    </div>
  );

  const chips = (
    <div ref={chipsRef} className={styles.chips}>
      <ul aria-label={t.districtsLabel}>
        {districts.map((d) => (
          <li key={d.slug}>{lang === "ko" ? d.nameKo : d.nameEn}</li>
        ))}
      </ul>
    </div>
  );

  const after = (
    <div ref={afterRef} className={styles.after} id="first-question">
      <h2 className={styles.afterTitle}>{t.afterTitle}</h2>
      <p className={styles.afterBody}>{t.afterBody}</p>
      <QuestionCard question={first} index={1} total={QUESTIONS.length} label={t.cardOf(1, QUESTIONS.length)} onAnswer={startTest} headingLevel="h3" />
    </div>
  );

  const lineArt = lineGeometry && (
    <svg
      ref={lineRef}
      className={styles.line}
      viewBox={`0 0 ${lineGeometry.vw} ${lineGeometry.vh}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path className={styles.ridge} d={lineGeometry.ridgePath} pathLength={1} />
      <path className={styles.tower} d={lineGeometry.towerPath} pathLength={1} />
      <path className={styles.tower} d={lineGeometry.antennaPath} pathLength={1} />
    </svg>
  );

  if (reduced) {
    return (
      <div className={styles.root}>
        {nav}
        <section className={styles.staticHero}>
          <picture>
            <source media="(max-aspect-ratio: 4/5)" srcSet={asset("/hero/poster-m.jpg")} />
            <img src={asset("/hero/poster-d.jpg")} alt="Hanok roof eaves in the foreground and Seoul with N Seoul Tower at golden hour" />
          </picture>
          {panel}
          {chips}
        </section>
        <section className={styles.staticNight}>
          <img src={asset(portrait ? "/hero/m/0241.webp" : "/hero/d/0241.webp")} alt="N Seoul Tower lit at night on Namsan" />
        </section>
        <section className={styles.staticAfter}>
          {lineArt}
          {after}
        </section>
        <Footer t={t} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {nav}
      <section ref={trackRef} className={styles.track} aria-label={t.headline}>
        <div className={styles.stage}>
          <div ref={sceneRef} className={styles.scene}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              style={{ backgroundImage: `url(${asset(portrait ? "/hero/poster-m.jpg" : "/hero/poster-d.jpg")})` }}
              aria-hidden="true"
            />
            <div ref={bloomRef} className={styles.bloom} aria-hidden="true" />
            <div ref={porcelainRef} className={styles.porcelain} aria-hidden="true" />
            {lineArt}
          </div>
          <div ref={scrimRef} className={styles.scrim} aria-hidden="true" />
          {panel}
          {chips}
          {after}
        </div>
      </section>
      <Footer t={t} />
    </div>
  );
}

function Footer({ t }: { t: (typeof COPY)[Lang] }) {
  return (
    <footer className="site-footer" id="about">
      <p>{t.proposal}</p>
      <p>{t.sceneNote}</p>
    </footer>
  );
}
