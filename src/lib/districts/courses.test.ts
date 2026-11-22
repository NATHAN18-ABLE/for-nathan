import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { COURSES } from "./courses.ts";
import { DISTRICTS } from "../match/districts.ts";

const both = (t: { en: string; ko: string } | undefined) => !!t && t.en.trim() !== "" && t.ko.trim() !== "";

test("every course belongs to one of the twelve districts", () => {
  for (const c of COURSES) assert.ok(DISTRICTS.some((d) => d.slug === c.slug), c.slug);
});

test("stops run in time order and every line has English and Korean", () => {
  for (const c of COURSES) {
    for (const t of [c.area, c.title, c.intro, c.length, c.start, c.nearby, c.more].filter(Boolean)) assert.ok(both(t), c.slug);
    let last = "";
    for (const s of c.stops) {
      assert.match(s.time, /^\d\d:\d\d$/);
      assert.ok(s.time > last, `${c.slug} ${s.time} comes after ${last}`);
      last = s.time;
      for (const t of [s.name, s.kind, s.body, s.tip, s.way, s.photo?.alt, s.short, s.summary, s.stay, s.cost, s.note].filter(Boolean)) assert.ok(both(t), `${c.slug} ${s.time}`);
    }
    assert.equal(c.stops[0].way, undefined, `${c.slug}: the first stop has no way in`);
  }
});

test("every photo the courses name is in public/", () => {
  for (const c of COURSES) for (const s of c.stops) if (s.photo) assert.ok(existsSync(`public${s.photo.src}`), s.photo.src);
});

test("a stop after the first says how to get there, by which means", () => {
  for (const c of COURSES) c.stops.slice(1).forEach((s) => assert.ok(s.way && s.mode, `${c.slug} ${s.time}`));
});
