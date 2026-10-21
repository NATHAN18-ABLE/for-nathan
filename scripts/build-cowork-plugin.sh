#!/usr/bin/env bash
# Package the design skills in .claude/skills as a Claude Cowork plugin file.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
name="design-taste-kit"
skills=(design-md-library ui-ux-pro-max hallmark)
out="$root/cowork/$name.plugin"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cp -R "$root/cowork/$name/." "$work/"
mkdir -p "$work/skills"
for s in "${skills[@]}"; do
  cp -R "$root/.claude/skills/$s" "$work/skills/$s"
done
find "$work" \( -name __pycache__ -o -name .DS_Store \) -prune -exec rm -rf {} +

rm -f "$out"
(cd "$work" && zip -qr -X "$out" .)
echo "Built $out"
