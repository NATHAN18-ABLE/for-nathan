// Walking on the ground plane (x, z). A room's walkable area is a union of rectangles;
// paths are found on a coarse grid, then straightened so people walk in lines, not steps.

export interface P {
  x: number;
  z: number;
}

export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export interface Walkable {
  cell: number; // grid size in metres used for path finding
  rects: Rect[];
}

const EPS = 1e-6;

export function isWalkable(p: P, w: Walkable): boolean {
  return w.rects.some((r) => p.x >= r.x0 - EPS && p.x <= r.x1 + EPS && p.z >= r.z0 - EPS && p.z <= r.z1 + EPS);
}

export function nearestWalkable(p: P, w: Walkable): P {
  if (isWalkable(p, w)) return p;
  let best = p;
  let bestD = Infinity;
  for (const r of w.rects) {
    const q = { x: Math.min(r.x1, Math.max(r.x0, p.x)), z: Math.min(r.z1, Math.max(r.z0, p.z)) };
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return best;
}

function lineIsWalkable(a: P, b: P, w: Walkable): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (w.cell / 4)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!isWalkable({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, w)) return false;
  }
  return true;
}

function bounds(w: Walkable) {
  return {
    x0: Math.min(...w.rects.map((r) => r.x0)),
    z0: Math.min(...w.rects.map((r) => r.z0)),
    x1: Math.max(...w.rects.map((r) => r.x1)),
    z1: Math.max(...w.rects.map((r) => r.z1)),
  };
}

/** Waypoints from `from` to `to` (both snapped inside the area), first and last included. */
export function findPath(from: P, to: P, w: Walkable): P[] {
  const a = nearestWalkable(from, w);
  const b = nearestWalkable(to, w);
  if (lineIsWalkable(a, b, w)) return [a, b];

  const box = bounds(w);
  const cols = Math.ceil((box.x1 - box.x0) / w.cell) + 1;
  const rows = Math.ceil((box.z1 - box.z0) / w.cell) + 1;
  const at = (c: number, r: number): P => ({ x: box.x0 + c * w.cell, z: box.z0 + r * w.cell });
  const cellOf = (p: P) => [Math.round((p.x - box.x0) / w.cell), Math.round((p.z - box.z0) / w.cell)];
  const ok = (c: number, r: number) => c >= 0 && r >= 0 && c < cols && r < rows && isWalkable(at(c, r), w);
  const key = (c: number, r: number) => r * cols + c;

  // Grid cells closest to the ends that are walkable themselves.
  const snap = (p: P) => {
    const [c, r] = cellOf(p);
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let dc = -2; dc <= 2; dc++)
      for (let dr = -2; dr <= 2; dr++) {
        if (!ok(c + dc, r + dr)) continue;
        const q = at(c + dc, r + dr);
        const d = Math.hypot(q.x - p.x, q.z - p.z);
        if (d < bestD) (bestD = d), (best = [c + dc, r + dr]);
      }
    return best;
  };
  const s = snap(a);
  const g = snap(b);
  if (!s || !g) return [a, b];

  // A* over 8-connected cells; diagonals only when both sides are open (no corner cutting).
  const open = new Map<number, [number, number]>([[key(...s), s]]);
  const gScore = new Map<number, number>([[key(...s), 0]]);
  const came = new Map<number, number>();
  const h = (c: number, r: number) => Math.hypot(c - g[0], r - g[1]);
  const f = new Map<number, number>([[key(...s), h(...s)]]);
  while (open.size) {
    let curK = -1;
    let cur: [number, number] = s;
    let bestF = Infinity;
    for (const [k, v] of open) {
      const fv = f.get(k) ?? Infinity;
      if (fv < bestF) (bestF = fv), (curK = k), (cur = v);
    }
    if (cur[0] === g[0] && cur[1] === g[1]) break;
    open.delete(curK);
    for (let dc = -1; dc <= 1; dc++)
      for (let dr = -1; dr <= 1; dr++) {
        if (!dc && !dr) continue;
        const nc = cur[0] + dc;
        const nr = cur[1] + dr;
        if (!ok(nc, nr)) continue;
        if (dc && dr && (!ok(cur[0] + dc, cur[1]) || !ok(cur[0], cur[1] + dr))) continue;
        const nk = key(nc, nr);
        const tentative = (gScore.get(curK) ?? 0) + Math.hypot(dc, dr);
        if (tentative < (gScore.get(nk) ?? Infinity)) {
          came.set(nk, curK);
          gScore.set(nk, tentative);
          f.set(nk, tentative + h(nc, nr));
          open.set(nk, [nc, nr]);
        }
      }
  }
  const gk = key(...g);
  if (!came.has(gk) && gk !== key(...s)) return [a, b];
  const cells: P[] = [];
  for (let k: number | undefined = gk; k !== undefined; k = came.get(k)) cells.push(at(k % cols, Math.floor(k / cols)));
  cells.reverse();

  // Straighten: from each kept point, jump to the farthest point still in plain sight.
  const raw = [a, ...cells, b];
  const out: P[] = [a];
  let i = 0;
  while (i < raw.length - 1) {
    let j = raw.length - 1;
    while (j > i + 1 && !lineIsWalkable(raw[i], raw[j], w)) j--;
    out.push(raw[j]);
    i = j;
  }
  return out;
}

/** Where someone walking `path` at `speed` m/s is after `t` seconds. Heading 0 faces +z. */
export function positionAt(path: P[], t: number, speed: number) {
  let left = Math.max(0, t) * speed;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    if (left <= len || i === path.length - 1) {
      const k = len > 0 ? Math.min(1, left / len) : 1;
      const done = i === path.length - 1 && left >= len;
      return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, heading, done };
    }
    left -= len;
  }
  const p = path[path.length - 1] ?? { x: 0, z: 0 };
  return { x: p.x, z: p.z, heading: 0, done: true };
}
