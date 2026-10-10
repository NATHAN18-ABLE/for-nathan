"""Trace the official KV banner shards (green / purple / black) into per-shard vector pieces -> motion/kv_pieces.json.
Pieces are traced from the official artwork, not redrawn, so they can be re-laid-out and animated as the real KV shapes."""
import sys, json, numpy as np, potrace
from PIL import Image, ImageFilter
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
UP = 4
im = Image.open(src).convert('RGB')
big = im.resize((im.width * UP, im.height * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.5))
a = np.asarray(big).astype(int)
PAL = {'green': (0, 245, 80), 'purple': (145, 98, 255), 'black': (0, 0, 0), 'white': (255, 255, 255)}
dist = np.stack([((a - np.array(c)) ** 2).sum(-1) for c in PAL.values()], -1)
lab = dist.argmin(-1)
names = list(PAL)
# anti-aliased grey fringes must not become purple/green: colour only when the pixel is truly close to the swatch
for ci in (0, 1): far = (lab == ci) & (dist[..., ci] > 110 ** 2); lab[far] = np.where(a[far].mean(-1) < 128, 2, 3)
# logo + copy live in the centre white field; their black pixels are not KV shards
TX0, TY0, TX1, TY1 = 640 * UP, 95 * UP, 1200 * UP, 410 * UP
lab[TY0:TY1, TX0:TX1] = 3   # blank the logo/copy field before tracing
pieces = []
for ci, name in enumerate(names[:3]):
    mask = lab == ci
    if name == 'black': mask = ndimage.binary_dilation(mask, iterations=UP)   # tuck under colours: no hairline seams
    comps, n = ndimage.label(mask)
    for k in range(1, n + 1):
        m = comps == k
        if m.sum() < (12 * UP) ** 2: continue
        ys, xs = np.where(m); bb = [xs.min(), ys.min(), xs.max() + 1, ys.max() + 1]
        if name == 'black' and bb[0] >= TX0 and bb[1] >= TY0 and bb[2] <= TX1 and bb[3] <= TY1: continue
        crop = m[bb[1]:bb[3], bb[0]:bb[2]]
        paths = potrace.Bitmap(~crop).trace(turdsize=8 * UP, alphamax=0.2, opticurve=True, opttolerance=0.6)
        ds = []
        for c in paths:
            P = lambda p: f"{(p.x + bb[0]) / UP:.2f},{(p.y + bb[1]) / UP:.2f}"
            d = 'M' + P(c.start_point)
            for s in c.segments:
                d += (f"C{P(s.c1)} {P(s.c2)} {P(s.end_point)}" if not s.is_corner else f"L{P(s.c)} L{P(s.end_point)}")
            ds.append(d + 'Z')
        bbo = [v / UP for v in bb]
        pieces.append({'color': name, 'd': ' '.join(ds), 'bb': bbo, 'c': [(bbo[0] + bbo[2]) / 2, (bbo[1] + bbo[3]) / 2], 'area': int(m.sum() / UP / UP)})
order = {'black': 0, 'green': 1, 'purple': 1}
pieces.sort(key=lambda p: order[p['color']])
json.dump({'w': im.width, 'h': im.height, 'pieces': pieces}, open(out, 'w'))
print(len(pieces), 'pieces:', {n: sum(p['color'] == n for p in pieces) for n in names[:3]})
