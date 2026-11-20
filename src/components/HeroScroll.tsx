"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frameAt, scrollWindows, type Timing } from "@/lib/hero/timeline.ts";
import { evictions, nextToFetch, wanted } from "@/lib/hero/frame-cache.ts";
import { COPY, type Lang } from "@/lib/hero/copy.ts";
import { useLang } from "@/lib/lang.ts";
import { BuildTag } from "./BuildTag";
import { asset } from "@/lib/base-path.ts";
import { SiteNav } from "./SiteNav";
import { Phrases } from "./Phrases";
import styles from "./HeroScroll.module.css";

// Scroll map (share of the pinned track, 960svh tall).
const INTRO_OUT = 0.05; // the title steps back as soon as scrolling starts
const FRAMES_FROM = 0.04;
const FRAMES_TO = 0.71;
// After the zoom lands, the last shot holds for a beat (with a slow push-in) before night falls.
const HOLD_LEN = 0.09;
const NIGHT_FROM = FRAMES_TO + HOLD_LEN; // the held shot softens into a blurred night backdrop
const NIGHT_LEN = 0.08;
const WELCOME_IN = [0.84, 0.06] as const; // "Welcome to Seoul!" rises in and stays
const START_IN = [0.91, 0.05] as const; // then the button that opens the test
// Short lines over the film, placed by share of the film so they land on the right scene.
const CAPTIONS: readonly [number, number][] = [
  [0.03, 0.19], // rooftops by day
  [0.24, 0.52], // lights coming on
  [0.57, 0.95], // closing in on Namsan
];
const CAPTION_FADE = 0.035;
const SMOOTH_MS = 120; // time constant of the scroll follow; frame-rate independent

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const phase = (p: number, from: number, len: number) => clamp01((p - from) / len);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);
const frameUrl = (set: string, i: number) => asset(`/hero/${set}/${String(i + 1).padStart(4, "0")}.webp`);


type Frame = HTMLImageElement | ImageBitmap;

