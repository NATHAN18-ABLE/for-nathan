import { test } from "node:test";
import assert from "node:assert/strict";
import { findPath, nearestWalkable, positionAt, isWalkable, cleanPath, cleanSpeed, WALK_SPEED, RUN_SPEED, type Walkable } from "./path.ts";

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

test("paths across a large neighbourhood are found quickly", () => {
  // A 100 m x 80 m block with a wall of buildings and two gaps.
  const town: Walkable = {
    cell: 0.5,
    rects: [
      { x0: -50, z0: 20, x1: 50, z1: 40 },
      { x0: -50, z0: -40, x1: 50, z1: -20 },
      { x0: -50, z0: -20, x1: -44, z1: 20 },
      { x0: 44, z0: -20, x1: 50, z1: 20 },
    ],
  };
  const t0 = performance.now();
  const path = findPath({ x: -10, z: 35 }, { x: 10, z: -35 }, town);
  const ms = performance.now() - t0;
  assert.ok(path.length >= 3, "should route around the block");
  assert.ok(ms < 120, `took ${ms.toFixed(0)} ms`);
});

test("posts and trees inside a walkable area are walked around, never through", () => {
  const yard: Walkable = { cell: 0.5, rects: [{ x0: -10, z0: -3, x1: 10, z1: 3 }], holes: [{ x: 0, z: 0, r: 1.2 }] };
  assert.ok(!isWalkable({ x: 0.5, z: 0.3 }, yard));
  const path = findPath({ x: -8, z: 0 }, { x: 8, z: 0 }, yard);
  assert.ok(path.length >= 3, "should bend around the post");
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    for (let t = 0; t <= 1; t += 0.02) {
      const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
      assert.ok(Math.hypot(p.x, p.z) >= 1.2 - 1e-6, `went through the post at ${JSON.stringify(p)}`);
    }
  }
});

test("a tap on a post sends you to its edge", () => {
  const yard: Walkable = { cell: 0.5, rects: [{ x0: -10, z0: -3, x1: 10, z1: 3 }], holes: [{ x: 0, z: 0, r: 1 }] };
  const p = nearestWalkable({ x: 0.2, z: 0.1 }, yard);
  assert.ok(isWalkable(p, yard));
  assert.ok(Math.hypot(p.x, p.z) < 1.3);
});

test("with a body size, a traveler keeps that far from edges and posts but still turns corners", () => {
  const w: Walkable = { ...alley, holes: [{ x: 0, z: 0, r: 0.4 }], body: 0.3 };
  assert.ok(!isWalkable({ x: -5, z: 0.85 }, w), "too close to the alley's side");
  assert.ok(isWalkable({ x: -5, z: 0.65 }, w));
  assert.ok(!isWalkable({ x: 0.6, z: 0 }, w), "too close to the post");
  assert.ok(isWalkable({ x: 8, z: 0 }, w), "where the two strips meet");
  const tap = nearestWalkable({ x: -5, z: 3 }, w);
  assert.ok(isWalkable(tap, w), "a tap beyond the edge lands where the body fits");
  const path = findPath({ x: -8, z: 0 }, { x: 8, z: -7 }, w);
  for (const p of path) assert.ok(isWalkable(p, w), `path point ${JSON.stringify(p)} is too close to an edge`);
});

test("paths and speeds from the network are cleaned before use", () => {
  assert.equal(cleanPath(null), null);
  assert.equal(cleanPath([{ x: 1, z: 1 }]), null, "a single point is not a walk");
  assert.deepEqual(cleanPath([{ x: 1, z: 1 }, { x: NaN, z: 2 }, { x: 3, z: 4 }, "x"]), [{ x: 1, z: 1 }, { x: 3, z: 4 }]);
  assert.equal(cleanPath(Array.from({ length: 500 }, (_, i) => ({ x: i, z: 0 })))!.length, 120);
  assert.equal(cleanPath([{ x: 0, z: 0 }, { x: 1e9, z: 0 }]), null, "points far outside any room are dropped");
  assert.equal(cleanSpeed(99), RUN_SPEED);
  assert.equal(cleanSpeed("fast"), WALK_SPEED);
  assert.equal(cleanSpeed(WALK_SPEED), WALK_SPEED);
});
