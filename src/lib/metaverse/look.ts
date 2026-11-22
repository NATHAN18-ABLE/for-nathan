// What a traveler wears on top of the base figure. Items are drawn in code and pinned to
// bones; one item per body spot.

export const ITEMS = [
  { id: "lantern", slot: "hand", en: "Cheongsachorong lantern", ko: "청사초롱" },
  { id: "fan", slot: "hand", en: "Taegeuk fan", ko: "태극선 부채" },
  { id: "norigae", slot: "hip", en: "Norigae tassel", ko: "노리개" },
  { id: "pouch", slot: "hip", en: "Lucky pouch", ko: "복주머니" },
  { id: "scarf", slot: "neck", en: "Autumn scarf", ko: "가을 목도리" },
  { id: "flower", slot: "head", en: "Flower pin", ko: "꽃 핀" },
  { id: "maple", slot: "head", en: "Maple leaf pin", ko: "단풍잎 핀" },
] as const;

export type ItemId = (typeof ITEMS)[number]["id"];
export const SCARF_COLORS = ["#c0463c", "#e1a23b", "#5f8f74", "#3e5aa8", "#efe6d4"] as const;

export interface Look {
  items: ItemId[];
  scarf: number;
}

export const defaultLook = (): Look => ({ items: [], scarf: 0 });

export function toggleItem(look: Look, id: ItemId): Look {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) return look;
  if (look.items.includes(id)) return { ...look, items: look.items.filter((x) => x !== id) };
  const others = look.items.filter((x) => ITEMS.find((i) => i.id === x)?.slot !== item.slot);
  return { ...look, items: [...others, id] };
}

/** Accept only known items, one per spot, and a valid scarf colour. */
export function sanitizeLook(raw: unknown): Look {
  const r = (raw ?? {}) as { items?: unknown; scarf?: unknown };
  let look = defaultLook();
  if (Array.isArray(r.items)) {
    for (const id of r.items) {
      if (typeof id !== "string" || !ITEMS.some((i) => i.id === id) || look.items.includes(id as ItemId)) continue;
      const slot = ITEMS.find((i) => i.id === id)!.slot;
      if (look.items.some((x) => ITEMS.find((i) => i.id === x)!.slot === slot)) continue;
      look = { ...look, items: [...look.items, id as ItemId] };
    }
  }
  const s = typeof r.scarf === "number" && Number.isInteger(r.scarf) && r.scarf >= 0 && r.scarf < SCARF_COLORS.length ? r.scarf : 0;
  return { ...look, scarf: s };
}
