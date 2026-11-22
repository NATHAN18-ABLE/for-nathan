// The traveler's wardrobe: what a player can choose in the fitting room. Plain data, so it can be
// saved, sent to other players and checked on arrival.

export type Gender = "f" | "m";
export type OutfitId = "chima" | "dress" | "baji" | "durumagi" | "hoodie";
export type HairId = "bun" | "braid" | "bob" | "short" | "mop";

/** Colours a figure is painted with. */
export interface Palette {
  skin: string;
  hair: string;
  top: string; // jeogori, coat, dress or hoodie
  bottom: string; // chima, baji or trousers
  accent: string; // goreum and sleeve ends, vest, soles
  trim: string; // collar band, buttons
  shoes: string;
}

type Colors = Omit<Palette, "skin" | "hair">;
interface Colorway {
  en: string;
  ko: string;
  colors: Colors;
}
interface OutfitDef {
  id: OutfitId;
  en: string;
  ko: string;
  genders: Gender[];
  hanbok: boolean;
  colorways: Colorway[];
}

export const OUTFITS: OutfitDef[] = [
  {
    id: "chima",
    en: "Hanbok, skirt",
    ko: "치마저고리",
    genders: ["f"],
    hanbok: true,
    colorways: [
      { en: "Rose and indigo", ko: "분홍과 쪽빛", colors: { top: "#f7d5d8", bottom: "#4462b0", accent: "#d4475b", trim: "#d4475b", shoes: "#f4c9d0" } },
      { en: "Yellow and crimson", ko: "노랑과 다홍", colors: { top: "#f7df86", bottom: "#c63f4a", accent: "#8c2f55", trim: "#8c2f55", shoes: "#f3d3da" } },
      { en: "Leaf green and plum", ko: "연두와 자주", colors: { top: "#d3e6ab", bottom: "#7a3b6b", accent: "#d4475b", trim: "#7a3b6b", shoes: "#efe2c8" } },
    ],
  },
  {
    id: "dress",
    en: "Dress",
    ko: "원피스",
    genders: ["f"],
    hanbok: false,
    colorways: [
      { en: "Sky", ko: "하늘색", colors: { top: "#a7c9ea", bottom: "#a7c9ea", accent: "#3e5aa8", trim: "#fdfaf3", shoes: "#8a3b3b" } },
      { en: "Lemon", ko: "레몬색", colors: { top: "#f5dc78", bottom: "#f5dc78", accent: "#e0794f", trim: "#fdfaf3", shoes: "#5a3b2e" } },
      { en: "Lavender", ko: "라벤더", colors: { top: "#c9b8e8", bottom: "#c9b8e8", accent: "#7a5aa8", trim: "#fdfaf3", shoes: "#3a3346" } },
    ],
  },
  {
    id: "baji",
    en: "Hanbok, trousers",
    ko: "바지저고리",
    genders: ["m"],
    hanbok: true,
    colorways: [
      { en: "Cream and indigo vest", ko: "미색과 쪽빛 조끼", colors: { top: "#f7f0e2", bottom: "#5d8b70", accent: "#2f4270", trim: "#d9a843", shoes: "#463935" } },
      { en: "White and chestnut vest", ko: "흰색과 밤색 조끼", colors: { top: "#fbf8f1", bottom: "#8494a6", accent: "#6b4030", trim: "#d9a843", shoes: "#3b3330" } },
      { en: "Sky and plum vest", ko: "하늘색과 자주 조끼", colors: { top: "#d2e3f1", bottom: "#2f3f6e", accent: "#7a3b6b", trim: "#e8c26a", shoes: "#2f2a2a" } },
    ],
  },
  {
    id: "durumagi",
    en: "Hanbok, long coat",
    ko: "두루마기",
    genders: ["m"],
    hanbok: true,
    colorways: [
      { en: "Jade", ko: "옥색", colors: { top: "#bfe0d4", bottom: "#f7f2e6", accent: "#2f4270", trim: "#5e8f84", shoes: "#3b3330" } },
      { en: "Indigo", ko: "쪽빛", colors: { top: "#4664ad", bottom: "#f7f2e6", accent: "#f7f2e6", trim: "#2f4270", shoes: "#2f2a2a" } },
      { en: "Ink grey", ko: "먹색", colors: { top: "#545a66", bottom: "#ece6d8", accent: "#c63f4a", trim: "#3a3f49", shoes: "#2a2626" } },
    ],
  },
  {
    id: "hoodie",
    en: "Hoodie",
    ko: "후드티",
    genders: ["f", "m"],
    hanbok: false,
    colorways: [
      { en: "Mustard", ko: "겨자색", colors: { top: "#f1b546", bottom: "#3b4459", accent: "#e8665b", trim: "#f6f1e7", shoes: "#f8f4ec" } },
      { en: "Sky", ko: "하늘색", colors: { top: "#9fc6e8", bottom: "#5a5f6b", accent: "#3e5aa8", trim: "#f6f1e7", shoes: "#f8f4ec" } },
      { en: "Pink", ko: "분홍색", colors: { top: "#f2b9c7", bottom: "#3b4459", accent: "#d4475b", trim: "#f6f1e7", shoes: "#f8f4ec" } },
    ],
  },
];

