import { test } from "node:test";
import assert from "node:assert/strict";
import { autoName, cleanName, MAX_NAME } from "./names.ts";

test("a chosen name is trimmed to one short line", () => {
  assert.equal(cleanName("  서울 산책자  "), "서울 산책자");
  assert.equal(cleanName("Mina\nKim"), "Mina Kim");
  assert.equal([...cleanName("가나다라마바사아자차카타파하")!].length, MAX_NAME);
});

test("empty, swearing, links and phone numbers are refused", () => {
  for (const bad of ["", "   ", null, 42, "씨발", "fuck you", "www.spam.com", "010-1234-5678"]) assert.equal(cleanName(bad), null, String(bad));
});

test("auto names stay as they were", () => {
  assert.match(autoName("abc"), /^Traveler \d{1,2}$/);
});
