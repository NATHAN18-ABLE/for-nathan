"""Print the 넾다세일 logo on the neon-green packing tape of an AI keyframe, like real branded tape.
The logo runs along the tape (rotated), repeats, is clipped to the detected tape pixels, and is multiplied into the
photo so the tape's own wrinkles and specular highlights stay on top of the ink."""
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage

src, out, spec = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
img = Image.open(src).convert('RGB'); a = np.asarray(img).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
tape = ndimage.binary_opening((g > 150) & (g - r > 70) & (g - b > 40), iterations=2)
tape = ndimage.binary_erosion(tape, iterations=spec.get('inset', 3))             # keep ink off the tape edges
logo = Image.open('assets/kv/logo_black_2000.png').convert('RGBA')
x0, y0, x1, y1 = spec['box']                       # the straight run of tape to print on (image px)
w, h = x1 - x0, y1 - y0
lh = int(w * spec.get('fill', 0.62)); lw = int(lh * logo.width / logo.height)  # logo height across the tape width
strip = Image.new('L', (h, w), 0)                  # strip laid out along the tape length, then rotated into place
lg = logo.resize((lw, lh), Image.LANCZOS).getchannel('A')
step = lw + int(spec.get('gap', 0.5) * lw); x = int(spec.get('offset', 0.5) * (h - lw)) % step - step
while x < h:
    strip.paste(lg, (x, (w - lh) // 2), lg); x += step
strip = strip.rotate(-90, expand=True)              # reads top → bottom
ink = np.zeros(a.shape[:2]); ink[y0:y1, x0:x1] = np.asarray(strip)[:h, :w] / 255.0
ink *= tape
lum = a.mean(-1, keepdims=True)
highlight = np.clip((lum - 215) / 40, 0, 1) * 255 * 0.55     # gloss of the tape film sits over the ink
k = 0.9 * ink[..., None]
res = a * (1 - k) + highlight * k
Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).save(out, quality=94)
print(out, 'logo', lw, 'x', lh, 'step', step)
