"use client";

/**
 * Chat translation with the browser's own on-device translator (Chrome's Translator API).
 * Nothing leaves the device and it costs nothing; browsers without it just show the original.
 * A paid translation service could slot in here later for full coverage.
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

export const canTranslate = () => typeof api()?.create === "function";

export async function translate(text: string, from: string | null, to: string): Promise<string | null> {
  const T = api();
  if (!T || !from || from === to) return null;
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
