"""Check skills against claude.ai upload rules: name format and reserved words,
folder matches name, description present, at most 1024 characters, no angle brackets.

Usage: python3 scripts/check-skills.py <skills-dir>
"""
import re, sys, pathlib
bad = 0
for md in sorted(pathlib.Path(sys.argv[1]).glob("*/SKILL.md")):
    text = md.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        print(f"{md.parent.name}: no frontmatter"); bad += 1; continue
    head = m.group(1)
    name = re.search(r"^name:\s*(.+)$", head, re.M)
    name = name.group(1).strip().strip('"\'') if name else ""
    dm = re.search(r"^description:\s*(.*?)(?=^\S[\w-]*:|\Z)", head, re.M | re.S)
    desc = dm.group(1).strip() if dm else ""
    desc = re.sub(r"^[>|][-+]?\s*", "", desc)
    desc = " ".join(desc.split()).strip('"\'')
    problems = []
    if not re.fullmatch(r"[a-z0-9-]{1,64}", name): problems.append(f"name format {name!r}")
    if re.search(r"claude|anthropic", name): problems.append(f"reserved word in name {name!r}")
    if name != md.parent.name: problems.append(f"folder {md.parent.name!r} != name {name!r}")
    if not desc: problems.append("empty description")
    if len(desc) > 1024: problems.append(f"description {len(desc)} chars")
    if re.search(r"[<>]", desc): problems.append("angle brackets in description")
    if re.search(r"^tools:", head, re.M): problems.append("'tools:' field")
    if problems:
        bad += 1; print(f"{md.parent.name}: " + "; ".join(problems))
print(f"checked {len(list(pathlib.Path(sys.argv[1]).glob('*/SKILL.md')))} skills, {bad} with problems")
sys.exit(1 if bad else 0)
