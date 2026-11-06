import { QUESTIONS } from "./questions.ts";
import { DISTRICTS, type District } from "./districts.ts";

// Negative side first: time H/T, stage A/O, mood C/B, pace L/F.
export const AXES = ["time", "stage", "mood", "pace"] as const;
export type Axis = (typeof AXES)[number];
export type Scores = Record<Axis, number>;
export type Answer = "a" | "b";

const LETTERS: Record<Axis, [string, string]> = {
  time: ["H", "T"],
  stage: ["A", "O"],
  mood: ["C", "B"],
  pace: ["L", "F"],
};

export type Food = "adventurous" | "easy";
export type Move = "walk" | "metro";

export interface Question {
  id: string;
  prompt: string;
  a: string;
  b: string;
  // Choosing B adds the weight to the axis, choosing A subtracts it.
  weights: Partial<Record<Axis, number>>;
  tiebreak?: Axis;
  conditions?: {
    food?: Record<Answer, Food>;
    move?: Record<Answer, Move>;
  };
}

// Each axis lands on -2..2 however many questions score it.
export function scoreAnswers(answers: Answer[], bank: Question[] = QUESTIONS): Scores {
  const scores = {} as Scores;
  for (const axis of AXES) {
    let sum = 0;
    let max = 0;
    bank.forEach((question, i) => {
      const w = question.weights[axis] ?? 0;
      max += Math.abs(w);
      sum += answers[i] === "b" ? w : -w;
    });
    scores[axis] = max === 0 ? 0 : (sum / max) * 2;
  }
  return scores;
}

export function typeCode(answers: Answer[], bank: Question[] = QUESTIONS): string {
  const scores = scoreAnswers(answers, bank);
  return AXES.map((axis) => {
    let positive = scores[axis] > 0;
    if (scores[axis] === 0) {
      const i = bank.findIndex((question) => question.tiebreak === axis);
      if (i >= 0) {
        const w = bank[i].weights[axis] ?? 0;
        positive = (answers[i] === "b") === w > 0;
      }
    }
    return LETTERS[axis][positive ? 1 : 0];
  }).join("");
}

export function matchDistricts(scores: Scores, districts: District[] = DISTRICTS) {
  const ranked = districts
    .map((district) => ({
      district,
      distance: Math.hypot(...AXES.map((axis) => scores[axis] - district.profile[axis])),
    }))
    .sort((x, y) => x.distance - y.distance);
  return { best: ranked[0].district, runnerUp: ranked[1].district };
}

export function readConditions(answers: Answer[], bank: Question[] = QUESTIONS) {
  let food: Food = "adventurous";
  let move: Move = "walk";
  bank.forEach((question, i) => {
    const choice = answers[i] ?? "a";
    if (question.conditions?.food) food = question.conditions.food[choice];
    if (question.conditions?.move) move = question.conditions.move[choice];
  });
  return { food, move };
}
