"""Build the hero scroll assets from the two approved clips.

Outputs into public/hero/:
  d/0001.webp ...   desktop frames, 1280 wide
  m/0001.webp ...   mobile portrait frames, 720x1280, cropped around N Seoul Tower
  poster-d.jpg, poster-m.jpg   first frame for instant paint
  night-d.jpg, night-m.jpg     last frame, softly blurred and dimmed, used behind the
                               question card and on the test page
  timing.json   per-segment cumulative visual change, used to map scroll to frames
                so the speed feels even (the zoom clip front-loads its motion)

The joined 24 fps sequence is motion-interpolated to 48 fps, so scrubbing has twice
as many real in-between frames instead of cross-fading neighbours (which ghosts on
the fast part of the zoom).
"""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VID = ROOT / "assets/incoming/video"
OUT = ROOT / "public/hero"
CLIPS = [VID / "test-a-day-only.mp4", VID / "video-2-zoom.mp4"]
TOWER_X = 0.573  # tower position in both clips, measured on the frames
SEAM_24 = 119    # last frame of clip A in the joined 24 fps sequence
INTERP = "minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"

def run(*args):
    subprocess.run([str(a) for a in args], check=True)

def gray_frames(path, w=320, h=180):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-vf",
                          f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)

def main():
    tmp = Path(tempfile.mkdtemp())
    for sub in ("d", "m"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
        for f in (OUT / sub).glob("*.webp"):
            f.unlink()
    for stale in ("ridge.json",):
        (OUT / stale).unlink(missing_ok=True)

    # Clip A minus its last frame (identical to clip 2's first frame), then clip 2.
    join = "[0:v]trim=end_frame=120,setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1"
    crop = f"crop=ih*9/16:ih:iw*{TOWER_X}-ih*9/32:0"
    for name, chain in (("d", "scale=1280:-2:flags=lanczos"), ("m", f"{crop},scale=720:1280:flags=lanczos")):
        clip = tmp / f"{name}.mp4"
        run("ffmpeg", "-loglevel", "error", "-y", "-i", CLIPS[0], "-i", CLIPS[1], "-filter_complex",
            f"{join},{chain},{INTERP}[v]", "-map", "[v]", "-c:v", "libx264", "-crf", "12", clip)
        q = "60" if name == "d" else "58"
        run("ffmpeg", "-loglevel", "error", "-y", "-i", clip, "-c:v", "libwebp", "-quality", q,
            OUT / name / "%04d.webp")
        run("ffmpeg", "-loglevel", "error", "-y", "-i", clip, "-frames:v", "1", "-q:v", "3",
            OUT / f"poster-{name}.jpg")
        run("ffmpeg", "-loglevel", "error", "-y", "-sseof", "-0.05", "-i", clip, "-frames:v", "1",
            "-vf", "gblur=sigma=14,eq=brightness=-0.06:saturation=1.1", "-q:v", "4",
            OUT / f"night-{name}.jpg")
        if name == "d":
            g = gray_frames(clip)

    n = len(g)
    seam = SEAM_24 * 2  # 48 fps index of the seam
    def segment(idx):
        d = np.abs(np.diff(g[idx], axis=0)).mean(axis=(1, 2))
        c = np.concatenate([[0.0], np.cumsum(d)])
        return {"start": idx[0], "end": idx[-1], "total": round(float(c[-1]), 1),
                "curve": (c / c[-1]).round(5).tolist()}
    # "total" lets the page give each clip scroll length in proportion to how much
    # the picture changes, so the speed matches across the seam.
    timing = {"frames": n, "segments": [segment(list(range(0, seam + 1))), segment(list(range(seam, n)))]}
    (OUT / "timing.json").write_text(json.dumps(timing))
    print(n, "frames; seam at", seam)

if __name__ == "__main__":
    sys.exit(main())
