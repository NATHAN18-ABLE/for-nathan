import type { Text } from "../match/match.ts";

export interface Member {
  slug: string;
  name: Text;
  // Shown large in the empty photo frame until a photo arrives.
  given: string;
  school: Text;
  // Add later: a photo at public/team/<slug>.jpg (portrait, 4:5), then set photo: "/team/<slug>.jpg".
  photo?: string;
  role?: Text;
  bio?: Text;
  // A line they live by, shown under the intro with who said it.
  quote?: { text: Text; by: Text };
}

const KGU: Text = { en: "Kyonggi University", ko: "경기대학교" };

export const TEAM: Member[] = [
  {
    slug: "kim-wonjun",
    name: { en: "Kim Wonjun", ko: "김원준" },
    given: "원준",
    school: KGU,
    photo: "/team/kim-wonjun.jpg",
    bio: {
      ko: "경영학을 전공했고, 영상과 AI를 공부하고 있어요.",
      en: "I studied business administration, and I am now learning video and AI.",
    },
    quote: {
      text: {
        // \u2028 marks where a narrow card may break the line, besides the comma
        ko: "진정한 발견은\u2028새로운 풍경을\u2028찾는 데 있지 않고,\u2028새로운 눈을\u2028갖는 데 있다.",
        en: "The real voyage\u2028of discovery\u2028consists not\u2028in seeking\u2028new landscapes,\u2028but in having new eyes.",
      },
      by: { ko: "마르셀 프루스트", en: "Marcel Proust" },
    },
  },
  { slug: "kim-garam", name: { en: "Kim Garam", ko: "김가람" }, given: "가람", school: KGU },
  { slug: "kim-isak", name: { en: "Kim Isak", ko: "김이삭" }, given: "이삭", school: KGU },
  { slug: "kim-jimin", name: { en: "Kim Jimin", ko: "김지민" }, given: "지민", school: KGU },
  { slug: "lee-junseok", name: { en: "Lee Junseok", ko: "이준석" }, given: "준석", school: KGU },
  { slug: "hong-haneul", name: { en: "Hong Haneul", ko: "홍하늘" }, given: "하늘", school: KGU },
];
