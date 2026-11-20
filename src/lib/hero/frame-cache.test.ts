import { test } from "node:test";
import assert from "node:assert/strict";
import { evictions, nextToFetch, wanted } from "./frame-cache.ts";

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

test("downloads start with the opening of the film, every frame in order", () => {
  const got = new Uint8Array(500);
  const order: number[] = [];
  for (let k = 0; k < 10; k++) {
    const i = nextToFetch(got, 0, 1)!;
    got[i] = 1;
    order.push(i);
  }
  assert.deepEqual(order, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test("after the opening, the frames just ahead of the visitor come first", () => {
  const got = new Uint8Array(500);
  got.fill(1, 0, 80); // the opening is in
  assert.equal(nextToFetch(got, 200, 1), 200);
  got[200] = 1;
  assert.equal(nextToFetch(got, 200, 1), 201, "forward, in the scroll direction");
  got.fill(1, 200, 400);
  assert.equal(nextToFetch(got, 200, -1), 199, "scrolling back fetches backwards");
});

test("with nothing near the visitor missing, a coarse pass then the rest fill in; then nothing is left", () => {
  const got = new Uint8Array(300);
  got.fill(1, 0, 300);
  got[250] = 0;
  got[5] = 0;
  assert.equal(nextToFetch(got, 0, 1), 5);
  got[5] = 1;
  assert.equal(nextToFetch(got, 0, 1), 250);
  got[250] = 1;
  assert.equal(nextToFetch(got, 0, 1), undefined);
});
