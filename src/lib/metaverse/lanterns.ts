// Wish lanterns hung on the wall in a room. Ids and colours match the database checks
// (supabase migration "wish_lanterns").

export const WISHES = [
  { id: "health", en: "Good health", ko: "건강" },
  { id: "journey", en: "A safe journey", ko: "무사한 여행" },
  { id: "love", en: "Love", ko: "사랑" },
  { id: "family", en: "My family", ko: "가족" },
  { id: "dream", en: "A dream come true", ko: "꿈을 이루기" },
  { id: "peace", en: "Peace of mind", ko: "마음의 평화" },
] as const;

export type WishId = (typeof WISHES)[number]["id"];

// Paper colours: red, gold, celadon, cobalt, white.
export const LANTERN_COLORS = ["#d9534a", "#e8b94a", "#8fc1a8", "#5a78c8", "#f4efe4"] as const;

/** The rack along the Jongmyo wall: rows of ropes strung between three posts. */
export const RACK = { x: 19.05, z0: -7.6, z1: 13.6, rows: 3, perRow: 22, yTop: 2.6, rowGap: 0.62, posts: [-8, 3, 14], sag: 0.32 };

/** Height of a rope row at z: highest at the posts, lowest mid-span. */
export function ropeY(row: number, z: number) {
  const top = RACK.yTop - row * RACK.rowGap;
  const p = RACK.posts;
  for (let i = 1; i < p.length; i++) {
    if (z <= p[i] + 1e-9) {
      const t = Math.min(1, Math.max(0, (z - p[i - 1]) / (p[i] - p[i - 1])));
      return top - RACK.sag * 4 * t * (1 - t);
    }
  }
  return top;
}

/** Where the i-th lantern hangs. Past the last slot, the oldest spot is reused. */
export function lanternSpot(i: number) {
  const n = RACK.rows * RACK.perRow;
  const k = ((i % n) + n) % n;
  const row = Math.floor(k / RACK.perRow);
  // Fill from the middle of the rack outward, so the first lanterns are where people stand.
  const j = k % RACK.perRow;
  const mid = Math.floor((RACK.perRow - 1) / 2);
  const col = j === 0 ? mid : j % 2 ? mid + (j + 1) / 2 : mid - j / 2;
  const step = (RACK.z1 - RACK.z0) / (RACK.perRow - 1);
  // Alternate rows sit half a step over, like lanterns on a festival rope.
  const z = Math.min(RACK.z1, RACK.z0 + col * step + (row % 2 ? step / 2 : 0));
  return { x: RACK.x, y: ropeY(row, z) - 0.3, z };
}
