"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./hero/copy.ts";

const KEY = "seoul.lang";

// Shared language choice, remembered per browser.
export function useLang(): [Lang, (next: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    // A shared link can carry ?lang=ko or ?lang=en; it wins over what this browser remembered.
    const asked = new URLSearchParams(window.location.search).get("lang");
    if (asked === "en" || asked === "ko") {
      setLang(asked);
      try {
        localStorage.setItem(KEY, asked);
      } catch {}
      return;
    }
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "ko") setLang(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const choose = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  };

  return [lang, choose];
}
