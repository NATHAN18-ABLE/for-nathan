import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scrollWindows, frameAt, type Timing } from "./timeline.ts";

const linear = (n: number) => Array.from({ length: n }, (_, i) => i / (n - 1));
const toy: Timing = {
  frames: 9,
  segments: [
    { start: 0, end: 4, total: 100, curve: linear(5) },
    { start: 4, end: 8, total: 300, curve: [0, 0.5, 0.8, 0.95, 1] },
  ],
};

test("each clip gets scroll length in proportion to how much its picture changes", () => {
  const w = scrollWindows(toy, 0.1, 0.5);
  assert.equal(w[0].from, 0.1);
  assert.ok(Math.abs(w[0].to - 0.2) < 1e-9);
  assert.ok(Math.abs(w[1].from - 0.2) < 1e-9);
  assert.equal(w[1].to, 0.5);
});

test("before the first window the first frame shows, after the last the last frame", () => {
  const w = scrollWindows(toy, 0.1, 0.5);
  assert.equal(frameAt(0, toy, w), 0);
  assert.equal(frameAt(0.9, toy, w), 8);
});

test("window edges land exactly on the clip's first and last frames", () => {
  const w = scrollWindows(toy, 0.1, 0.5);
  assert.equal(frameAt(0.1, toy, w), 0);
  assert.equal(frameAt(w[0].to, toy, w), 4);
  assert.equal(frameAt(0.5, toy, w), 8);
});

test("a clip whose motion is front-loaded is slowed at the start and sped up at the end", () => {
  const w = scrollWindows(toy, 0, 1);
  // half of the second clip's change happens in its first frame step,
  // so half of its scroll window should cover only that one step
  const mid = (w[1].from + w[1].to) / 2;
  assert.ok(Math.abs(frameAt(mid, toy, w) - 5) < 1e-9);
});

test("frames never go backwards as the page scrolls down", () => {
  const w = scrollWindows(toy, 0.1, 0.5);
  let prev = -1;
  for (let p = 0; p <= 1; p += 0.001) {
    const f = frameAt(p, toy, w);
    assert.ok(f >= prev - 1e-9, `frame went back at ${p}`);
    prev = f;
  }
});

test("on the real clips the picture changes at the same rate just before and after the seam", () => {
  const real = JSON.parse(readFileSync(new URL("../../../public/hero/timing.json", import.meta.url), "utf8")) as Timing;
  const w = scrollWindows(real, 0.07, 0.74);
  const rate = (i: number) => real.segments[i].total / (w[i].to - w[i].from);
  assert.ok(Math.abs(rate(0) - rate(1)) / rate(0) < 1e-6);
});
