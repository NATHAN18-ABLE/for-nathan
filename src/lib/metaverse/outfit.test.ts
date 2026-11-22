import { test } from "node:test";
import assert from "node:assert/strict";
import { OUTFITS, HAIRS, SKINS, HAIR_COLORS, defaultAvatar, sanitizeAvatar, withGender, paletteOf } from "./outfit.ts";

test("each gender has two or three outfits, each in three colours, named in both languages", () => {
  for (const g of ["f", "m"] as const) {
    const mine = OUTFITS.filter((o) => o.genders.includes(g));
    assert.ok(mine.length >= 2 && mine.length <= 3, g);
    for (const o of mine) {
      assert.equal(o.colorways.length, 3, o.id);
      assert.ok(o.en && o.ko, o.id);
      for (const c of o.colorways) assert.ok(c.en && c.ko, `${o.id} colour`);
    }
    assert.ok(OUTFITS.some((o) => o.hanbok && o.genders.includes(g)), `${g} has a hanbok`);
    assert.ok(HAIRS.some((h) => h.genders.includes(g)), `${g} has hair`);
  }
});

test("the default avatar is valid for both genders", () => {
  for (const g of ["f", "m"] as const) assert.deepEqual(sanitizeAvatar(defaultAvatar(g)), defaultAvatar(g));
});

test("switching gender swaps clothes and hair that do not fit, and keeps skin and hair colour", () => {
  const f = { ...defaultAvatar("f"), outfit: "chima", hair: "braid", skin: 2, hairColor: 1 } as const;
  const m = withGender(f, "m");
  assert.equal(m.gender, "m");
  assert.ok(OUTFITS.find((o) => o.id === m.outfit)!.genders.includes("m"));
  assert.ok(HAIRS.find((h) => h.id === m.hair)!.genders.includes("m"));
  assert.equal(m.skin, 2);
  assert.equal(m.hairColor, 1);
  // A hoodie fits both, so it stays.
  assert.equal(withGender({ ...f, outfit: "hoodie" }, "m").outfit, "hoodie");
});

test("avatars from the network are cleaned before use", () => {
  assert.deepEqual(sanitizeAvatar(null), defaultAvatar("f"));
  const dirty = { gender: "m", outfit: "chima", colorway: 7, hair: "bun", skin: -1, hairColor: "x" };
  const clean = sanitizeAvatar(dirty);
  assert.equal(clean.gender, "m");
  assert.notEqual(clean.outfit, "chima"); // not offered for this gender
  assert.notEqual(clean.hair, "bun");
  assert.equal(clean.colorway, 0);
  assert.equal(clean.skin, 0);
  assert.equal(clean.hairColor, 0);
  assert.ok(clean.skin < SKINS.length && clean.hairColor < HAIR_COLORS.length);
});

test("a palette is complete for every outfit and colour", () => {
  for (const o of OUTFITS)
    for (let c = 0; c < o.colorways.length; c++) {
      const p = paletteOf({ ...defaultAvatar(o.genders[0]), outfit: o.id, colorway: c });
      for (const v of Object.values(p)) assert.match(v, /^#[0-9a-f]{6}$/i, `${o.id} ${c}`);
    }
});
