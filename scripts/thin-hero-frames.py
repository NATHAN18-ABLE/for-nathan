"""Thin the hero scroll film for the web and add a low-resolution preview of all of it.

The first build interpolated the clips to 48 fps (192 fps for the zoom) and kept 736 frames:
37 MB on computers, 26 MB on phones. That is more than a first visit can download while the
visitor is already scrolling, and more than a phone wants to decode. The canvas cross-fades
neighbouring frames, so far fewer frames scrub just as smoothly.

This keeps N frames picked at even steps of visual change (from timing.json's curve), writes
them smaller (phones at 576x1024), and packs a small copy of every kept frame into a few
preview sheets that load first, so any point of the film can be shown at once.

Frames are written once from the full-quality source frames (pass the folder holding the
original public/hero, e.g. from `git archive`), so nothing is compressed twice.

Usage: python3 scripts/thin-hero-frames.py <source public/hero folder> [frames=300]
"""
import json, math, shutil, sys, tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HERO = ROOT / "public/hero"
SETS = {
    # name: (frame size or None to keep, WebP quality, preview tile size)
    "d": (None, 70, (192, 108)),
    "m": ((648, 1152), 66, (108, 192)),
}
COLS, ROWS = 10, 6  # tiles per preview sheet


def pick(curve, n):
    """n indices whose positions on the visual-change curve are evenly spaced."""
    out = []
    for k in range(n):
        target = k / (n - 1)
        i = min(range(len(curve)), key=lambda j: abs(curve[j] - target))
        if out and i <= out[-1]:
            i = out[-1] + 1
        out.append(min(i, len(curve) - 1))
    out[-1] = len(curve) - 1
    return sorted(set(out))


def main():
    source = Path(sys.argv[1])
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 300
    timing = json.loads((source / "timing.json").read_text())
    seg = timing["segments"][0]
    curve = seg["curve"]
    keep = pick(curve, n)
    n = len(keep)
    per = COLS * ROWS
    sheets = math.ceil(n / per)

    for name, (size, quality, tile) in SETS.items():
        src = source / name
        dst = HERO / name
        tmp = Path(tempfile.mkdtemp())
        sheet_imgs = [Image.new("RGB", (tile[0] * COLS, tile[1] * ROWS)) for _ in range(sheets)]
        for k, i in enumerate(keep):
            im = Image.open(src / f"{i + 1:04d}.webp").convert("RGB")
            if size and im.size != size:
                im = im.resize(size, Image.LANCZOS)
            im.save(tmp / f"{k + 1:04d}.webp", "WEBP", quality=quality, method=6)
            s, t = divmod(k, per)
            sheet_imgs[s].paste(im.resize(tile, Image.LANCZOS), ((t % COLS) * tile[0], (t // COLS) * tile[1]))
        for s, img in enumerate(sheet_imgs):
            img.save(tmp / f"preview-{s + 1}.webp", "WEBP", quality=46, method=6)
        for f in dst.glob("*.webp"):
            f.unlink()
        for f in tmp.iterdir():
            shutil.move(str(f), dst / f.name)
        size_mb = sum(f.stat().st_size for f in dst.glob("0*.webp")) / 1e6
        prev_kb = sum(f.stat().st_size for f in dst.glob("preview-*.webp")) / 1e3
        print(f"{name}: {n} frames, {size_mb:.1f} MB; previews {sheets} sheets, {prev_kb:.0f} kB")

    c0, c1 = curve[keep[0]], curve[keep[-1]]
    seam = min(range(n), key=lambda k: abs(keep[k] - timing.get("seam", 0)))
    timing = {
        "frames": n,
        "seam": seam,
        "segments": [{"start": 0, "end": n - 1, "total": seg["total"], "curve": [round((curve[i] - c0) / (c1 - c0), 5) for i in keep]}],
        "preview": {"cols": COLS, "rows": ROWS, "sheets": sheets},
    }
    (HERO / "timing.json").write_text(json.dumps(timing))


if __name__ == "__main__":
    main()
