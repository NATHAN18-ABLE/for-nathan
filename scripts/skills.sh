#!/usr/bin/env bash
# Install or update skills with the skills CLI, but into the plugin's skills/
# folder instead of .claude/skills, so Claude Code and Cowork both load the one
# copy that ships in the design-taste-kit plugin.
#
#   scripts/skills.sh add <owner/repo> <skill> [skill ...]
#   scripts/skills.sh update [skill ...]      # no names: every skill in skills-lock.json
#
# After copying, scripts/patch-skills.py re-applies this repo's local changes.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/cowork/design-taste-kit/skills"
lock="$root/skills-lock.json"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

install() {
  local src="$1"; shift
  local args=()
  for s in "$@"; do args+=(--skill "$s"); done
  local out
  if ! out="$(cd "$work" && NO_COLOR=1 npx -y skills add "$src" "${args[@]}" -a claude-code --copy -y 2>&1)"; then
    printf '%s\n' "$out" | sed 's/\x1b\[[0-9;?]*[A-Za-z]//g' | grep -vE '^\s*\|?\s*$' | tail -15 >&2
    exit 1
  fi
  for s in "$@"; do
    [ -d "$work/.claude/skills/$s" ] || { echo "skills CLI did not install $s from $src" >&2; exit 1; }
    rm -rf "${dest:?}/$s"
    cp -R "$work/.claude/skills/$s" "$dest/$s"
    echo "installed $s <- $src"
  done
}

case "${1:-}" in
  add)
    [ $# -ge 3 ] || { echo "usage: $0 add <owner/repo> <skill> [skill ...]" >&2; exit 2; }
    shift
    install "$@"
    ;;
  update)
    shift
    # Group the requested lock entries by source and reinstall each group.
    while IFS=$'\t' read -r src names; do
      # shellcheck disable=SC2086
      install "$src" $names
    done < <(python3 -I - "$lock" "$@" <<'EOF'
import json, sys
skills = json.load(open(sys.argv[1]))["skills"]
wanted = sys.argv[2:] or list(skills)
missing = [s for s in wanted if s not in skills]
if missing:
    sys.exit(f"not in skills-lock.json: {', '.join(missing)}")
groups = {}
for s in wanted:
    groups.setdefault(skills[s]["source"], []).append(s)
for src, names in groups.items():
    print(f"{src}\t{' '.join(names)}")
EOF
)
    ;;
  *)
    echo "usage: $0 add <owner/repo> <skill> [skill ...] | update [skill ...]" >&2
    exit 2
    ;;
esac

# Merge the CLI's lock entries for what was installed into the repo lock.
if [ -f "$work/skills-lock.json" ]; then
  python3 -I - "$lock" "$work/skills-lock.json" <<'EOF'
import json, sys
cur = json.load(open(sys.argv[1]))
new = json.load(open(sys.argv[2]))["skills"]
cur["skills"].update(new)
cur["skills"] = dict(sorted(cur["skills"].items()))
open(sys.argv[1], "w").write(json.dumps(cur, indent=2) + "\n")
EOF
fi

python3 -I "$root/scripts/patch-skills.py" "$dest"
