import { AXES, type Axis, type Scores, type Food, type Move } from "../match/match.ts";

export type Slot = "morning" | "lunch" | "afternoon" | "snack" | "dinner" | "night";

export interface Place {
  id: string;
  district: string;
  nameEn: string;
  nameKo: string;
  kind: "spot" | "food";
  slots: Slot[];
  // Axes the place clearly leans on, -2..2. Missing axes count as neutral.
  profile: Partial<Record<Axis, number>>;
  foodStyle?: Food | "both";
  stayMinutes: number;
  coords: { lat: number; lng: number };
}

export interface Leg {
  km: number;
  minutes: number;
  mode: "walk" | "metro";
}

export interface Stop {
  slot: Slot;
  place: Place;
  leg?: Leg;
}

const MEALS: Slot[] = ["lunch", "snack", "dinner"];
const WALK_KMH = 4.5;
const WALK_LIMIT_KM: Record<Move, number> = { walk: 2.5, metro: 1.0 };
// How much a kilometre from the previous stop counts against a place.
const DISTANCE_WEIGHT: Record<Move, number> = { walk: 1, metro: 0.3 };

function slotsFor(scores: Scores): Slot[] {
  const slots: Slot[] = ["morning", "lunch", "afternoon"];
  if (scores.pace > 0) slots.push("snack");
  slots.push("dinner");
  if (scores.mood > 0) slots.push("night");
  return slots;
}

function fits(place: Place, slot: Slot, food: Food): boolean {
  if (!place.slots.includes(slot)) return false;
  if (slot === "night") return true;
  if (MEALS.includes(slot)) {
    return place.kind === "food" && (place.foodStyle === "both" || place.foodStyle === food);
  }
  return place.kind === "spot";
}

function km(a: Place["coords"], b: Place["coords"]): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function legBetween(from: Place, to: Place, move: Move): Leg {
  const d = km(from.coords, to.coords);
  const mode = d <= WALK_LIMIT_KM[move] ? "walk" : "metro";
  // Rough guide only: metro time is a flat wait plus ride, not a timetable.
  const minutes = mode === "walk" ? Math.round((d / WALK_KMH) * 60) : Math.round(8 + d * 2.5);
  return { km: Math.round(d * 100) / 100, minutes, mode };
}

export function buildCourse(
  district: string,
  scores: Scores,
  conditions: { food: Food; move: Move },
  places: Place[],
): Stop[] {
  const pool = places.filter((p) => p.district === district);
  const used = new Set<string>();
  const stops: Stop[] = [];

  for (const slot of slotsFor(scores)) {
    const prev = stops.at(-1)?.place;
    let best: Place | undefined;
    let bestCost = Infinity;
    for (const p of pool) {
      if (used.has(p.id) || !fits(p, slot, conditions.food)) continue;
      const taste = AXES.reduce((sum, axis) => sum + (scores[axis] - (p.profile[axis] ?? 0)) ** 2, 0);
      const travel = prev ? km(prev.coords, p.coords) * DISTANCE_WEIGHT[conditions.move] : 0;
      if (taste + travel < bestCost) {
        bestCost = taste + travel;
        best = p;
      }
    }
    if (!best) continue;
    used.add(best.id);
    stops.push({ slot, place: best, leg: prev ? legBetween(prev, best, conditions.move) : undefined });
  }
  return stops;
}
