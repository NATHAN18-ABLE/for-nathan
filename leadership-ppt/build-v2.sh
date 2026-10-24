#!/bin/sh
# v2 빌드 → 검증 → PDF/PNG 렌더
set -e
cd "$(dirname "$0")"
export NODE_PATH="$PWD/node_modules"
node deck-v2.js
python3 /mnt/skills/public/pptx/scripts/office/validate.py leadership-plan-v2.pptx | tail -3
mkdir -p review-v2
python3 /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir review-v2 leadership-plan-v2.pptx >/dev/null 2>&1
rm -f review-v2/s-*.png
pdftoppm -r 100 -png review-v2/leadership-plan-v2.pdf review-v2/s
