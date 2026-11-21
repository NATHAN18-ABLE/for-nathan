import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanChat, guessLang, MAX_CHAT, plausibleTranslation, RateLimit } from "./chat.ts";

test("messages are trimmed, single-spaced and capped in length", () => {
  assert.equal(cleanChat("  안녕하세요\n\n반가워요  "), "안녕하세요 반가워요");
  assert.equal(cleanChat("a".repeat(500))!.length, MAX_CHAT);
  assert.equal(cleanChat("   "), null);
  assert.equal(cleanChat(42), null);
  assert.equal(cleanChat("hi\u0000​ there"), "hi there");
});

test("swear words are masked, even with spaces or symbols between letters", () => {
  assert.equal(cleanChat("야 시발 뭐야"), "야 ** 뭐야");
  assert.equal(cleanChat("씨.발"), "**");
  assert.equal(cleanChat("what the FUCK"), "what the ****");
  assert.equal(cleanChat("Scunthorpe is a town"), "Scunthorpe is a town", "words inside other words are left alone");
  assert.equal(cleanChat("새끼 고양이가 귀여워요"), "새끼 고양이가 귀여워요", "ordinary words that share letters stay");
});

test("links, emails and phone numbers are hidden", () => {
  assert.equal(cleanChat("go to https://evil.example/x now"), "go to [link] now");
  assert.equal(cleanChat("www.spam.com 보세요"), "[link] 보세요");
  assert.equal(cleanChat("mail me a@b.co"), "mail me [link]");
  assert.equal(cleanChat("전화 010-1234-5678"), "전화 [number]");
  assert.equal(cleanChat("방 3개, 2026년"), "방 3개, 2026년", "short numbers are fine");
});

test("the language of a message is guessed from its script", () => {
  assert.equal(guessLang("안녕하세요"), "ko");
  assert.equal(guessLang("Hello there"), "en");
  assert.equal(guessLang("こんにちは"), "ja");
  assert.equal(guessLang("你好"), "zh");
  assert.equal(guessLang("👍"), null);
});

test("sending is limited to a steady pace", () => {
  const r = new RateLimit();
  assert.ok(r.take(0));
  assert.ok(!r.take(500), "too soon after the last one");
  assert.ok(r.take(1300));
  for (const t of [2600, 3900, 5200]) assert.ok(r.take(t));
  assert.ok(!r.take(6500), "five in ten seconds is the most");
  assert.ok(r.take(12000));
});

test("translations that are only keyboard-layout noise are rejected", () => {
  assert.equal(plausibleTranslation("ㅑㅣㅐㅍ됴ㅐㅕ", "i love you", "ko"), false, "loose Korean letters typed on the wrong layout");
  assert.equal(plausibleTranslation("사랑해요", "i love you", "ko"), true);
  assert.equal(plausibleTranslation("안녕하세요", "안녕하세요", "en"), false, "the same text is no translation");
  assert.equal(plausibleTranslation("안녕", "hello", "en"), false, "English asked for, Korean returned");
  assert.equal(plausibleTranslation("Hello", "안녕하세요", "en"), true);
  assert.equal(plausibleTranslation("x".repeat(400), "hi", "en"), false, "far longer than the message");
});
