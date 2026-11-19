#!/bin/sh
# 최종 발표 빌드: 사진 가공 → pptx → 검증 → PDF/PNG 렌더
set -e
cd "$(dirname "$0")"
export NODE_PATH="$PWD/node_modules"
python3 -I tools/prep_photos.py >/dev/null
node deck-report.js
python3 /mnt/skills/public/pptx/scripts/office/validate.py leadership-final.pptx | tail -3
mkdir -p review-report
python3 /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir review-report leadership-final.pptx >/dev/null 2>&1
rm -f review-report/s-*.png
pdftoppm -r 100 -png review-report/leadership-final.pdf review-report/s
