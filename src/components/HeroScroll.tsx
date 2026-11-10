"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QUESTIONS } from "@/lib/match/questions.ts";
import type { Answer } from "@/lib/match/match.ts";
import { frameAt, scrollWindows, type Timing } from "@/lib/hero/timeline.ts";
import { evictions, wanted } from "@/lib/hero/frame-cache.ts";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { asset } from "@/lib/base-path.ts";
import { QuestionCard } from "./QuestionCard";
import styles from "./HeroScroll.module.css";

// Scroll map (share of the pinned track).
const INTRO_OUT = 0.06; // the title steps back as soon as scrolling starts
const FRAMES_FROM = 0.05;
const FRAMES_TO = 0.84;
const NIGHT_FROM = 0.82; // the last frame softens into a blurred night backdrop
const NIGHT_LEN = 0.1;
const AFTER_FROM = 0.88;
const AFTER_LEN = 0.08;
const SMOOTH_MS = 120; // time constant of the scroll follow; frame-rate independent

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

type Frame = HTMLImageElement | ImageBitmap;

export function HeroScroll() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [reduced, setReduced] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const t = COPY[lang];
  const set = portrait ? "m" : "d";

  const trackRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);

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
    window.scrollTo({ top: track.offsetTop + track.offsetHeight - window.innerHeight, behavior: "smooth" });
  };

  // Main scroll-driven scene.
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    gsap.registerPlugin(ScrollTrigger);
    let timing: Timing | null = null;
    let windows: ReturnType<typeof scrollWindows> = [];
    // Frames stay compressed as blobs; only a window around the current frame is
    // decoded, because hundreds of decoded bitmaps exhaust mobile Safari's memory.
    const blobs: (Blob | null)[] = [];
    const bitmaps = new Map<number, Frame>();
    const decoding = new Set<number>();
    const maxDecoded = portrait ? 24 : 32;
    let frameW = portrait ? 720 : 1280;
    let lastFrame = 0;
    let direction: 1 | -1 = 1;
    let target = 0;
    let current = -1;
    let drawn = -1;
    let raf = 0;
    let last = performance.now();
    let cancelled = false;

    const release = (f: Frame) => {
      if ("close" in f) f.close();
    };

    // Draw no larger than the frames themselves: a bigger canvas costs time, not detail.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(dpr, (frameW * 1.15) / Math.max(1, canvas.clientWidth));
      canvas.width = Math.round(canvas.clientWidth * scale);
      canvas.height = Math.round(canvas.clientHeight * scale);
      ctx.imageSmoothingQuality = "high";
      drawn = -1;
    };

    const trim = () => {
      for (const k of evictions([...bitmaps.keys()], lastFrame, maxDecoded)) {
        const f = bitmaps.get(k);
        bitmaps.delete(k);
        if (f) release(f);
      }
    };

    const decode = (i: number) => {
      const blob = blobs[i];
      if (!blob || bitmaps.has(i) || decoding.has(i)) return;
      decoding.add(i);
      const done = (f: Frame) => {
        decoding.delete(i);
        if (cancelled) return release(f);
        if (i === 0 && f.width !== frameW) {
          frameW = f.width;
          resize();
        }
        bitmaps.set(i, f);
        trim();
        drawn = -1;
      };
      if ("createImageBitmap" in window) {
        createImageBitmap(blob).then(done, () => decoding.delete(i));
      } else {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        img.decode().then(
          () => {
            URL.revokeObjectURL(url);
            done(img);
          },
          () => decoding.delete(i),
        );
      }
    };

    const nearestDecoded = (i: number) => {
      let best: Frame | null = null;
      let dist = Infinity;
      for (const [k, f] of bitmaps) {
        const d = Math.abs(k - i);
        if (d < dist) {
          dist = d;
          best = f;
        }
      }
      return best;
    };

    const cover = (img: Frame, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / img.width, ch / img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      ctx.globalAlpha = 1;
    };

    const render = (p: number) => {
      if (timing) {
        const f = frameAt(p, timing, windows);
        const i0 = Math.floor(f);
        if (i0 !== lastFrame) direction = i0 > lastFrame ? 1 : -1;
        lastFrame = i0;
        for (const i of wanted(i0, direction, timing.frames, 6, 16)) {
          if (decoding.size >= 3) break;
          decode(i);
        }
        const key = Math.round(f * 16);
        if (key !== drawn) {
          const a = f - i0;
          const exact = bitmaps.get(i0);
          const base = exact ?? nearestDecoded(i0);
          if (base) {
            cover(base, 1);
            const next = bitmaps.get(i0 + 1);
            if (exact && a > 0.06 && next) cover(next, a);
            drawn = exact ? key : -1;
          }
        }
      }
      const u = easeOut(phase(p, 0, INTRO_OUT));
      const intro = introRef.current;
      if (intro) {
        intro.style.opacity = String(1 - u);
        intro.style.transform = `translateY(${-24 * u}px)`;
        intro.style.filter = u > 0 ? `blur(${6 * u}px)` : "";
        intro.style.visibility = u >= 1 ? "hidden" : "visible";
      }
      const z = smooth(phase(p, NIGHT_FROM, NIGHT_LEN));
      const scene = sceneRef.current;
      if (scene) scene.style.transform = z > 0 ? `scale(${1 + 0.04 * z})` : "";
      const night = nightRef.current;
      if (night) {
        night.style.opacity = String(z);
        night.style.transform = `scale(${1 + 0.04 * z})`;
      }
      const c = phase(p, AFTER_FROM, AFTER_LEN);
      const after = afterRef.current;
      if (after) {
        after.style.opacity = String(easeOut(c));
        after.style.transform = `translateY(${28 * (1 - easeOut(c))}px)`;
        after.style.visibility = c > 0 ? "visible" : "hidden";
        after.style.pointerEvents = c > 0.6 ? "auto" : "none";
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      const k = 1 - Math.exp(-dt / SMOOTH_MS);
      const next = current < 0 ? target : current + (target - current) * k;
      if (Math.abs(next - current) < 0.00002 && current >= 0 && drawn >= 0) return;
      current = next;
      render(current);
    };

    resize();
    window.addEventListener("resize", resize);

    // Download every frame as a compressed blob, coarse frames first, a few at a time.
    fetch(asset("/hero/timing.json"))
      .then((r) => r.json())
      .then(async (data: Timing) => {
        if (cancelled) return;
        timing = data;
        windows = scrollWindows(data, FRAMES_FROM, FRAMES_TO);
        blobs.length = data.frames;
        blobs.fill(null);
        const queue = loadOrder(data.frames);
        const worker = async () => {
          for (let i = queue.shift(); i !== undefined && !cancelled; i = queue.shift()) {
            try {
              const r = await fetch(frameUrl(set, i));
              blobs[i] = await r.blob();
              drawn = -1;
            } catch {}
          }
        };
        await Promise.all(Array.from({ length: 6 }, worker));
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
      for (const f of bitmaps.values()) release(f);
      bitmaps.clear();
    };
  }, [reduced, portrait, set]);

  const first = QUESTIONS[0];
  const nightBg = { backgroundImage: `url(${asset(`/hero/night-${set}.jpg`)})` };

  const nav = (
    <header className={styles.nav}>
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

  const intro = (
    <div ref={introRef} className={styles.intro}>
      <h1 className={styles.headline}>{t.headline}</h1>
      <p className={styles.sub}>{t.sub}</p>
    </div>
  );

  const after = (
    <div ref={afterRef} className={styles.after} id="first-question">
      <h2 className={styles.afterTitle}>{t.afterTitle}</h2>
      <p className={styles.afterBody}>{t.afterBody}</p>
      <QuestionCard question={first} index={1} total={QUESTIONS.length} label={t.cardOf(1, QUESTIONS.length)} onAnswer={startTest} headingLevel="h3" />
    </div>
  );

  if (reduced) {
    return (
      <div className={styles.root}>
        {nav}
        <section className={styles.staticHero} style={{ backgroundImage: `url(${asset(`/hero/poster-${set}.jpg`)})` }}>
          <div className={styles.shade} aria-hidden="true" />
          {intro}
        </section>
        <section className={styles.staticNight} style={nightBg}>
          <div className={styles.dusk} aria-hidden="true" />
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
              style={{ backgroundImage: `url(${asset(`/hero/poster-${set}.jpg`)})` }}
              aria-hidden="true"
            />
          </div>
          <div ref={nightRef} className={styles.night} style={nightBg} aria-hidden="true">
            <div className={styles.dusk} />
          </div>
          <div className={styles.shade} aria-hidden="true" />
          {intro}
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
