import { test } from "node:test";
import assert from "node:assert/strict";
import { stamp, sanitizeStamps } from "./stamps.ts";

const PLACES = ["entrance", "wall", "workshop"];

test("visiting a place stamps it once, and the last one completes the card", () => {
  let r = stamp([], "wall", PLACES);
  assert.deepEqual(r, { stamps: ["wall"], isNew: true, done: false });
  r = stamp(r.stamps, "wall", PLACES);
  assert.equal(r.isNew, false, "the same place twice is not a new stamp");
  r = stamp(r.stamps, "entrance", PLACES);
  r = stamp(r.stamps, "workshop", PLACES);
  assert.equal(r.done, true);
  assert.equal(stamp(r.stamps, "bench", PLACES).isNew, false, "places without a stamp do not count");
});

test("saved stamps are cleaned: only known places, no repeats", () => {
  assert.deepEqual(sanitizeStamps(["wall", "wall", "nope", 3, "entrance"], PLACES), ["wall", "entrance"]);
  assert.deepEqual(sanitizeStamps("junk", PLACES), []);
});
