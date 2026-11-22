import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCourse, type Place } from "./course.ts";
import type { Scores } from "../match/match.ts";

const at = (lat: number, lng: number) => ({ lat, lng });
const BASE = at(37.57, 126.99);

const place = (id: string, extra: Partial<Place>): Place => ({
  id,
  district: "jongno",
  nameEn: id,
  nameKo: id,
  kind: "spot",
  slots: ["morning", "afternoon", "night"],
  profile: {},
  stayMinutes: 60,
  coords: BASE,
  ...extra,
});

const food = (id: string, extra: Partial<Place>): Place =>
  place(id, { kind: "food", slots: ["lunch", "snack", "dinner"], foodStyle: "both", ...extra });

const FIXTURE: Place[] = [
  place("old-alley", { profile: { time: -2, stage: -2 } }),
  place("new-gallery", { profile: { time: 2, stage: -1 } }),
  place("mountain-trail", { profile: { stage: 2, mood: -2 } }),
  place("night-alley", { slots: ["night"], profile: { mood: 2 } }),
  food("market-stall", { foodStyle: "adventurous", profile: { time: -2 } }),
  food("noodle-house", { profile: { time: -1 } }),
  food("new-bistro", { foodStyle: "easy", profile: { time: 2 } }),
  food("hotteok-cart", { slots: ["snack"], foodStyle: "adventurous" }),
  place("elsewhere", { district: "mapo", profile: { time: -2, stage: -2 } }),
];

const scores = (s: Partial<Scores>): Scores => ({ time: 0, stage: 0, mood: 0, pace: 0, ...s });
const walker = { food: "adventurous" as const, move: "walk" as const };

test("a lingering, calm traveller gets morning, lunch, afternoon and dinner", () => {
  const stops = buildCourse("jongno", scores({ pace: -1, mood: -1 }), walker, FIXTURE);
  assert.deepEqual(stops.map((s) => s.slot), ["morning", "lunch", "afternoon", "dinner"]);
});

test("a flowing traveller also gets a snack stop", () => {
  const stops = buildCourse("jongno", scores({ pace: 1, mood: -1 }), walker, FIXTURE);
  assert.deepEqual(stops.map((s) => s.slot), ["morning", "lunch", "afternoon", "snack", "dinner"]);
});

test("a buzz-seeking traveller also gets a night stop", () => {
  const stops = buildCourse("jongno", scores({ pace: -1, mood: 1 }), walker, FIXTURE);
  assert.equal(stops.at(-1)!.slot, "night");
});

test("meal slots only use food places and day slots only use spots", () => {
  const stops = buildCourse("jongno", scores({ pace: 1, mood: -1 }), walker, FIXTURE);
  for (const s of stops) {
    const meal = s.slot === "lunch" || s.slot === "snack" || s.slot === "dinner";
    assert.equal(s.place.kind, meal ? "food" : "spot", `${s.slot} got ${s.place.id}`);
  }
});

test("an easy eater is never sent to an adventurous-only food place", () => {
  const stops = buildCourse("jongno", scores({ time: -2, pace: 1 }), { food: "easy", move: "walk" }, FIXTURE);
  for (const s of stops) assert.notEqual(s.place.foodStyle, "adventurous", `${s.slot} got ${s.place.id}`);
});

test("each slot picks the place closest to the traveller's scores", () => {
  const heritage = buildCourse("jongno", scores({ time: -2, stage: -2, pace: -1, mood: -1 }), walker, FIXTURE);
  assert.equal(heritage[0].place.id, "old-alley");
  const trend = buildCourse("jongno", scores({ time: 2, stage: -1, pace: -1, mood: -1 }), walker, FIXTURE);
  assert.equal(trend[0].place.id, "new-gallery");
});

test("no place is used twice in one course", () => {
  const stops = buildCourse("jongno", scores({ pace: 1, mood: 1 }), walker, FIXTURE);
  const ids = stops.map((s) => s.place.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("only places in the chosen district are used", () => {
  const stops = buildCourse("jongno", scores({ time: -2, stage: -2 }), walker, FIXTURE);
  assert.ok(stops.every((s) => s.place.district === "jongno"));
});

test("a slot with no candidate is skipped instead of failing", () => {
  const onlySpots = FIXTURE.filter((p) => p.kind === "spot");
  const stops = buildCourse("jongno", scores({ pace: -1, mood: -1 }), walker, onlySpots);
  assert.deepEqual(stops.map((s) => s.slot), ["morning", "afternoon"]);
});

test("the first stop has no leg and later stops say how to get there", () => {
  const near = [
    place("a", { coords: at(37.57, 126.99) }),
    food("b", { coords: at(37.575, 126.99) }),
    place("c", { slots: ["afternoon"], coords: at(37.6, 126.99) }),
  ];
  const stops = buildCourse("jongno", scores({ pace: -1, mood: -1 }), walker, near);
  assert.equal(stops[0].leg, undefined);
  assert.equal(stops[1].leg!.mode, "walk");
  assert.ok(Math.abs(stops[1].leg!.km - 0.56) < 0.02, `km ${stops[1].leg!.km}`);
  assert.equal(stops[2].leg!.mode, "metro");
});

test("a walker walks further before being sent to the metro", () => {
  const far = [
    place("a", { coords: at(37.57, 126.99) }),
    food("b", { coords: at(37.588, 126.99) }),
  ];
  const s = scores({ pace: -1, mood: -1 });
  assert.equal(buildCourse("jongno", s, walker, far)[1].leg!.mode, "walk");
  assert.equal(buildCourse("jongno", s, { food: "adventurous", move: "metro" }, far)[1].leg!.mode, "metro");
});
