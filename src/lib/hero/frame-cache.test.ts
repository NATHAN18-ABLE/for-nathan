import { test } from "node:test";
import assert from "node:assert/strict";
import { evictions, wanted } from "./frame-cache.ts";

test("nothing is evicted while the cache is within its limit", () => {
  assert.deepEqual(evictions([1, 2, 3], 2, 5), []);
});

test("the frames farthest from the current one are evicted first", () => {
  assert.deepEqual(evictions([0, 10, 50, 52, 100], 51, 3).sort((a, b) => a - b), [0, 100]);
});

test("wanted frames start at the current one and lean toward the scroll direction", () => {
  const w = wanted(100, 1, 400, 3, 6);
  assert.equal(w[0], 100);
  assert.deepEqual([...w].sort((a, b) => a - b), [97, 98, 99, 100, 101, 102, 103, 104, 105, 106]);
  assert.ok(w.indexOf(101) < w.indexOf(99), "forward frames come before backward ones");
});

test("scrolling back flips which side gets more frames", () => {
  const w = wanted(100, -1, 400, 3, 6);
  assert.ok(w.includes(94) && !w.includes(104));
});

test("wanted frames stay inside the sequence", () => {
  assert.deepEqual([...wanted(1, -1, 5, 2, 4)].sort((a, b) => a - b), [0, 1, 2, 3]);
});
