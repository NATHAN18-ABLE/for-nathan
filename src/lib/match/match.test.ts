import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AXES,
  scoreAnswers,
  typeCode,
  matchDistricts,
  readConditions,
  type Question,
  type Answer,
} from "./match.ts";
import { QUESTIONS } from "./questions.ts";
import { DISTRICTS } from "./districts.ts";
import { TRAVEL_TYPES } from "./travel-types.ts";

const q = (id: string, weights: Question["weights"], extra: Partial<Question> = {}): Question => ({
  id,
  prompt: { en: id, ko: id },
  a: { en: "a", ko: "a" },
  b: { en: "b", ko: "b" },
  weights,
  ...extra,
});

test("every axis is scored by at least two questions in the bank", () => {
  for (const axis of AXES) {
    const n = QUESTIONS.filter((qq) => (qq.weights[axis] ?? 0) !== 0).length;
    assert.ok(n >= 2, `${axis} is scored by ${n} question(s)`);
  }
});

test("the bank has twelve questions", () => {
  assert.equal(QUESTIONS.length, 12);
});

test("all-B answers score +2 and all-A answers score -2 on the asked axis", () => {
  const bank = [q("q1", { time: 1 }), q("q2", { time: 0.5 })];
  assert.equal(scoreAnswers(["b", "b"], bank).time, 2);
  assert.equal(scoreAnswers(["a", "a"], bank).time, -2);
});

test("adding questions keeps scores on the same -2..2 scale", () => {
  const two = [q("q1", { pace: 1 }), q("q2", { pace: 1 })];
  const four = [...two, q("q3", { pace: 1 }), q("q4", { pace: 1 })];
  assert.equal(scoreAnswers(["b", "a"], two).pace, 0);
  assert.equal(scoreAnswers(["b", "b", "b", "a"], four).pace, 1);
  assert.equal(scoreAnswers(["b", "b", "b", "b"], four).pace, 2);
});

test("an axis no question scores stays at zero", () => {
  const bank = [q("q1", { time: 1 })];
  assert.equal(scoreAnswers(["b"], bank).mood, 0);
});

test("type code letters follow the sign of each axis", () => {
  const bank = [q("t", { time: 1 }), q("s", { stage: 1 }), q("m", { mood: 1 }), q("p", { pace: 1 })];
  assert.equal(typeCode(["a", "a", "a", "a"], bank), "HACL");
  assert.equal(typeCode(["b", "b", "b", "b"], bank), "TOBF");
});

test("a tied axis takes its letter from that axis's tiebreak question", () => {
  const bank = [
    q("t1", { time: 1 }),
    q("t2", { time: 1 }, { tiebreak: "time" }),
    q("s", { stage: 1 }),
    q("m", { mood: 1 }),
    q("p", { pace: 1 }),
  ];
  const answers: Answer[] = ["a", "b", "a", "a", "a"];
  assert.equal(scoreAnswers(answers, bank).time, 0);
  assert.equal(typeCode(answers, bank)[0], "T");
});

test("matchDistricts ranks the nearest district first and gives a runner-up", () => {
  const jongno = DISTRICTS.find((d) => d.slug === "jongno")!;
  const result = matchDistricts(jongno.profile);
  assert.equal(result.best.slug, "jongno");
  assert.notEqual(result.runnerUp.slug, "jongno");
});

test("conditions are read from the food and movement questions", () => {
  const answers = QUESTIONS.map((qq) => (qq.conditions?.food ? "a" : qq.conditions?.move ? "b" : "a")) as Answer[];
  const c = readConditions(answers);
  const foodQ = QUESTIONS.find((qq) => qq.conditions?.food)!;
  const moveQ = QUESTIONS.find((qq) => qq.conditions?.move)!;
  assert.equal(c.food, foodQ.conditions!.food!.a);
  assert.equal(c.move, moveQ.conditions!.move!.b);
});

test("each district is the best match for 6–11% of all answer sets", () => {
  const counts = new Map<string, number>();
  const total = 2 ** QUESTIONS.length;
  for (let mask = 0; mask < total; mask++) {
    const answers = QUESTIONS.map((_, i) => ((mask >> i) & 1 ? "b" : "a")) as Answer[];
    const slug = matchDistricts(scoreAnswers(answers)).best.slug;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  for (const d of DISTRICTS) {
    const share = (counts.get(d.slug) ?? 0) / total;
    assert.ok(share >= 0.06, `${d.slug} wins only ${(share * 100).toFixed(1)}%`);
    assert.ok(share <= 0.11, `${d.slug} wins ${(share * 100).toFixed(1)}%`);
  }
});

test("all sixteen type codes have a name and a line", () => {
  const letters = [["H", "T"], ["A", "O"], ["C", "B"], ["L", "F"]];
  for (const a of letters[0]) for (const b of letters[1]) for (const c of letters[2]) for (const d of letters[3]) {
    const t = TRAVEL_TYPES[`${a}${b}${c}${d}`];
    assert.ok(t?.name.en && t?.name.ko && t?.line.en && t?.line.ko, `missing ${a}${b}${c}${d}`);
  }
});

test("every question and district has both English and Korean copy", () => {
  for (const qq of QUESTIONS) for (const t of [qq.prompt, qq.a, qq.b]) assert.ok(t.en && t.ko, qq.id);
  for (const d of DISTRICTS) assert.ok(d.line.en && d.line.ko, d.slug);
});
