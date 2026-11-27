import { cleanChat } from "./chat.ts";

// A friendly name from an id, the same on every screen. No personal data is asked for.
export function autoName(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return `Traveler ${((h >>> 0) % 99) + 1}`;
}

export const MAX_NAME = 12;
export const NAME_KEY = "seoul.mv.name";

/**
 * A name a traveler chose, as others will see it: one line, at most MAX_NAME characters, no
 * links, numbers that look like phones, or swear words. null when nothing usable is left, so
 * the caller falls back to autoName. Used when saving and again on every name received.
 */
export function cleanName(raw: unknown): string | null {
  const s = cleanChat(raw);
  if (!s) return null;
  // the chat cleaner masks rather than drops; a name with anything masked is refused whole
  if (/\*|\[link\]|\[number\]/.test(s)) return null;
  const name = [...s].slice(0, MAX_NAME).join("").trim();
  return name || null;
}

/** The name saved on this device, or null when none was chosen. */
export function savedName(): string | null {
  try {
    return cleanName(localStorage.getItem(NAME_KEY));
  } catch {
    return null;
  }
}
