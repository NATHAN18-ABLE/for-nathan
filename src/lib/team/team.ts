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
}

const KGU: Text = { en: "Kyonggi University", ko: "경기대학교" };

export const TEAM: Member[] = [
  { slug: "kim-wonjun", name: { en: "Kim Wonjun", ko: "김원준" }, given: "원준", school: KGU },
  { slug: "kim-garam", name: { en: "Kim Garam", ko: "김가람" }, given: "가람", school: KGU },
  { slug: "kim-isak", name: { en: "Kim Isak", ko: "김이삭" }, given: "이삭", school: KGU },
  { slug: "kim-jimin", name: { en: "Kim Jimin", ko: "김지민" }, given: "지민", school: KGU },
  { slug: "lee-junseok", name: { en: "Lee Junseok", ko: "이준석" }, given: "준석", school: KGU },
  { slug: "hong-haneul", name: { en: "Hong Haneul", ko: "홍하늘" }, given: "하늘", school: KGU },
];
