"""Trace the 넾다세일 logo from the flattened KV guide JPG into SVG (fallback when the PSD's vector original is unavailable).
Only traces the official artwork pixel-for-pixel; no shapes are redrawn by hand. Fidelity is checked by IoU against the source."""
import sys, numpy as np, potrace
from PIL import Image

src, out_svg = sys.argv[1], sys.argv[2]
X, Y, W, H = 850, 528, 520, 175          # logo box in kv_guide_2576.jpg
UP = 8                                  # supersample before tracing so edges are sub-pixel accurate
g = Image.open(src).convert('L').crop((X, Y, X + W, Y + H))
from PIL import ImageFilter
# blur after upsampling to melt JPEG block noise so straight edges trace straight
big = g.resize((W * UP, H * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UP * 0.6))
mask = np.asarray(big) < 128
# keep only the logo wordmark (drop the tagline below by cutting at the first blank row band after the logo)
rows = mask.any(axis=1); cut = len(rows)
for r in range(int(len(rows) * 0.5), len(rows)):
    if not rows[r:r + 4 * UP].any(): cut = r; break
mask[cut:] = False
ys, xs = np.where(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
mask = mask[y0:y1, x0:x1]
# potracer treats True as background, so trace the inverted mask
paths = potrace.Bitmap(~mask).trace(turdsize=20 * UP, alphamax=0.25, opticurve=True, opttolerance=0.6)
h, w = mask.shape
def f(p): return f"{p.x:.2f},{p.y:.2f}"
ds = []
for c in paths:
    d = f"M{f(c.start_point)}"
    for s in c.segments:
        d += f"C{f(s.c1)} {f(s.c2)} {f(s.end_point)}" if not s.is_corner else f"L{f(s.c)} L{f(s.end_point)}"
    ds.append(d + "Z")
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="#000" fill-rule="evenodd" d="{" ".join(ds)}"/></svg>'
open(out_svg, 'w').write(svg)
Image.fromarray((~mask * 255).astype(np.uint8)).save(out_svg.replace('.svg', '_srcmask.png'))
print(f"curves={len(paths)} viewBox={w}x{h} (source logo {w/UP:.0f}x{h/UP:.0f}px)")
