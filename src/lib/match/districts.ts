import type { Scores, Text } from "./match.ts";

export interface District {
  slug: string;
  nameEn: string;
  nameKo: string;
  // -2..2 on each axis: time H(-)/T(+), stage A(-)/O(+), mood C(-)/B(+), pace L(-)/F(+).
  // Tuned so each district is the best match for about one answer set in twelve (8.2–8.5%).
  profile: Scores;
  line: Text;
}

export const DISTRICTS: District[] = [
  { slug: "jongno", nameEn: "Jongno", nameKo: "종로구", profile: { time: -1.1, stage: -0.8, mood: -0.8, pace: -1.1 }, line: { en: "Hanok alleys and craft workshops, a district to linger in", ko: "한옥 골목과 공방, 오래 머물고 싶은 동네" } },
  { slug: "jung", nameEn: "Jung", nameKo: "중구", profile: { time: -0.8, stage: -1.4, mood: 1.3, pace: 0.8 }, line: { en: "Old printing alleys and decades-old eateries, Euljiro after dark", ko: "오래된 인쇄 골목과 노포, 그리고 밤의 을지로" } },
  { slug: "dongdaemun", nameEn: "Dongdaemun", nameKo: "동대문구", profile: { time: -1.6, stage: -1.1, mood: 0.9, pace: -0.6 }, line: { en: "Herbal medicine and fruit markets, everyday market life", ko: "약령시장과 청과시장, 시장 사람들의 하루" } },
  { slug: "seodaemun", nameEn: "Seodaemun", nameKo: "서대문구", profile: { time: -0.9, stage: 1.1, mood: -1.4, pace: -0.6 }, line: { en: "Mountain-side trails, old markets and modern history", ko: "산자락 산책길과 오래된 시장, 그리고 근현대사" } },
  { slug: "nowon", nameEn: "Nowon", nameKo: "노원구", profile: { time: -0.4, stage: 1.4, mood: -1.4, pace: -1.1 }, line: { en: "A forest path on an old railway, mountains and neighborhood life", ko: "옛 철길 위의 숲길과 산, 동네의 일상" } },
  { slug: "songpa", nameEn: "Songpa", nameKo: "송파구", profile: { time: -1.3, stage: 1.4, mood: -0.6, pace: 0.8 }, line: { en: "Baekje-era earthen walls and wide parks", ko: "백제의 토성과 넓은 공원" } },
  { slug: "yongsan", nameEn: "Yongsan", nameKo: "용산구", profile: { time: 1.0, stage: -0.7, mood: 1.5, pace: 0.9 }, line: { en: "Hillside alleys and tables from many countries", ko: "언덕 위 골목과 여러 나라의 식탁" } },
  { slug: "mapo", nameEn: "Mapo", nameKo: "마포구", profile: { time: 1.0, stage: -0.9, mood: 0.9, pace: -1.2 }, line: { en: "Neighborhood markets, indie culture and the Han River", ko: "동네 시장과 인디 문화, 그리고 한강" } },
  { slug: "seongdong", nameEn: "Seongdong", nameKo: "성동구", profile: { time: 1.5, stage: -1.0, mood: -0.4, pace: 0.4 }, line: { en: "Handmade-shoe workshops and factories turned into new spaces", ko: "수제화 공방과 새 공간이 된 옛 공장" } },
  { slug: "yeongdeungpo", nameEn: "Yeongdeungpo", nameKo: "영등포구", profile: { time: 0.6, stage: -1.2, mood: -0.7, pace: -0.7 }, line: { en: "Art among metal workshops and a Korean-Chinese neighborhood", ko: "철공소 사이의 예술, 그리고 중국 동포들의 동네" } },
  { slug: "gwanak", nameEn: "Gwanak", nameKo: "관악구", profile: { time: 0.4, stage: 1.3, mood: 1.1, pace: 0.9 }, line: { en: "A mountain, a university town and cheap, lively food", ko: "산과 대학가, 저렴하고 활기찬 먹거리" } },
  { slug: "gangnam", nameEn: "Gangnam", nameKo: "강남구", profile: { time: 1.6, stage: 0.7, mood: -0.6, pace: 1.6 }, line: { en: "Royal tombs in the city, stream walks and polished Seoul", ko: "도심 속 왕릉과 하천 산책길, 세련된 서울" } },
];
