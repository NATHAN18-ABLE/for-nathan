"use client";

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
  return (await onDevice(text, from, to)) ?? (await online(text, from, to));
}

const MYMEMORY = "https://api.mymemory.translated.net/get";
const done = new Map<string, string | null>();
const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#039;": "'" };

async function online(text: string, from: string, to: string): Promise<string | null> {
  const key = `${from}|${to}|${text}`;
  if (done.has(key)) return done.get(key)!;
  const code = (l: string) => (l === "zh" ? "zh-CN" : l);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(`${MYMEMORY}?q=${encodeURIComponent(text)}&langpair=${code(from)}|${code(to)}`, { signal: ctrl.signal });
    if (!r.ok) return null;
    const data = (await r.json()) as { responseStatus?: number | string; responseData?: { translatedText?: unknown } };
    const raw = data.responseData?.translatedText;
    if (Number(data.responseStatus) !== 200 || typeof raw !== "string") return null;
    const out = raw.replace(/&(amp|lt|gt|quot|#0?39);/g, (m) => entities[m] ?? m).trim();
    // Warnings come back in place of a translation when the allowance is used up.
    if (!out || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(out) || out === text) return null;
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
