#!/bin/sh
# 최종본 빌드 → 검증 → PDF/PNG 렌더
set -e
cd "$(dirname "$0")"
export NODE_PATH="$PWD/node_modules"
node deck-final.js
python3 /mnt/skills/public/pptx/scripts/office/validate.py leadership-plan-final.pptx | tail -3
mkdir -p review-final
python3 /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir review-final leadership-plan-final.pptx >/dev/null 2>&1
rm -f review-final/s-*.png
pdftoppm -r 100 -png review-final/leadership-plan-final.pdf review-final/s
