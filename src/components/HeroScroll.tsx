"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { frameAt, scrollWindows, type Timing } from "@/lib/hero/timeline.ts";
import { evictions, nearestAvailable, nextToFetch, wanted } from "@/lib/hero/frame-cache.ts";
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
// Loading gate. A first scroll that outruns the download shows held frames, so scrolling waits
// (briefly) until the frames already here plus those still arriving keep ahead of a visitor
// Scrolling waits at the top until every frame of the film has arrived (each one fetched or
// given up on), so even a fast first scroll never outruns the download. A fast line takes a
// second or two; a slow one is let go at GATE_MAX_MS and holds frames as it scrolls.
const EARLY_FRAMES = 16; // fetched alongside the page, before any script runs
const GATE_MAX_MS = 10000; // never hold the page longer than this, counted from the page request
// The opening card (first visit only): long enough to read its one line, then it lifts.
const SPLASH_MIN_MS = 1400; // from the page request
const SPLASH_OUT_MS = 900; // how long it takes to lift

const PORTRAIT = "(max-aspect-ratio: 4/5)"; // phones held upright get the tall film

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
  // The server cannot know the screen's shape; nothing loads until the browser has said.
  const [measured, setMeasured] = useState(false);
  // The first screen says the film is loading until the effect below knows otherwise.
  const [loading, setLoading] = useState(true);
  const t = COPY[lang];
  const set = portrait ? "m" : "d";

  const trackRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const splashFillRef = useRef<HTMLSpanElement>(null);
  // the opening card: on, lifting, gone
  // on → leaving → done; "gone" when it was never shown (seen earlier in this visit)
  const [splash, setSplash] = useState<"on" | "leaving" | "done" | "gone">("on");
  const startRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLHeadingElement>(null);
  const captionRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const lowShadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rm = matchMedia("(prefers-reduced-motion: reduce)");
    const pm = matchMedia(PORTRAIT);
    const sync = () => {
      setReduced(rm.matches);
      setPortrait(pm.matches);
      setMeasured(true);
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
    if (reduced || !measured) return;
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
    const maxDecoded = portrait ? 28 : 40;
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

    // ?perf: how far the frame on screen is from the one the scroll asks for.
    const stats = new URLSearchParams(location.search).has("perf") ? ((window as unknown as { __hero: object }).__hero = { want: 0, shown: -1, sharp: false, blobs: 0, decoded: 0 }) as { want: number; shown: number; sharp: boolean; blobs: number; decoded: number } : null;

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

    // What is on screen. The film only ever shows real, sharp frames: when the exact frame is
    // not decoded yet, it holds the closest decoded frame between the one shown and the one
    // wanted, so the picture keeps moving forward and never steps back. (Blurred stand-ins
    // flickering against sharp frames read as grain.)
    let shown = -1;
    const pickSharp = (i0: number): number | null => {
      if (bitmaps.has(i0)) return i0;
      // a frame between the one on screen and the one wanted counts as half a frame closer
      const score = (k: number) => Math.abs(k - i0) - (shown >= 0 && (k - shown) * (i0 - k) >= 0 ? 0.5 : 0);
      let best: number | null = null;
      for (const k of bitmaps.keys()) if (best === null || score(k) < score(best)) best = k;
      return best;
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
        el.style.visibility = v > 0 ? "visible" : "hidden";
        shade = Math.max(shade, e);
      });
      if (timing) {
        const f = frameAt(p, timing, windows);
        const i0 = Math.floor(f);
        if (i0 !== lastFrame) direction = i0 > lastFrame ? 1 : -1;
        lastFrame = i0;
        // The exact frame has not arrived yet: decode the closest one that has.
        if (!blobs[i0]) {
          const k = nearestAvailable(i0, (j) => j >= 0 && j < blobs.length && !!blobs[j], 60);
          if (k !== null) decode(k);
        }
        for (const i of wanted(i0, direction, timing.frames, 6, portrait ? 16 : 24)) {
          if (decoding.size >= 6) break;
          decode(i);
        }
        const key = Math.round(f * 16);
        if (key !== drawn) {
          const a = f - i0;
          const k = pickSharp(i0);
          if (k !== null) {
            cover(bitmaps.get(k)!, 1);
            // between two neighbouring frames, blend them; only ever two sharp neighbours
            const next = k === i0 ? bitmaps.get(i0 + 1) : undefined;
            if (a > 0.06 && next) cover(next, a);
            shown = k;
            drawn = k === i0 && (a <= 0.06 || next) ? key : -1;
          } else {
            shown = -1;
            drawn = -1; // nothing decoded yet: the poster behind the canvas shows
          }
          if (stats) {
            stats.want = i0;
            stats.shown = k ?? -1;
            stats.sharp = k !== null;
            stats.blobs = blobs.filter(Boolean).length;
            stats.decoded = bitmaps.size;
          }
        }
      }
      if (lowShadeRef.current) lowShadeRef.current.style.opacity = String(shade);
      const w = welcomeRef.current;
      if (w) {
        const v = easeOut(phase(p, WELCOME_IN[0], WELCOME_IN[1]));
        w.style.opacity = String(v);
        w.style.transform = `translateY(${24 * (1 - v)}px) scale(${0.98 + 0.02 * v})`;
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

    // Hold scrolling at the top until the whole film is here (see GATE_MAX_MS).
    const blockKeys = new Set([" ", "PageDown", "ArrowDown", "End", "Spacebar"]);
    const block = (e: Event) => {
      if (e instanceof KeyboardEvent && !blockKeys.has(e.key)) return;
      e.preventDefault();
    };
    let gateTimer = 0;
    let lifted = false;
    let liftTimer = 0;
    let goneTimer = 0;
    const openGate = () => {
      if (lifted) return;
      lifted = true;
      cancelAnimationFrame(gateTimer);
      clearTimeout(gateLimit);
      if (splashFillRef.current) splashFillRef.current.style.transform = "scaleX(1)";
      const seen = document.documentElement.dataset.intro === "seen";
      const lift = () => {
        window.removeEventListener("wheel", block);
        window.removeEventListener("touchmove", block);
        window.removeEventListener("keydown", block);
        setLoading(false);
        if (seen) return setSplash("gone");
        setSplash("leaving");
        try {
          sessionStorage.setItem("seoul.intro", "1");
        } catch {}
        goneTimer = window.setTimeout(() => setSplash("done"), SPLASH_OUT_MS);
      };
      const wait = seen || cancelled ? 0 : Math.max(0, SPLASH_MIN_MS - performance.now());
      if (wait) liftTimer = window.setTimeout(lift, wait);
      else lift();
    };
    // The server-rendered page already holds scrolling (.gate, see the CSS), so a visitor
    // cannot scroll ahead while the scripts are still on their way; this keeps it held until the
    // film is ready and then lets go. `watch` begins once the timing file is in.
    const holding = window.scrollY <= 10; // coming back mid-page: nothing to wait for
    if (holding) {
      const opts = { passive: false } as const;
      window.addEventListener("wheel", block, opts);
      window.addEventListener("touchmove", block, opts);
      window.addEventListener("keydown", block);
    } else {
      setLoading(false);
      setSplash("gone");
    }
    const settled = { n: 0 }; // frames fetched or given up on
    const watch = (total: number) => {
      if (!holding) return;
      const check = () => {
        if (cancelled) return;
        const sinceOpen = performance.now(); // ms since the page was requested
        // every frame in (or given up on after its retries), and the opening decoded for drawing
        const ready = settled.n >= total && [0, 1, 2, 3].every((k) => bitmaps.has(k) || !blobs[k]);
        if (splashFillRef.current) splashFillRef.current.style.transform = `scaleX(${Math.min(1, settled.n / total)})`;
        if (ready || sinceOpen >= GATE_MAX_MS) return openGate();
        gateTimer = requestAnimationFrame(check);
      };
      check();
    };
    // the hard limit holds even if the timing file never comes
    const gateLimit = window.setTimeout(openGate, Math.max(0, GATE_MAX_MS + 100 - performance.now()));

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
        const tries = new Uint8Array(data.frames);
        settled.n = 0;
        const worker = async () => {
          for (let i = nextToFetch(got, lastFrame, direction); i !== undefined && !cancelled; i = nextToFetch(got, lastFrame, direction)) {
            got[i] = 1;
            try {
              const r = await fetch(frameUrl(set, i));
              if (!r.ok) throw new Error(String(r.status));
              blobs[i] = await r.blob();
              settled.n++;
              drawn = -1;
            } catch {
              // A dropped download on a shaky connection: try that frame again later (twice at most).
              if (++tries[i] < 3) got[i] = 0;
              else settled.n++;
            }
          }
        };
        watch(data.frames);
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
    // Once the film is over the page scrolls on to the footer, and the welcome and the footer
    // pass under the see-through bar: give the bar the night behind it from then on.
    const past = ScrollTrigger.create({
      trigger: track,
      start: "bottom bottom-=2",
      end: "max",
      onToggle: (self) => rootRef.current?.toggleAttribute("data-past", self.isActive),
    });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      openGate();
      clearTimeout(liftTimer);
      clearTimeout(goneTimer);
      window.removeEventListener("resize", resize);
      st.kill();
      past.kill();
      for (const f of bitmaps.values()) release(f);
      bitmaps.clear();
    };
  }, [reduced, portrait, set, measured]);

  const nightBg = { backgroundImage: `url(${asset(`/hero/night-${set}.jpg`)})` };
  // The opening picture, chosen by CSS (not by state, which the server cannot know), so a phone
  // fetches only its own poster, and early.
  const posterD = asset("/hero/poster-d.jpg");
  const posterM = asset("/hero/poster-m.jpg");
  preload(posterM, { as: "image", media: PORTRAIT, fetchPriority: "high" });
  preload(posterD, { as: "image", media: `not all and ${PORTRAIT}`, fetchPriority: "high" });
  // The opening frames and the timing file start downloading with the page itself, before the
  // scripts: on a slow line the scripts alone can take seconds. The script's own fetch() of the
  // same files is then served from this download (same mode: cors, same-origin credentials).
  preload(asset("/hero/timing.json"), { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  for (let i = 0; i < EARLY_FRAMES; i++) {
    preload(frameUrl("m", i), { as: "fetch", crossOrigin: "anonymous", media: PORTRAIT, fetchPriority: "low" });
    preload(frameUrl("d", i), { as: "fetch", crossOrigin: "anonymous", media: `not all and ${PORTRAIT}`, fetchPriority: "low" });
  }
  const nights = { "--night-d": `url(${asset("/hero/night-d.jpg")})`, "--night-m": `url(${asset("/hero/night-m.jpg")})` } as React.CSSProperties;
  const posters = { "--poster-d": `url(${posterD})`, "--poster-m": `url(${posterM})` } as React.CSSProperties;

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

  // The opening card, first visit only. Both languages are in the page and CSS shows the one
  // chosen (set before the first paint, see the layout), so it never flips language on screen.
  const opening = (splash === "on" || splash === "leaving") && (
    <div className={styles.splash} style={nights} data-leaving={splash === "leaving" || undefined} role="status">
      <div className={styles.splashBody}>
        <img
          className={styles.splashLogo}
          src={asset("/brand/logo-128.png")}
          srcSet={`${asset("/brand/logo-128.png")} 1x, ${asset("/brand/logo-256.png")} 2x`}
          alt=""
          width={56}
          height={56}
        />
        <p className={styles.splashWord} translate="no">
          <span className={styles.splashStrong}>Seoul,</span> Curated
        </p>
        <p className={styles.splashLine}>
          <span lang="en" className={styles.inEn}>
            {COPY.en.opening}
          </span>
          <span lang="ko" className={styles.inKo}>
            {COPY.ko.opening}
          </span>
        </p>
        <span className={styles.splashTrack} aria-hidden="true">
          <span ref={splashFillRef} className={styles.splashFill} />
        </span>
      </div>
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
      <Link className={styles.walkFirst} href="/metaverse">
        {t.walkFirst}
      </Link>
    </div>
  );

  if (reduced) {
    return (
      <div className={styles.root}>
        {nav}
        <section className={`${styles.staticHero} ${styles.poster}`} style={posters}>
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
    <div ref={rootRef} className={loading && !reduced ? `${styles.root} ${styles.gate}` : styles.root} data-reveal={splash === "leaving" || splash === "done" || undefined}>
      {opening}
      {nav}
      <section ref={trackRef} className={styles.track} aria-label={t.headline}>
        <div className={styles.stage}>
          <div ref={sceneRef} className={styles.scene}>
            <canvas
              ref={canvasRef}
              className={`${styles.canvas} ${styles.poster}`}
              style={posters}
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
