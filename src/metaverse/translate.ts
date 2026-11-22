"use client";

import { plausibleTranslation } from "@/lib/metaverse/chat.ts";

/**
 * Chat translation. First the browser's own on-device translator (Chrome's Translator API):
 * nothing leaves the device. Where there is none (most phones), the free MyMemory service
 * (no key; about 5,000 characters a day for each device). If that fails or its daily allowance
 * is used up, the original message simply stays as it is.
 */

interface TranslatorLike {
  translate(text: string): Promise<string>;
}
interface TranslatorApi {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(o: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorLike>;
}

const api = () => (globalThis as unknown as { Translator?: TranslatorApi }).Translator;
const ready = new Map<string, Promise<TranslatorLike | null>>();

export const canTranslate = () => true;

export async function translate(text: string, from: string | null, to: string): Promise<string | null> {
  if (!from || from === to) return null;
  const local = await onDevice(text, from, to);
  if (local && plausibleTranslation(local, text, to)) return local;
  return online(text, from, to);
}

const MYMEMORY = "https://api.mymemory.translated.net/get";
const done = new Map<string, string | null>();
const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#039;": "'" };

async function online(text: string, from: string, to: string): Promise<string | null> {
  const key = `${from}|${to}|${text}`;
  if (done.has(key)) return done.get(key)!;
  const code = (l: string) => (l === "zh" ? "zh-CN" : l);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(`${MYMEMORY}?q=${encodeURIComponent(text)}&langpair=${code(from)}|${code(to)}`, { signal: ctrl.signal });
    if (!r.ok) return null;
    type Match = { translation?: unknown; quality?: unknown; match?: unknown; "created-by"?: unknown };
    const data = (await r.json()) as { responseStatus?: number | string; responseData?: { translatedText?: unknown }; matches?: Match[] };
    if (Number(data.responseStatus) !== 200) return null;
    // MyMemory mixes machine translation with a shared memory that people add to, which now and
    // then holds junk (English typed on a Korean keyboard, say). Prefer the machine translation,
    // then the best-rated memory entries, and keep the first that looks like a real translation.
    const matches = Array.isArray(data.matches) ? data.matches : [];
    const score = (m: Match) => (String(m["created-by"]).startsWith("MT") ? 2 : 0) + Number(m.match ?? 0) + Number(m.quality ?? 0) / 100;
    const candidates = [...[...matches].sort((a, b) => score(b) - score(a)).map((m) => m.translation), data.responseData?.translatedText];
    const decode = (v: string) => v.replace(/&(amp|lt|gt|quot|#0?39);/g, (m) => entities[m] ?? m).trim();
    const out = candidates
      .filter((c): c is string => typeof c === "string")
      .map(decode)
      // Warnings come back in place of a translation when the allowance is used up.
      .find((c) => !/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(c) && plausibleTranslation(c, text, to));
    if (!out) return null;
    if (done.size > 300) done.clear();
    done.set(key, out);
    return out;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function onDevice(text: string, from: string, to: string): Promise<string | null> {
  const T = api();
  if (!T) return null;
  const key = `${from}>${to}`;
  if (!ready.has(key))
    ready.set(
      key,
      (async () => {
        try {
          if ((await T.availability({ sourceLanguage: from, targetLanguage: to })) === "unavailable") return null;
          return await T.create({ sourceLanguage: from, targetLanguage: to });
        } catch {
          return null;
        }
      })(),
    );
  const tr = await ready.get(key)!;
  if (!tr) {
    ready.delete(key); // try again later, e.g. after a tap allows the model to download
    return null;
  }
  try {
    const out = (await tr.translate(text)).trim();
    return out && out !== text ? out : null;
  } catch {
    return null;
  }
}
