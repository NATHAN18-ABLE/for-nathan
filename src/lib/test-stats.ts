import { SUPABASE_KEY, SUPABASE_URL } from "./supabase-config.ts";

// Anonymous test statistics (table public.test_results, function public.test_stats()).
// A finished test adds one row: the type, the two districts, the twelve answers, the language
// and the kind of device. Nothing that identifies a person.

export interface TestRecord {
  type_code: string;
  best: string;
  runner_up: string;
  answers: string; // "abba..." one letter a question
  lang: "en" | "ko";
  device: "phone" | "tablet" | "desktop";
}

export interface TestStats {
  total: number;
  today: number;
  types: { code: string; n: number }[];
  districts: { slug: string; n: number }[];
  days: { day: string; n: number }[];
  langs: Partial<Record<"en" | "ko", number>>;
  devices: Partial<Record<"phone" | "tablet" | "desktop", number>>;
  questions: { i: number; a: number; b: number }[];
}

const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };

export function deviceKind(): TestRecord["device"] {
  if (typeof window === "undefined" || !matchMedia("(pointer: coarse)").matches) return "desktop";
  return Math.min(innerWidth, innerHeight) < 600 ? "phone" : "tablet";
}

const SAVED = "seoul.result.saved";
/**
 * Adds a finished test once: seeing the same result again (a reload, coming back to it in the
 * same visit) does not count twice. A failed request is let go; the visitor never waits on it.
 */
export function saveResult(r: TestRecord) {
  try {
    if (sessionStorage.getItem(SAVED) === r.answers) return;
    sessionStorage.setItem(SAVED, r.answers);
  } catch {}
  fetch(`${SUPABASE_URL}/rest/v1/test_results`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(r),
    keepalive: true,
  }).catch(() => {});
}

export async function loadStats(): Promise<TestStats> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/test_stats`, { method: "POST", headers, body: "{}", cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
