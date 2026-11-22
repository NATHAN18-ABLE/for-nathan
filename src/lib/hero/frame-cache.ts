// Decoded frames are large (a 1280x720 bitmap is ~3.7 MB), so only a window around
// the current frame is kept decoded; the rest stay as compressed blobs.

// Indices to drop so at most `max` remain, farthest from `center` first.
export function evictions(cached: number[], center: number, max: number): number[] {
  if (cached.length <= max) return [];
  return [...cached]
    .sort((a, b) => Math.abs(b - center) - Math.abs(a - center))
    .slice(0, cached.length - max);
}

// Frames worth decoding next, nearest first, with more of them in the scroll direction.
export function wanted(center: number, direction: 1 | -1, total: number, behind: number, ahead: number): number[] {
  const out = [center];
  for (let d = 1; d <= Math.max(behind, ahead); d++) {
    if (d <= ahead) out.push(center + direction * d);
    if (d <= behind) out.push(center - direction * d);
  }
  return out.filter((i) => i >= 0 && i < total);
}

/**
 * Which frame to download next (`got[i]` is non-zero once frame i is fetched or on its way).
 * Scrolling runs through frames faster than a phone can download them, so the order matters:
 * 1. the opening, every frame, so the first moment of scrolling is smooth;
 * 2. a thin skeleton, every 24th frame, so wherever the visitor scrolls something close exists;
 * 3. the stretch just ahead of the visitor (and a little behind), every frame;
 * 4. finer passes over the whole film, then everything else.
 */
export function nextToFetch(got: ArrayLike<number>, center: number, direction: 1 | -1, opening = 24, skeleton = 24, ahead = 120, behind = 16): number | undefined {
  const n = got.length;
  for (let i = 0; i < Math.min(n, opening); i++) if (!got[i]) return i;
  for (let i = 0; i < n; i += skeleton) if (!got[i]) return i;
  if (n > 0 && !got[n - 1]) return n - 1;
  const at = (d: number) => {
    const i = center + d;
    return i >= 0 && i < n && !got[i] ? i : undefined;
  };
  // the next stretch in the scroll direction first, then a little behind, then further ahead
  for (let d = 0; d < Math.min(40, ahead); d++) if (at(direction * d) !== undefined) return at(direction * d);
  for (let d = 1; d <= behind; d++) if (at(-direction * d) !== undefined) return at(-direction * d);
  for (let d = 40; d < ahead; d++) if (at(direction * d) !== undefined) return at(direction * d);
  for (const step of [8, 4, 2, 1]) for (let i = 0; i < n; i += step) if (!got[i]) return i;
  return undefined;
}

/** The closest frame to `i` that has arrived, within `reach`; null if there is none. */
export function nearestAvailable(i: number, have: (k: number) => boolean, reach: number): number | null {
  for (let d = 0; d <= reach; d++) {
    if (have(i + d)) return i + d;
    if (d && have(i - d)) return i - d;
  }
  return null;
}
