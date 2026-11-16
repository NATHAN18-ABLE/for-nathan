"""Build the hero scroll assets from the two approved clips.

Outputs into public/hero/:
  d/0001.webp ...   desktop frames, 1280 wide
  m/0001.webp ...   mobile portrait frames, 720x1280, cropped around N Seoul Tower
  poster-d.jpg, poster-m.jpg   first frame for instant paint
  night-d.jpg, night-m.jpg     last frame, softly blurred and dimmed, used behind the
                               welcome line and on the test page
  timing.json   cumulative visual change across the frames, used to map scroll to frames

Clip A (the camera drifting down at sunset) changes slowly and evenly, so it is
motion-interpolated to 48 fps. The zoom clip starts fast and settles, so at 48 fps
its first second moved about four times as far per frame as clip A did and the seam
felt like a stutter. It is interpolated to 192 fps instead, and frames are picked so
every step changes the picture by the same amount as a step of clip A.
"""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VID = ROOT / "assets/incoming/video"
OUT = ROOT / "public/hero"
CLIPS = [VID / "test-a-day-only.mp4", VID / "video-2-zoom.mp4"]
TOWER_X = 0.573  # tower position in both clips, measured on the frames
INTERP = "minterpolate=fps={fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"

def run(*args):
    subprocess.run([str(a) for a in args], check=True)

def gray_frames(path, w=320, h=180):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-vf",
                          f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)

def frames_of(clip, out_dir, quality):
    out_dir.mkdir(parents=True, exist_ok=True)
    run("ffmpeg", "-loglevel", "error", "-y", "-i", clip, "-c:v", "libwebp", "-quality", quality,
        out_dir / "%05d.webp")
    return sorted(out_dir.glob("*.webp"))

def pick_even(g, step):
    """Indices into g whose neighbours differ by about `step`, starting after frame 0."""
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
    c = np.concatenate([[0.0], np.cumsum(d)])
    picks, k = [], 1
    while k * step <= c[-1]:
        i = int(np.argmin(np.abs(c - k * step)))
        if not picks or i > picks[-1]:
            picks.append(i)
        k += 1
    if picks[-1] != len(g) - 1:
        picks.append(len(g) - 1)
    return picks

def main():
    tmp = Path(tempfile.mkdtemp())
    for sub in ("d", "m"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)
        for f in (OUT / sub).glob("*.webp"):
            f.unlink()

    crop = f"crop=ih*9/16:ih:iw*{TOWER_X}-ih*9/32:0"
    chains = {"d": "scale=1280:-2:flags=lanczos", "m": f"{crop},scale=720:1280:flags=lanczos"}
    clips = {}
    for name, chain in chains.items():
        for i, fps in ((0, 48), (1, 192)):
            clip = tmp / f"{name}{i}.mp4"
            run("ffmpeg", "-loglevel", "error", "-y", "-i", CLIPS[i], "-vf",
                f"{chain},{INTERP.format(fps=fps)}", "-c:v", "libx264", "-crf", "12", clip)
            clips[name, i] = clip

    # Measure on the desktop set; the mobile set shares the same source frames.
    ga, gb = gray_frames(clips["d", 0]), gray_frames(clips["d", 1])
    step = float(np.abs(np.diff(ga, axis=0)).mean(axis=(1, 2)).mean())
    picks = pick_even(gb, step)
    print(f"clip A {len(ga)} frames at step {step:.2f}; zoom {len(gb)} -> {len(picks)} picked")

    for name in chains:
        q = "60" if name == "d" else "58"
        a = frames_of(clips[name, 0], tmp / f"{name}-a", q)
        b = frames_of(clips[name, 1], tmp / f"{name}-b", q)
        seq = a + [b[i] for i in picks]
        for n, src in enumerate(seq, 1):
            src.replace(OUT / name / f"{n:04d}.webp")
        run("ffmpeg", "-loglevel", "error", "-y", "-i", clips[name, 0], "-frames:v", "1", "-q:v", "3",
            OUT / f"poster-{name}.jpg")
        run("ffmpeg", "-loglevel", "error", "-y", "-sseof", "-0.02", "-i", clips[name, 1], "-frames:v", "1",
            "-vf", "gblur=sigma=14,eq=brightness=-0.06:saturation=1.1", "-q:v", "4",
            OUT / f"night-{name}.jpg")

    g = np.concatenate([ga, gb[picks]])
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
    c = np.concatenate([[0.0], np.cumsum(d)])
    n = len(g)
    timing = {"frames": n, "seam": len(ga) - 1, "segments": [
        {"start": 0, "end": n - 1, "total": round(float(c[-1]), 1), "curve": (c / c[-1]).round(5).tolist()}]}
    (OUT / "timing.json").write_text(json.dumps(timing))
    steps = np.round(d[len(ga) - 12:len(ga) + 24], 2).tolist()
    print(n, "frames; steps across the seam:", steps)

if __name__ == "__main__":
    sys.exit(main())
