import type { Lang } from "../hero/copy.ts";

// Messages travel as ids, so each reader sees them in their own language.
export const PHRASES = [
  { id: "hello", en: "Hello!", ko: "안녕하세요!" },
  { id: "nice", en: "Nice to meet you!", ko: "반가워요!" },
  { id: "type", en: "What's your travel type?", ko: "여행 유형이 뭐예요?" },
  { id: "where", en: "Where are you from?", ko: "어디에서 왔어요?" },
  { id: "follow", en: "Follow me!", ko: "따라오세요!" },
  { id: "photo", en: "Photo here?", ko: "여기서 사진 찍을까요?" },
  { id: "love", en: "I love this street.", ko: "이 골목 정말 좋아요." },
  { id: "bye", en: "See you in Seoul!", ko: "서울에서 만나요!" },
] as const;

export type PhraseId = (typeof PHRASES)[number]["id"];

export function phraseText(id: string, lang: Lang): string | null {
  const p = PHRASES.find((x) => x.id === id);
  return p ? p[lang] : null;
}

export const EMOTES = [
  { id: "wave", en: "Wave", ko: "손 흔들기" },
  { id: "bow", en: "Bow", ko: "인사" },
  { id: "hop", en: "Hop", ko: "폴짝" },
  { id: "jegi", en: "Jegichagi", ko: "제기차기" },
  { id: "sit", en: "Sit", ko: "앉기" },
] as const;

export type EmoteId = (typeof EMOTES)[number]["id"];
