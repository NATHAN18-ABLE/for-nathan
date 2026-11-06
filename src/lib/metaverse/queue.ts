import { AXES } from "../match/match.ts";
import { DISTRICTS } from "../match/districts.ts";

export const CAPACITY = 10;
export const IDLE_MS = 120_000;
// Districts with a metaverse room. Add a slug here once its scene exists.
export const ROOMS = ["jongno", "dongdaemun", "mapo", "seongdong", "yongsan"];

export interface Member {
  id: string;
  joinedAt: number;
}

export type Status = { state: "in" } | { state: "waiting"; position: number } | { state: "absent" };

// Every client runs this on the same presence list, so all screens agree on who is in.
export function seatMembers(members: Member[], capacity = CAPACITY) {
  const ids = [...members]
    .sort((a, b) => a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((m) => m.id);
  return { inRoom: ids.slice(0, capacity), waiting: ids.slice(capacity) };
}

export function statusOf(id: string, members: Member[], capacity = CAPACITY): Status {
  const { inRoom, waiting } = seatMembers(members, capacity);
  if (inRoom.includes(id)) return { state: "in" };
  const i = waiting.indexOf(id);
  return i >= 0 ? { state: "waiting", position: i + 1 } : { state: "absent" };
}

export function isIdle(lastInputAt: number, now: number, limit = IDLE_MS): boolean {
  return now - lastInputAt >= limit;
}

export function nearestRoom(slug: string, rooms: string[] = ROOMS): string {
  if (rooms.includes(slug)) return slug;
  const from = DISTRICTS.find((d) => d.slug === slug);
  if (!from) throw new Error(`Unknown district: ${slug}`);
  let best = rooms[0];
  let bestDistance = Infinity;
  for (const room of rooms) {
    const to = DISTRICTS.find((d) => d.slug === room)!;
    const distance = AXES.reduce((sum, axis) => sum + (from.profile[axis] - to.profile[axis]) ** 2, 0);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = room;
    }
  }
  return best;
}
