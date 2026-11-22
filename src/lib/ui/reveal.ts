"use client";

import { useEffect } from "react";

/**
 * Scenes below the fold rise in gently the first time they scroll into view. Everything is
 * visible by default; only once this runs are not-yet-seen blocks set aside, and each is let
 * in when 15% of it is on screen. Skipped entirely for reduced motion.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const below = els.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    below.forEach((el) => (el.dataset.reveal = "pending"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15 },
    );
    below.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
