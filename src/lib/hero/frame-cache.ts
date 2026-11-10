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
