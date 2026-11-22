import { test } from "node:test";
import assert from "node:assert/strict";
import { seatMembers, statusOf, isIdle, nearestRoom, pickInstance, ROOMS, CAPACITY, MAX_INSTANCES, type Member } from "./queue.ts";
import { DISTRICTS } from "../match/districts.ts";

const members = (n: number, start = 1000): Member[] =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, joinedAt: start + i }));

test("a room holds thirty people", () => {
  assert.equal(CAPACITY, 30);
  const seats = seatMembers(members(30));
  assert.equal(seats.inRoom.length, 30);
  assert.equal(seats.waiting.length, 0);
});

test("the next to arrive is first in line and the one after second", () => {
  const seats = seatMembers(members(CAPACITY + 2));
  assert.deepEqual(seats.waiting, [`u${CAPACITY}`, `u${CAPACITY + 1}`]);
});

test("every client reaches the same seating whatever order presence arrives in", () => {
  const list = members(12);
  const shuffled = [list[11], list[3], list[0], list[10], ...list.slice(4, 10), list[1], list[2]];
  assert.deepEqual(seatMembers(shuffled, 10), seatMembers(list, 10));
});

test("members who joined in the same millisecond are ordered by id", () => {
  const seats = seatMembers([{ id: "b", joinedAt: 5 }, { id: "a", joinedAt: 5 }], 1);
  assert.deepEqual(seats.inRoom, ["a"]);
  assert.deepEqual(seats.waiting, ["b"]);
});

test("when someone in the room leaves, the first in line moves in", () => {
  const list = members(11);
  assert.deepEqual(statusOf("u10", list, 10), { state: "waiting", position: 1 });
  const afterLeave = list.filter((m) => m.id !== "u3");
  assert.deepEqual(statusOf("u10", afterLeave, 10), { state: "in" });
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
  assert.equal(nearestRoom("jung"), "yongsan");
  assert.equal(nearestRoom("mapo"), "yeongdeungpo");
  assert.equal(nearestRoom("songpa"), "seodaemun");
  for (const d of DISTRICTS) assert.ok(ROOMS.includes(nearestRoom(d.slug)), d.slug);
});

test("adding a room changes where its district is sent", () => {
  assert.equal(nearestRoom("jung", [...ROOMS, "jung"]), "jung");
});

test("travelers go to the first copy of a room with space", () => {
  assert.equal(pickInstance([]), 1);
  assert.equal(pickInstance([12]), 1);
  assert.equal(pickInstance([30, 4]), 2);
  assert.equal(pickInstance([30, 30]), 3); // open a new copy
});

test("when every copy is full, wait in the shortest line", () => {
  const counts = Array.from({ length: MAX_INSTANCES }, (_, i) => 30 + (i === 2 ? 1 : 5));
  assert.equal(pickInstance(counts), 3);
});
