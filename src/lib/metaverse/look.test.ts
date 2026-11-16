import { test } from "node:test";
import assert from "node:assert/strict";
import { ITEMS, defaultLook, toggleItem, sanitizeLook } from "./look.ts";

test("every item has a body spot and both languages", () => {
  for (const it of ITEMS) {
    assert.ok(it.en && it.ko, it.id);
    assert.ok(["hand", "head", "neck", "hip"].includes(it.slot), it.id);
  }
});

test("wearing an item replaces whatever was in the same spot", () => {
  let look = defaultLook();
  look = toggleItem(look, "fan");
  look = toggleItem(look, "lantern"); // also a hand item
  assert.deepEqual(look.items, ["lantern"]);
  look = toggleItem(look, "scarf");
  assert.deepEqual([...look.items].sort(), ["lantern", "scarf"]);
  look = toggleItem(look, "scarf"); // tapping again takes it off
  assert.deepEqual(look.items, ["lantern"]);
});

test("looks from the network are cleaned before use", () => {
  const dirty = { items: ["scarf", "unknown", "scarf", "fan", "lantern"], scarf: 99 } as never;
  const clean = sanitizeLook(dirty);
  assert.deepEqual(clean.items, ["scarf", "fan"]);
  assert.equal(clean.scarf, 0);
});
