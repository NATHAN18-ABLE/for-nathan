"use client";

import { useEffect } from "react";
import { BUILD } from "@/lib/build.ts";
import { asset } from "@/lib/base-path.ts";

// A page left open keeps running the version it was loaded with. This checks the live
// version now and then (on return to the tab, and every ten minutes); once a newer one is out,
// the next link the visitor follows loads that page fresh, so they move onto the new version
// at a natural moment instead of having the page reload under them.
const EVERY_MS = 10 * 60 * 1000;

export function UpdateWatcher() {
  useEffect(() => {
    if (BUILD === "dev") return; // local builds have no version to compare
    let stale = false;
    let last = 0;
    const check = async () => {
      if (stale || document.visibilityState !== "visible" || Date.now() - last < 60_000) return;
      last = Date.now();
      try {
        const res = await fetch(asset("/version.txt"), { cache: "no-store" });
        if (!res.ok) return;
        const live = (await res.text()).trim();
        if (live && live !== BUILD) stale = true;
      } catch {}
    };
    const onClick = (e: MouseEvent) => {
      if (!stale || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      location.assign(url.href); // a full load picks up the new version
    };
    const onShow = () => void check();
    check();
    const id = setInterval(check, EVERY_MS);
    document.addEventListener("visibilitychange", onShow);
    document.addEventListener("click", onClick, true);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onShow);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
