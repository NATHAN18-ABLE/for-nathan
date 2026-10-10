// KV-style burst of COMPLETE shards (never cropped by the frame): flat neon/purple blades with the KV's heavy black
// keyline offset to one side, and the lightning notch cut into one edge. Tips point at the centre, like the KV.
export const KVC = { green: '#00F550', purple: '#9162FF', black: '#000000' };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const outBack = (t, s = 1.4) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// blade in local space: inner tip at origin, blade runs along +x
function blade(L, w, notch) {
  // a long needle, sharp at both ends, widest past the middle, with a lightning step on the upper edge
  const p = [[0, 0], [L * 0.56, -w * 0.48]];
  if (notch) p.push([L * 0.50, -w * 1.0]);
  p.push([L, -w * 0.62], [L * 0.68, w * 0.5]);
  return p;
}
function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }

// default layout: 7 blades around an ellipse, longer on the vertical axis (9:16)
const LAYOUT = [
  { a: -96, L: 560, w: 92, c: 'green' },  { a: -52, L: 430, w: 78, c: 'purple' }, { a: -14, L: 250, w: 60, c: 'black' },
  { a: 28, L: 300, w: 70, c: 'green' },   { a: 74, L: 540, w: 92, c: 'purple' },  { a: 112, L: 420, w: 80, c: 'green' },
  { a: 160, L: 260, w: 64, c: 'purple' }, { a: -146, L: 430, w: 80, c: 'green' }, { a: -122, L: 220, w: 54, c: 'black' },
];
// clear: [halfW, halfH] of the copy block the shards must never touch; frame: [W, H] the shards must stay inside
export function burst(ctx, { cx, cy, rx = 320, ry = 300, t = 1, seed = 1, scale = 1, layout = LAYOUT, drift = 0, spin = 0,
                             clear = null, margin = 50, frame = [1080, 1920], pad = 36 } = {}) {
  const R = rng(seed);
  layout.forEach((b, i) => {
    const d = R() * 0.25, k = outBack(clamp((t - d * 0.6) / (1 - d * 0.6)));
    if (t <= d * 0.6) return;
    const a = (b.a + spin) * Math.PI / 180 + (R() - 0.5) * 0.12, ca = Math.cos(a), sa = Math.sin(a);
    // tip distance: just outside the clear box along this ray (or on the ellipse)
    let r = clear ? Math.min(clear[0] / Math.max(1e-3, Math.abs(ca)), clear[1] / Math.max(1e-3, Math.abs(sa))) + margin
                  : Math.hypot(ca * rx, sa * ry);
    r *= 1 + drift * 0.02;
    const tx = cx + ca * r, ty = cy + sa * r;
    // longest blade that still ends inside the frame
    const room = Math.min(ca > 0 ? (frame[0] - pad - tx) / ca : ca < 0 ? (pad - tx) / ca : Infinity,
                          sa > 0 ? (frame[1] - pad - ty) / sa : sa < 0 ? (pad - ty) / sa : Infinity);
    const Lmax = Math.min(b.L * scale, room * 0.97);
    if (Lmax < 120 * scale || tx < pad || tx > frame[0] - pad || ty < pad || ty > frame[1] - pad) return;
    const L = Lmax * k, w = b.w * scale * Math.min(1, Lmax / (b.L * scale) + 0.25) * Math.min(1, k + 0.2), notch = i % 2 === 0;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(a);
    const pts = blade(L, w, notch);
    // black keyline body: same blade, fattened and pushed to one side (the KV's offset black band)
    ctx.save(); ctx.translate(-w * 0.06, w * 0.26); ctx.lineJoin = 'miter'; ctx.miterLimit = 12;
    poly(ctx, pts); ctx.fillStyle = KVC.black; ctx.fill(); ctx.lineWidth = Math.max(10, w * 0.26); ctx.strokeStyle = KVC.black; ctx.stroke(); ctx.restore();
    if (b.c !== 'black') { poly(ctx, pts); ctx.fillStyle = KVC[b.c]; ctx.fill(); }
    ctx.restore();
  });
}
