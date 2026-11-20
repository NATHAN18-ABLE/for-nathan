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
 * First the opening of the film, every frame, so the first scroll is smooth; then the frames
 * just ahead of where the visitor is (and a few behind); then a coarse pass over the whole
 * film so a fast fling still has something close to show; then everything else in order.
 */
export function nextToFetch(got: ArrayLike<number>, center: number, direction: 1 | -1, opening = 80, ahead = 160, behind = 24): number | undefined {
  const n = got.length;
  for (let i = 0; i < Math.min(n, opening); i++) if (!got[i]) return i;
  for (let d = 0; d < ahead; d++) {
    const i = center + direction * d;
    if (i >= 0 && i < n && !got[i]) return i;
    if (d > 0 && d <= behind) {
      const j = center - direction * d;
      if (j >= 0 && j < n && !got[j]) return j;
    }
  }
  for (let i = 0; i < n; i += 8) if (!got[i]) return i;
  for (let i = 0; i < n; i++) if (!got[i]) return i;
  return undefined;
}
