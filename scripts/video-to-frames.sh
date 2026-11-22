#!/usr/bin/env bash
# Turn a clip into a scroll-scrub image sequence (WebP) plus a poster frame.
# Usage: scripts/video-to-frames.sh <input.mp4> <out-dir> [width=1920] [fps=24]
set -euo pipefail
in="$1"; out="$2"; width="${3:-1920}"; fps="${4:-24}"
mkdir -p "$out"
ffmpeg -loglevel error -y -i "$in" -vf "fps=${fps},scale=${width}:-2:flags=lanczos" -c:v libwebp -quality 78 "$out/%04d.webp"
ffmpeg -loglevel error -y -i "$in" -vf "scale=${width}:-2:flags=lanczos" -frames:v 1 "$out/poster.jpg"
echo "$(ls "$out"/*.webp | wc -l) frames, $(du -sh "$out" | cut -f1) in $out"
