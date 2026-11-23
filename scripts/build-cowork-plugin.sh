#!/usr/bin/env bash
# Package cowork/design-taste-kit (skills, MCP servers, manifest) as a plugin file.
# build-site gets a pipeline.md copied from the CLAUDE.md pipeline sections,
# since Cowork has no project CLAUDE.md.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
name="design-taste-kit"
out="$root/cowork/$name.plugin"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

cp -R "$root/cowork/$name/." "$work/"
find "$work" \( -name __pycache__ -o -name .DS_Store -o -name node_modules -o -name .venv \) -prune -exec rm -rf {} +

pipeline="$work/skills/build-site/pipeline.md"
{
  echo "<!-- Generated from CLAUDE.md by scripts/build-cowork-plugin.sh. <skills>/ = the plugin's skills/ folder. -->"
  echo
  sed -n '/^## 사이트 제작 파이프라인/,$p' "$root/CLAUDE.md"
} > "$pipeline"
grep -q '^| 1\.' "$pipeline" || { echo "pipeline table not found in CLAUDE.md" >&2; exit 1; }

rm -f "$out"
(cd "$work" && zip -qr -X "$out" .)
echo "Built $out ($(ls "$work/skills" | wc -l | tr -d ' ') skills, $(du -h "$out" | cut -f1))"
