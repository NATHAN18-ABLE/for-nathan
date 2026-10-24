#!/bin/sh
# 빌드 → 검증 → PDF/PNG 렌더
set -e
cd "$(dirname "$0")"
export NODE_PATH="$PWD/node_modules"
node deck.js
python3 /mnt/skills/public/pptx/scripts/office/validate.py leadership-plan.pptx | tail -3
mkdir -p review
python3 /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir review leadership-plan.pptx >/dev/null 2>&1
rm -f review/s-*.png
pdftoppm -r 100 -png review/leadership-plan.pdf review/s
