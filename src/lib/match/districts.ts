import type { Scores } from "./match.ts";

export interface District {
  slug: string;
  nameEn: string;
  nameKo: string;
  // -2..2 on each axis: time H(-)/T(+), stage A(-)/O(+), mood C(-)/B(+), pace L(-)/F(+).
  profile: Scores;
  line: string;
}

export const DISTRICTS: District[] = [
  { slug: "jongno", nameEn: "Jongno", nameKo: "종로구", profile: { time: -1.6, stage: -1.0, mood: -0.8, pace: -1.2 }, line: "Hanok alleys and craft workshops, a district to linger in" },
  { slug: "jung", nameEn: "Jung", nameKo: "중구", profile: { time: -1.0, stage: -1.4, mood: 1.4, pace: 0.8 }, line: "Old printing alleys and decades-old eateries, Euljiro after dark" },
  { slug: "dongdaemun", nameEn: "Dongdaemun", nameKo: "동대문구", profile: { time: -1.6, stage: -1.2, mood: 0.8, pace: -0.6 }, line: "Herbal medicine and fruit markets, everyday market life" },
  { slug: "seodaemun", nameEn: "Seodaemun", nameKo: "서대문구", profile: { time: -0.8, stage: 0.8, mood: -1.2, pace: -0.6 }, line: "Mountain-side trails, old markets and modern history" },
  { slug: "nowon", nameEn: "Nowon", nameKo: "노원구", profile: { time: -0.4, stage: 1.6, mood: -1.4, pace: -1.2 }, line: "A forest path on an old railway, mountains and neighborhood life" },
  { slug: "songpa", nameEn: "Songpa", nameKo: "송파구", profile: { time: -1.0, stage: 1.2, mood: -0.4, pace: 0.8 }, line: "Baekje-era earthen walls and wide parks" },
  { slug: "yongsan", nameEn: "Yongsan", nameKo: "용산구", profile: { time: 0.8, stage: -0.6, mood: 1.4, pace: 1.0 }, line: "Hillside alleys and tables from many countries" },
  { slug: "mapo", nameEn: "Mapo", nameKo: "마포구", profile: { time: 1.0, stage: -0.8, mood: 0.8, pace: -1.0 }, line: "Neighborhood markets, indie culture and the Han River" },
  { slug: "seongdong", nameEn: "Seongdong", nameKo: "성동구", profile: { time: 1.6, stage: -1.0, mood: -0.4, pace: 0.8 }, line: "Handmade-shoe workshops and factories turned into new spaces" },
  { slug: "yeongdeungpo", nameEn: "Yeongdeungpo", nameKo: "영등포구", profile: { time: 0.6, stage: -1.2, mood: -0.2, pace: -0.4 }, line: "Art among metal workshops and a Korean-Chinese neighborhood" },
  { slug: "gwanak", nameEn: "Gwanak", nameKo: "관악구", profile: { time: 0.6, stage: 1.4, mood: 1.2, pace: 1.0 }, line: "A mountain, a university town and cheap, lively food" },
  { slug: "gangnam", nameEn: "Gangnam", nameKo: "강남구", profile: { time: 1.6, stage: 0.6, mood: -0.6, pace: 1.4 }, line: "Royal tombs in the city, stream walks and polished Seoul" },
];
