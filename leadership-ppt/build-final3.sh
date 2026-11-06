#!/bin/sh
# 최종본 빌드 → 검증 → PDF/PNG 렌더
set -e
cd "$(dirname "$0")"
export NODE_PATH="$PWD/node_modules"
node deck-final3.js
python3 /mnt/skills/public/pptx/scripts/office/validate.py leadership-plan-final3.pptx | tail -3
mkdir -p review-final3
python3 /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir review-final3 leadership-plan-final3.pptx >/dev/null 2>&1
rm -f review-final3/s-*.png
pdftoppm -r 100 -png review-final3/leadership-plan-final3.pdf review-final3/s
