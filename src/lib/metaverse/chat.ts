// Free typing in the metaverse. Every message, sent or received, goes through cleanChat:
// short, single-line, no links or phone numbers, swear words masked. Anyone can send anything
// to a public channel, so the receiving side cleans too.

export const MAX_CHAT = 80;

// Common swear words in Korean and English. Letters may be split by spaces or symbols ("씨.발").
const KO = ["씨발", "시발", "씨바", "ㅅㅂ", "ㅆㅂ", "병신", "ㅂㅅ", "개새끼", "개새", "좆", "존나", "지랄", "미친놈", "미친년", "썅", "느금마", "니애미", "엿먹어"];
const EN = ["fuck", "fucking", "motherfucker", "shit", "bitch", "bastard", "asshole", "dick", "cunt", "slut", "whore", "nigger", "nigga", "faggot", "retard"];

const gap = "[\\s._\\-*~!·]*";
const spread = (w: string) => [...w].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(gap);
// English words only match whole words, so "Scunthorpe" is left alone.
const SWEAR = new RegExp(`(${KO.map(spread).join("|")})|\\b(${EN.map(spread).join("|")})\\b`, "gi");

const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w-]+\.[\w.]+\b|\b[\w-]+\.(?:com|net|org|kr|io|me|co|ly|gg|xyz|link|site|app)\b(?:\/\S*)?/gi;
const PHONE = /(?:\+?\d[\s-]?){8,}\d/g;

// Control characters and invisible marks (zero-width spaces, direction overrides), written as
// code points so the source stays plain ASCII.
const RANGES: [number, number][] = [[0x00, 0x1f], [0x7f, 0x7f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]];
const INVISIBLE = new RegExp(`[${RANGES.map(([a, b]) => `${String.fromCharCode(a)}-${String.fromCharCode(b)}`).join("")}]`, "g");

export function cleanChat(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw
    .replace(INVISIBLE, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;
  s = s.slice(0, MAX_CHAT * 2);
  s = s.replace(LINK, "[link]").replace(PHONE, "[number]");
  s = s.replace(SWEAR, (m) => "*".repeat(m.replace(/[\s._\-*~!·]/g, "").length));
  s = s.slice(0, MAX_CHAT).trim();
  return s || null;
}

/** The language a message is written in, from the letters it uses; null when it has none. */
export function guessLang(text: string): "ko" | "ja" | "zh" | "en" | null {
  if (/[가-힯㄰-㆏]/.test(text)) return "ko";
  if (/[぀-ヿ]/.test(text)) return "ja";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[a-z]/i.test(text)) return "en";
  return null;
}

/** At most one message every 1.2 seconds and five in any ten seconds. */
export class RateLimit {
  private sent: number[] = [];
  take(now: number): boolean {
    this.sent = this.sent.filter((t) => now - t < 10000);
    const last = this.sent[this.sent.length - 1];
    if ((last !== undefined && now - last < 1200) || this.sent.length >= 5) return false;
    this.sent.push(now);
    return true;
  }
}