export function HeroScroll() {
  const router = useRouter();
  const [lang, chooseLang] = useLang();
  const [reduced, setReduced] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const t = COPY[lang];
  const set = portrait ? "m" : "d";

  const trackRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLHeadingElement>(null);
  const captionRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const lowShadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const startTest = () => {
    try {
      sessionStorage.removeItem("seoul.answers");
    } catch {}
    router.push("/test");
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
      let shade = 0;
      const film = phase(p, FRAMES_FROM, FRAMES_TO - FRAMES_FROM);
      CAPTIONS.forEach(([a, b], k) => {
        const el = captionRefs.current[k];
        if (!el) return;
        const v = Math.min(clamp01((film - a) / CAPTION_FADE), clamp01((b - film) / CAPTION_FADE));
        const e = easeOut(v);
        const dir = film < (a + b) / 2 ? 1 : -1; // rise in from below, lift away above
        el.style.opacity = String(e);
        el.style.transform = `translateY(${dir * 18 * (1 - e)}px)`;
        el.style.filter = e < 1 ? `blur(${5 * (1 - e)}px)` : "";
        el.style.visibility = v > 0 ? "visible" : "hidden";
        shade = Math.max(shade, e);
      });
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
      if (lowShadeRef.current) lowShadeRef.current.style.opacity = String(shade);
      const w = welcomeRef.current;
      if (w) {
        const v = easeOut(phase(p, WELCOME_IN[0], WELCOME_IN[1]));
        w.style.opacity = String(v);
        w.style.transform = `translateY(${24 * (1 - v)}px) scale(${0.98 + 0.02 * v})`;
        w.style.filter = v < 1 ? `blur(${8 * (1 - v)}px)` : "";
        w.style.visibility = v > 0 ? "visible" : "hidden";
      }
      const u = easeOut(phase(p, 0, INTRO_OUT));
      // The scroll cue leaves as soon as the visitor starts, a little ahead of the headline.
      const cue = cueRef.current;
      if (cue) {
        const c = Math.min(1, u * 2.5);
        cue.style.opacity = String(1 - c);
        cue.style.visibility = c >= 1 ? "hidden" : "visible";
      }
      const intro = introRef.current;
      if (intro) {
        intro.style.opacity = String(1 - u);
        intro.style.transform = `translateY(${-24 * u}px)`;
        intro.style.filter = u > 0 ? `blur(${6 * u}px)` : "";
        intro.style.visibility = u >= 1 ? "hidden" : "visible";
      }
      // The held shot keeps a slow push-in so it settles rather than freezes.
      const h = phase(p, FRAMES_TO, HOLD_LEN + NIGHT_LEN);
      const push = 1 + 0.035 * (1 - Math.pow(1 - h, 2));
      const z = smooth(phase(p, NIGHT_FROM, NIGHT_LEN));
      const scene = sceneRef.current;
      if (scene) scene.style.transform = push > 1 ? `scale(${push})` : "";
      const night = nightRef.current;
      if (night) {
        night.style.opacity = String(z);
        night.style.transform = `scale(${push})`;
      }
      const c = easeOut(phase(p, START_IN[0], START_IN[1]));
      const start = startRef.current;
      if (start) {
        start.style.opacity = String(c);
        start.style.transform = `translateY(${16 * (1 - c)}px)`;
        start.style.visibility = c > 0 ? "visible" : "hidden";
        start.style.pointerEvents = c > 0.5 ? "auto" : "none";
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

    // Download every frame as a compressed blob, a few at a time: the opening first, then
    // always the stretch just ahead of where the visitor is scrolling (see nextToFetch).
    // Fetching in a fixed coarse-to-fine order left gaps right where the first scroll went.
    fetch(asset("/hero/timing.json"))
      .then((r) => r.json())
      .then(async (data: Timing) => {
        if (cancelled) return;
        timing = data;
        windows = scrollWindows(data, FRAMES_FROM, FRAMES_TO);
        blobs.length = data.frames;
        blobs.fill(null);
        const got = new Uint8Array(data.frames);
        const worker = async () => {
          for (let i = nextToFetch(got, lastFrame, direction); i !== undefined && !cancelled; i = nextToFetch(got, lastFrame, direction)) {
            got[i] = 1;
            try {
              const r = await fetch(frameUrl(set, i));
              blobs[i] = await r.blob();
              drawn = -1;
            } catch {}
          }
        };
        await Promise.all(Array.from({ length: portrait ? 4 : 6 }, worker));
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

  const nightBg = { backgroundImage: `url(${asset(`/hero/night-${set}.jpg`)})` };

  const nav = <SiteNav lang={lang} onLang={chooseLang} />;

  const intro = (
    <div ref={introRef} className={styles.intro}>
      <h1 className={styles.headline}>{t.headline}</h1>
      <p className={styles.sub}>
        <Phrases text={t.sub} />
      </p>
    </div>
  );

  // Tells first-time visitors the page is driven by scrolling.
  const cue = (
    <div ref={cueRef} className={styles.cue} aria-hidden="true">
      <span className={styles.cueText}>{t.scrollCue}</span>
      <span className={styles.cueTrack}>
        <span className={styles.cueDot} />
      </span>
    </div>
  );

  const startBlock = (
    <div ref={startRef} className={styles.start}>
      <p className={styles.startLine}>
        <Phrases text={t.startLine} />
      </p>
      <button type="button" className="btn btn-light" onClick={startTest}>
        {t.start}
      </button>
      <Link className={styles.walkFirst} href="/metaverse/jongno">
        {t.walkFirst}
      </Link>
    </div>
  );

  if (reduced) {
    return (
      <div className={styles.root}>
        {nav}
        <section className={styles.staticHero} style={{ backgroundImage: `url(${asset(`/hero/poster-${set}.jpg`)})` }}>
          <div className={styles.shade} aria-hidden="true" />
          {intro}
          {cue}
        </section>
        <section className={styles.staticNight} style={nightBg}>
          <div className={styles.dusk} aria-hidden="true" />
          <div className={styles.arrival}>
            <h2 className={styles.welcome}>{t.welcome}</h2>
            {startBlock}
          </div>
        </section>
        <Footer t={t} lang={lang} />
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
          <div ref={lowShadeRef} className={styles.lowShade} aria-hidden="true" />
          {intro}
          {cue}
          {t.captions.map((line, k) => (
            <p
              key={k}
              ref={(el) => {
                captionRefs.current[k] = el;
              }}
              className={styles.caption}
            >
              {line}
            </p>
          ))}
          <div className={styles.arrival}>
            <h2 ref={welcomeRef} className={styles.welcome}>
              {t.welcome}
            </h2>
            {startBlock}
          </div>
        </div>
      </section>
      <Footer t={t} lang={lang} />
    </div>
  );
}

function Footer({ t, lang }: { t: (typeof COPY)[keyof typeof COPY]; lang: Lang }) {
  return (
    <footer className="site-footer" id="about">
      <p>
        <Phrases text={t.proposal} />
      </p>
      <p>
        <Phrases text={t.sceneNote} />
      </p>
      <BuildTag lang={lang} />
    </footer>
  );
}