export const HAIRS: { id: HairId; en: string; ko: string; genders: Gender[] }[] = [
  { id: "bun", en: "Low bun", ko: "쪽머리", genders: ["f"] },
  { id: "braid", en: "Ribboned braid", ko: "댕기머리", genders: ["f"] },
  { id: "bob", en: "Bob", ko: "단발", genders: ["f"] },
  { id: "short", en: "Short", ko: "짧은 머리", genders: ["m"] },
  { id: "mop", en: "Mop top", ko: "덮은 머리", genders: ["m"] },
];

export const SKINS = ["#f8dfcc", "#efc7a8", "#d6a07a", "#9c6a4c"] as const;
export const HAIR_COLORS = [
  { hex: "#2f2421", en: "Black", ko: "검정" },
  { hex: "#4d3427", en: "Dark brown", ko: "흑갈색" },
  { hex: "#7d5036", en: "Brown", ko: "갈색" },
] as const;

export interface Avatar {
  gender: Gender;
  outfit: OutfitId;
  colorway: number;
  hair: HairId;
  hairColor: number;
  skin: number;
}

export const defaultAvatar = (gender: Gender): Avatar =>
  gender === "f"
    ? { gender, outfit: "chima", colorway: 0, hair: "bun", hairColor: 0, skin: 0 }
    : { gender, outfit: "baji", colorway: 0, hair: "short", hairColor: 0, skin: 0 };

export const outfitsFor = (g: Gender) => OUTFITS.filter((o) => o.genders.includes(g));
export const hairsFor = (g: Gender) => HAIRS.filter((h) => h.genders.includes(g));

/** Change gender, keeping what still fits and swapping what does not. */
export function withGender(a: Avatar, gender: Gender): Avatar {
  const base = defaultAvatar(gender);
  const keepOutfit = OUTFITS.find((o) => o.id === a.outfit)?.genders.includes(gender);
  const keepHair = HAIRS.find((h) => h.id === a.hair)?.genders.includes(gender);
  return {
    ...a,
    gender,
    outfit: keepOutfit ? a.outfit : base.outfit,
    colorway: keepOutfit ? a.colorway : 0,
    hair: keepHair ? a.hair : base.hair,
  };
}

const index = (v: unknown, n: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < n ? v : 0);

/** Accept only known choices that fit together; anything else falls back to a default. */
export function sanitizeAvatar(raw: unknown): Avatar {
  const r = (raw ?? {}) as Record<string, unknown>;
  const gender: Gender = r.gender === "m" ? "m" : "f";
  const base = defaultAvatar(gender);
  const outfit = outfitsFor(gender).find((o) => o.id === r.outfit) ?? outfitsFor(gender).find((o) => o.id === base.outfit)!;
  const hair = hairsFor(gender).find((h) => h.id === r.hair)?.id ?? base.hair;
  return {
    gender,
    outfit: outfit.id,
    colorway: index(r.colorway, outfit.colorways.length),
    hair,
    hairColor: index(r.hairColor, HAIR_COLORS.length),
    skin: index(r.skin, SKINS.length),
  };
}

export function paletteOf(a: Avatar): Palette {
  const o = OUTFITS.find((x) => x.id === a.outfit) ?? OUTFITS[0];
  const c = o.colorways[a.colorway] ?? o.colorways[0];
  return { skin: SKINS[a.skin] ?? SKINS[0], hair: HAIR_COLORS[a.hairColor]?.hex ?? HAIR_COLORS[0].hex, ...c.colors };
}
