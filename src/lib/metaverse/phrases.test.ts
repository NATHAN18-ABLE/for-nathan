import { test } from "node:test";
import assert from "node:assert/strict";
import { PHRASES, phraseText, EMOTES } from "./phrases.ts";
import { autoName } from "./names.ts";

test("every phrase has English and Korean text and a unique id", () => {
  const ids = new Set<string>();
  for (const p of PHRASES) {
    assert.ok(p.en && p.ko, p.id);
    assert.ok(!ids.has(p.id), p.id);
    ids.add(p.id);
  }
});

test("a phrase sent by id shows in the reader's language", () => {
  assert.equal(phraseText("hello", "en"), "Hello!");
  assert.equal(phraseText("hello", "ko"), "안녕하세요!");
  assert.equal(phraseText("no-such-phrase", "en"), null);
});

test("emotes are a short fixed list", () => {
  assert.deepEqual(
    EMOTES.map((e) => e.id),
    ["wave", "bow", "hop", "jegi", "sit"],
  );
});

test("an automatic name is stable for an id and looks like 'Traveler 42'", () => {
  assert.equal(autoName("abc"), autoName("abc"));
  assert.match(autoName("abc"), /^Traveler \d{1,2}$/);
});
