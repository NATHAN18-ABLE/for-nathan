import { test } from "node:test";
import assert from "node:assert/strict";
import { evictions, nearestAvailable, nextToFetch, wanted } from "./frame-cache.ts";

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

test("downloads start with the opening, then a thin skeleton across the whole film", () => {
  const got = new Uint8Array(500);
  const order: number[] = [];
  for (let k = 0; k < 24 + 21; k++) {
    const i = nextToFetch(got, 0, 1)!;
    got[i] = 1;
    order.push(i);
  }
  assert.deepEqual(order.slice(0, 24), Array.from({ length: 24 }, (_, i) => i), "the opening, every frame");
  assert.deepEqual(order.slice(24, 30), [24, 48, 72, 96, 120, 144], "then every 24th frame, so any scroll position has something close");
  assert.ok(order.includes(480));
});

test("after the skeleton, the frames just ahead of the visitor come first", () => {
  const got = new Uint8Array(500);
  got.fill(1, 0, 24);
  for (let i = 0; i < 500; i += 24) got[i] = 1;
  got[499] = 1; // the last frame comes with the skeleton
  assert.equal(nextToFetch(got, 200, 1), 200, "where the visitor is");
  got[200] = 1;
  assert.equal(nextToFetch(got, 200, 1), 201);
  got[201] = 1;
  assert.equal(nextToFetch(got, 200, 1), 202, "forward, in the scroll direction");
  got.fill(1, 200, 400);
  assert.equal(nextToFetch(got, 200, -1), 199, "scrolling back fetches backwards");
});

test("with nothing near the visitor missing, finer passes then the rest fill in; then nothing is left", () => {
  const got = new Uint8Array(300);
  got.fill(1, 0, 300);
  got[250] = 0;
  got[5] = 0;
  assert.equal(nextToFetch(got, 100, 1), 5);
  got[5] = 1;
  assert.equal(nextToFetch(got, 100, 1), 250);
  got[250] = 1;
  assert.equal(nextToFetch(got, 100, 1), undefined);
});

test("the nearest frame that has arrived stands in for one that has not", () => {
  const have = (i: number) => [10, 40, 41].includes(i);
  assert.equal(nearestAvailable(38, have, 60), 40);
  assert.equal(nearestAvailable(20, have, 60), 10);
  assert.equal(nearestAvailable(200, have, 60), null);
});
