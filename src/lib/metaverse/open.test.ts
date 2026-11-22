import { test } from "node:test";
import assert from "node:assert/strict";
import { entryRoom, OPEN_ROOMS } from "./open.ts";

test("a district with an open room goes straight to it", () => {
  assert.equal(entryRoom("jongno"), "jongno");
});

test("until a district's room opens, its travelers meet in an open room", () => {
  for (const slug of ["seodaemun", "yongsan", "yeongdeungpo"]) assert.ok(OPEN_ROOMS.includes(entryRoom(slug)), slug);
});
