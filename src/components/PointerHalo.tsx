"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./PointerHalo.module.css";

const INTERACTIVE = "a, button, [role='button'], summary, label, input, select, textarea";

/**
 * A soft ring that trails the mouse and opens up over anything clickable, so the pointer's
 * place is easy to follow. Mouse and trackpad only, never on touch; off for reduced motion
 * and inside the metaverse, which has its own pointer. The system cursor stays as it is.
 */
export function PointerHalo() {
  const ring = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const off = pathname?.startsWith("/metaverse/") ?? false;

  useEffect(() => {
    const el = ring.current;
    if (!el || off) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let x = -100, y = -100, tx = -100, ty = -100;
    let scale = 1, target = 1;
    let shown = false, raf = 0, last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Frame-rate independent follow: closes ~95% of the gap in about 0.15s.
      const k = 1 - Math.exp(-dt * 20);
      x += (tx - x) * k;
      y += (ty - y) * k;
      scale += (target - scale) * (1 - Math.exp(-dt * 16));
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      const settled = Math.abs(tx - x) < 0.1 && Math.abs(ty - y) < 0.1 && Math.abs(target - scale) < 0.002;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        x = tx;
        y = ty;
        shown = true;
        el.dataset.shown = "true";
      }
      const over = (e.target as Element | null)?.closest?.(INTERACTIVE);
      el.dataset.over = over ? "true" : "false";
      target = over ? 1.7 : 1;
      wake();
    };
    const onDown = () => {
      target = el.dataset.over === "true" ? 1.4 : 0.8;
      wake();
    };
    const onUp = () => {
      target = el.dataset.over === "true" ? 1.7 : 1;
      wake();
    };
    const onLeave = () => {
      shown = false;
      el.dataset.shown = "false";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [off]);

  if (off) return null;
  return <div ref={ring} className={styles.ring} data-shown="false" aria-hidden="true" />;
}
