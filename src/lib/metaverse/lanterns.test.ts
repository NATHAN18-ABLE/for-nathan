import { test } from "node:test";
import assert from "node:assert/strict";
import { WISHES, LANTERN_COLORS, lanternSpot, ropeY, RACK } from "./lanterns.ts";

test("wishes and colours match what the database accepts", () => {
  assert.deepEqual(
    WISHES.map((w) => w.id),
    ["health", "journey", "love", "family", "dream", "peace"],
  );
  assert.equal(LANTERN_COLORS.length, 5);
  for (const w of WISHES) assert.ok(w.en && w.ko);
});

test("lanterns fill the rack row by row and never collide", () => {
  const seen = new Set<string>();
  for (let i = 0; i < RACK.rows * RACK.perRow; i++) {
    const p = lanternSpot(i);
    const key = `${p.z.toFixed(2)}|${p.y.toFixed(2)}`;
    assert.ok(!seen.has(key), `slot ${i} collides`);
    seen.add(key);
    assert.ok(p.z >= RACK.z0 - 1e-9 && p.z <= RACK.z1 + 1e-9);
  }
});

test("when the rack is full the oldest spot is reused", () => {
  const n = RACK.rows * RACK.perRow;
  assert.deepEqual(lanternSpot(n), lanternSpot(0));
});

test("ropes sag between posts, so lanterns mid-span hang lower than at a post", () => {
  const atPost = ropeY(0, RACK.posts[1]);
  const midSpan = ropeY(0, (RACK.posts[0] + RACK.posts[1]) / 2);
  assert.ok(midSpan < atPost - 0.15, `${midSpan} vs ${atPost}`);
});
