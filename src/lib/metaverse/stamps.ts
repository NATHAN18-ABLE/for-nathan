// A stamp card for each room: walk to each of its places to collect a stamp. Kept on the device.

export function sanitizeStamps(raw: unknown, places: string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) if (typeof id === "string" && places.includes(id) && !out.includes(id)) out.push(id);
  return out;
}

export function stamp(stamps: string[], place: string, places: string[]) {
  if (!places.includes(place) || stamps.includes(place)) return { stamps, isNew: false, done: places.every((p) => stamps.includes(p)) };
  const next = [...stamps, place];
  return { stamps: next, isNew: true, done: places.every((p) => next.includes(p)) };
}
