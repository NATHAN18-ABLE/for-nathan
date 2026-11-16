import { test } from "node:test";
import assert from "node:assert/strict";
import { findPath, nearestWalkable, positionAt, isWalkable, type Walkable } from "./path.ts";

// An L-shaped alley: a long east-west strip and a short north arm at its east end.
const alley: Walkable = {
  cell: 0.5,
  rects: [
    { x0: -10, z0: -1, x1: 10, z1: 1 },
    { x0: 6, z0: -8, x1: 10, z1: 1 },
  ],
};

test("points inside the rectangles are walkable and points outside are not", () => {
  assert.ok(isWalkable({ x: 0, z: 0 }, alley));
  assert.ok(isWalkable({ x: 8, z: -6 }, alley));
  assert.ok(!isWalkable({ x: 0, z: -6 }, alley));
});

test("a click outside the alley snaps to the closest walkable point", () => {
  const p = nearestWalkable({ x: 0, z: -6 }, alley);
  assert.ok(isWalkable(p, alley));
  assert.ok(Math.abs(p.x) < 0.6 && Math.abs(p.z + 1) < 0.6, JSON.stringify(p));
});

test("the path from the west end to the north arm stays inside the alley", () => {
  const path = findPath({ x: -9, z: 0 }, { x: 8, z: -7 }, alley);
  assert.ok(path.length >= 2);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    for (let t = 0; t <= 1; t += 0.05) {
      const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
      assert.ok(isWalkable(p, alley), `left the alley at ${JSON.stringify(p)}`);
    }
  }
  const end = path[path.length - 1];
  assert.ok(Math.hypot(end.x - 8, end.z + 7) < 0.01);
});

test("a straight walk in the open has no detours", () => {
  const path = findPath({ x: -8, z: 0 }, { x: 4, z: 0.5 }, alley);
  assert.equal(path.length, 2);
});

test("walking a path at a steady speed reaches each point on time", () => {
  const path = [
    { x: 0, z: 0 },
    { x: 3, z: 0 },
    { x: 3, z: 4 },
  ];
  const mid = positionAt(path, 1.5, 2); // 3 m along: the corner
  assert.ok(Math.abs(mid.x - 3) < 1e-9 && Math.abs(mid.z) < 1e-9);
  assert.equal(mid.done, false);
  const end = positionAt(path, 10, 2);
  assert.deepEqual([end.x, end.z, end.done], [3, 4, true]);
  const start = positionAt(path, 0, 2);
  assert.ok(Math.abs(start.heading - Math.PI / 2) < 1e-9); // facing +x
});
