export interface Segment {
  start: number; // first frame index of the clip in the joined sequence
  end: number; // last frame index (shared with the next clip's start at the seam)
  total: number; // how much the picture changes across the clip
  curve: number[]; // cumulative share of that change at each frame, 0..1
}

export interface Timing {
  frames: number;
  segments: Segment[];
}

export interface ScrollWindow {
  from: number;
  to: number;
}

// Give every clip a slice of [from, to] proportional to how much its picture changes,
// so the change per unit of scroll is the same on both sides of a seam.
export function scrollWindows(timing: Timing, from: number, to: number): ScrollWindow[] {
  const sum = timing.segments.reduce((s, seg) => s + seg.total, 0);
  let cursor = from;
  return timing.segments.map((seg, i) => {
    const last = i === timing.segments.length - 1;
    const next = last ? to : cursor + ((to - from) * seg.total) / sum;
    const w = { from: cursor, to: next };
    cursor = next;
    return w;
  });
}

// Fractional frame index for a scroll progress value. Inside a window the progress is
// treated as a share of the clip's visual change, which keeps the perceived speed even.
export function frameAt(progress: number, timing: Timing, windows: ScrollWindow[]): number {
  const segs = timing.segments;
  if (progress <= windows[0].from) return segs[0].start;
  for (let i = 0; i < segs.length; i++) {
    const w = windows[i];
    if (progress > w.to) continue;
    const t = (progress - w.from) / (w.to - w.from);
    const c = segs[i].curve;
    let k = 0;
    while (k < c.length - 2 && c[k + 1] < t) k++;
    const span = c[k + 1] - c[k];
    const frac = span > 0 ? (t - c[k]) / span : 0;
    return segs[i].start + k + Math.min(1, Math.max(0, frac));
  }
  return segs[segs.length - 1].end;
}
