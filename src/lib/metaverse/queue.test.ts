import { test } from "node:test";
import assert from "node:assert/strict";
import { seatMembers, statusOf, isIdle, nearestRoom, ROOMS, type Member } from "./queue.ts";
import { DISTRICTS } from "../match/districts.ts";

const members = (n: number, start = 1000): Member[] =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, joinedAt: start + i }));

test("the first ten to join are in the room", () => {
  const seats = seatMembers(members(10));
  assert.equal(seats.inRoom.length, 10);
  assert.equal(seats.waiting.length, 0);
});

test("the eleventh is first in line and the twelfth second", () => {
  const seats = seatMembers(members(12));
  assert.deepEqual(seats.waiting, ["u10", "u11"]);
});

test("every client reaches the same seating whatever order presence arrives in", () => {
  const list = members(12);
  const shuffled = [list[11], list[3], list[0], list[10], ...list.slice(4, 10), list[1], list[2]];
  assert.deepEqual(seatMembers(shuffled), seatMembers(list));
});

test("members who joined in the same millisecond are ordered by id", () => {
  const seats = seatMembers([{ id: "b", joinedAt: 5 }, { id: "a", joinedAt: 5 }], 1);
  assert.deepEqual(seats.inRoom, ["a"]);
  assert.deepEqual(seats.waiting, ["b"]);
});

test("when someone in the room leaves, the first in line moves in", () => {
  const list = members(11);
  assert.deepEqual(statusOf("u10", list), { state: "waiting", position: 1 });
  const afterLeave = list.filter((m) => m.id !== "u3");
  assert.deepEqual(statusOf("u10", afterLeave), { state: "in" });
});

test("a client not in presence is absent", () => {
  assert.deepEqual(statusOf("ghost", members(3)), { state: "absent" });
});

test("a member is idle after two minutes without input", () => {
  assert.equal(isIdle(0, 119_999), false);
  assert.equal(isIdle(0, 120_000), true);
});

test("a district with a room goes to its own room", () => {
  for (const slug of ROOMS) assert.equal(nearestRoom(slug), slug);
});

test("a district without a room goes to the closest room by profile", () => {
  assert.equal(nearestRoom("jung"), "dongdaemun");
  for (const d of DISTRICTS) assert.ok(ROOMS.includes(nearestRoom(d.slug)), d.slug);
});

test("adding a room changes where its district is sent", () => {
  assert.equal(nearestRoom("jung", [...ROOMS, "jung"]), "jung");
});
