"""Build the hero scroll assets from the two approved clips.

Outputs into public/hero/:
  d/0001.webp ... desktop frames (1280 wide)
  m/0001.webp ... mobile portrait frames (720x1280, cropped around N Seoul Tower)
  poster-d.jpg, poster-m.jpg   first frame for instant paint
  timing.json  per-segment cumulative visual change, used to map scroll to frames
               so the camera speed feels even (video 2 front-loads its motion)
  ridge.json   Namsan ridge line and tower geometry of the last frame, normalized,
               for the cobalt line drawing that follows the photo
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VID = ROOT / "assets/incoming/video"
OUT = ROOT / "public/hero"
CLIPS = [VID / "test-a-day-only.mp4", VID / "video-2-zoom.mp4"]
TOWER_X = 0.573  # tower position in both clips, measured on the frames

def run(*args):
    subprocess.run(args, check=True)

def gray_frames(path, w=320, h=180):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-vf",
                          f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)

def main():
    for sub in ("d", "m"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
        for f in (OUT / sub).glob("*.webp"):
            f.unlink()
    combined = OUT / "_combined.mp4"
    # Clip A minus its last frame (identical to clip 2's first frame), then clip 2.
    run("ffmpeg", "-loglevel", "error", "-y", "-i", str(CLIPS[0]), "-i", str(CLIPS[1]),
        "-filter_complex",
        "[0:v]trim=end_frame=120,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[v]",
        "-map", "[v]", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", str(combined))
    run("ffmpeg", "-loglevel", "error", "-y", "-i", str(combined), "-vf",
        "scale=1280:-2:flags=lanczos", "-c:v", "libwebp", "-quality", "62", str(OUT / "d/%04d.webp"))
    crop = f"crop=ih*9/16:ih:iw*{TOWER_X}-ih*9/32:0,scale=720:1280:flags=lanczos"
    run("ffmpeg", "-loglevel", "error", "-y", "-i", str(combined), "-vf", crop,
        "-c:v", "libwebp", "-quality", "60", str(OUT / "m/%04d.webp"))
    run("ffmpeg", "-loglevel", "error", "-y", "-i", str(combined), "-vf", "scale=1280:-2",
        "-frames:v", "1", "-q:v", "3", str(OUT / "poster-d.jpg"))
    run("ffmpeg", "-loglevel", "error", "-y", "-i", str(combined), "-vf", crop,
        "-frames:v", "1", "-q:v", "3", str(OUT / "poster-m.jpg"))

    g = gray_frames(combined)
    n = len(g)
    seg_a = list(range(0, 120))          # frames 0..119 come from clip A
    seg_b = list(range(119, n))          # 119 is the seam, shared by both curves
    def segment(idx):
        d = np.abs(np.diff(g[idx], axis=0)).mean(axis=(1, 2))
        c = np.concatenate([[0.0], np.cumsum(d)])
        return {"start": idx[0], "end": idx[-1], "total": round(float(c[-1]), 1),
                "curve": (c / c[-1]).round(5).tolist()}
    # "total" lets the page give each clip scroll length in proportion to how much
    # the picture changes, so the speed matches across the seam.
    timing = {"frames": n, "segments": [segment(seg_a), segment(seg_b)]}
    (OUT / "timing.json").write_text(json.dumps(timing))

    # Ridge line and tower on the last frame.
    last = subprocess.run(["ffmpeg", "-loglevel", "error", "-sseof", "-0.05", "-i", str(combined),
                           "-vf", "scale=960:540", "-frames:v", "1", "-f", "rawvideo",
                           "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    img = np.frombuffer(last, np.uint8).reshape(540, 960, 3).astype(np.float32)
    blue_minus_green = img[..., 2] - img[..., 1]
    lum = img.mean(axis=2)
    ridge = []
    for x in range(0, 960, 8):
        col = (blue_minus_green[:, x] < 25) & (lum[:, x] < 90)
        start = 200
        ys = np.where(col[start:])[0]
        if len(ys):
            # first run of at least 6 mountain pixels avoids thin antenna lattices
            y = None
            for k in ys:
                if col[start + k:start + k + 6].all():
                    y = start + k
                    break
            if y is not None:
                ridge.append([round(x / 960, 4), round(y / 540, 4)])
    # Drop ridge samples that climbed the tower or the side antennas, then smooth.
    pts = np.array(ridge)
    on_mast = ((pts[:, 0] > 0.535) & (pts[:, 0] < 0.61)) | ((pts[:, 0] > 0.44) & (pts[:, 0] < 0.475)) \
        | ((pts[:, 0] > 0.755) & (pts[:, 0] < 0.795))
    ys = np.interp(pts[:, 0], pts[~on_mast, 0], pts[~on_mast, 1])
    ys = np.convolve(np.pad(ys, (2, 2), mode="edge"), np.ones(5) / 5, mode="valid")
    ridge = [[round(float(x), 4), round(float(y), 4)] for x, y in zip(pts[:, 0], ys)]
    # Tower and antenna geometry measured by eye on the last frame (960x540).
    tower = {"x": 0.574, "tip": 0.296, "antennaBase": 0.55, "deckTop": 0.555, "deckBottom": 0.61,
             "deckHalfWidth": 0.02, "shaftHalfWidth": 0.011, "base": 0.785}
    antennas = [{"x": 0.458, "top": 0.59, "base": 0.78}, {"x": 0.775, "top": 0.595, "base": 0.825}]
    (OUT / "ridge.json").write_text(json.dumps({"ridge": ridge, "tower": tower, "antennas": antennas}))
    combined.unlink()
    print(n, "frames; ridge points", len(ridge))

if __name__ == "__main__":
    sys.exit(main())
