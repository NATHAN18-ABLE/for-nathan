#!/usr/bin/env bash
# Build a static copy and publish it to the gh-pages branch (GitHub Pages).
# Live at https://nathan18-able.github.io/for-nathan/ ; the site is public.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf out
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/for-nathan NEXT_TELEMETRY_DISABLED=1 npx next build
touch out/.nojekyll   # keep the _next folder, which Jekyll would otherwise drop
url=$(git remote get-url origin)
tmp=$(mktemp -d)
cp -r out/. "$tmp"
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" -c user.name="$(git log -1 --format=%an)" -c user.email="$(git log -1 --format=%ae)" \
  commit -q -m "Deploy static preview of Seoul, Curated"
git -C "$tmp" push -f "$url" gh-pages
rm -rf "$tmp"
echo "Published to https://nathan18-able.github.io/for-nathan/"
