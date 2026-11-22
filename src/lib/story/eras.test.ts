import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { ERAS, STORY } from "./eras.ts";
import { COURSES } from "../districts/courses.ts";

const both = (t?: { en: string; ko: string }) => !!t && t.en.trim() !== "" && t.ko.trim() !== "";

test("seven scenes, each with both languages", () => {
  assert.equal(ERAS.length, 7);
  for (const t of Object.values(STORY)) assert.ok(both(t));
  for (const e of ERAS) for (const t of [e.mark, e.span, e.title, e.summary, e.cityName, e.photo?.alt].filter(Boolean)) assert.ok(both(t), e.id);
});

test("places marked as in a course link to a day course that exists", () => {
  for (const e of ERAS) for (const p of e.places) if (p.inCourse) assert.ok(COURSES.some((c) => c.slug === p.district), `${e.id}: ${p.name.en}`);
});

test("every scene photo is in public/", () => {
  for (const e of ERAS) if (e.photo) assert.ok(existsSync(`public${e.photo.src}`), e.photo.src);
});
