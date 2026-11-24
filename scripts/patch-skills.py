"""Re-apply this repo's local changes to upstream skills after an install or update.

Usage: python3 scripts/patch-skills.py <skills-dir>

Every change is idempotent, and a skill that is not installed is skipped.
"""
import re
import shutil
import sys
from pathlib import Path

BUILD_ONLY = (
    " Only while building or changing something (code, a site, an app, a video, a deck, a document);"
    " not for questions, research, explanations, installs or configuration."
)

# Superpowers triggers, narrowed to build work (see CLAUDE.md).
DESCRIPTIONS = {
    "brainstorming": "Use before building something new — a website, app, feature, video, deck or other deliverable — when what to make is still open. Explores intent, requirements and design before any building starts. Not for questions, research, explanations, installs, configuration or small edits.",
    "dispatching-parallel-agents": "Use when building something and facing 2+ independent implementation tasks that can be worked on without shared state or sequential dependencies." + BUILD_ONLY,
    "requesting-code-review": "Use when completing implementation work you built, implementing major features, or before merging to verify the work meets requirements." + BUILD_ONLY,
    "verification-before-completion": "Use when about to claim that something you built or changed is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always." + BUILD_ONLY,
    "using-superpowers": "Use when the user explicitly invokes /using-superpowers - establishes how to find and use the superpowers skills for a build task.",
}
MANUAL_ONLY = {"using-superpowers"}

# Upload rules for claude.ai skills (scripts/check-skills.py): a name may not contain
# "claude" or "anthropic", a description stays under 1024 characters with no angle brackets.
RENAMES = {"claude-automation-recommender": "automation-recommender"}
DESCRIPTIONS["earshot"] = "Make and listen to sound with earshot. To make - whenever a product, game, page, animation or film needs a sound and no recording is at hand - UI sounds (taps, toggles, typing, success, error, notifications), foley (footsteps, doors, glass, water, metal, punches, explosions, animals), ambience beds (fire, sea, rain, wind, cafe, street), game sounds (coins, fanfares, 8-bit), drums, motion-design effects and short music loops, one at a time (earshot make) or as a family (make --set / make_set), and build what the catalogue lacks from recorded parts (earshot build, recipes). To listen - whenever you must judge, choose, trim, verify or compare sound you cannot hear - picking SFX, music or ambience, finding the cleanest moment, checking real vs code-synthesized audio, reviewing a soundtrack's timing, sync, loudness and mix, A/B-ing a mix, searching a recipe by listening (earshot forge), or scoring a code-made film from the shipped bank (earshot sfx / kit). Use it before telling anyone how audio sounds."
TEXT_FIXES = {
    "automation-recommender": [("\ntools: ", "\nallowed-tools: ")],
    "hyperframes-audio": [("(`<hf-audio-group>`)", "(the hf-audio-group element)")],
}

# Demo media that the skills never read; they only bloat the plugin.
DROP = {
    "line-art-animation": ["media"],
}

# Style reference sheets: downscale so the plugin stays small.
SHRINK = {
    "cartoon-3d-short": ("references/sheets", 1200, 82),
}


def set_frontmatter(skill_md: Path, description: str, manual_only: bool) -> None:
    text = skill_md.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return
    head, body = text[4:].split("\n---\n", 1)
    def replaced(line: str) -> str:
        # Keep an unquoted description unquoted when YAML allows it.
        plain = not line[len("description:"):].strip().startswith(('"', "'")) and ": " not in description
        return "description: " + (description if plain else '"' + description.replace('"', "'") + '"')

    lines = [replaced(line) if line.startswith("description:") else line for line in head.split("\n")]
    if manual_only and "disable-model-invocation: true" not in lines:
        lines.append("disable-model-invocation: true")
    skill_md.write_text("---\n" + "\n".join(lines) + "\n---\n" + body, encoding="utf-8")


def shrink_images(folder: Path, max_width: int, quality: int) -> None:
    from PIL import Image

    for path in sorted(folder.glob("*.jpg")):
        with Image.open(path) as image:
            if image.width <= max_width:
                continue
            height = round(image.height * max_width / image.width)
            image.convert("RGB").resize((max_width, height), Image.LANCZOS).save(path, quality=quality, optimize=True)


def main(skills: Path) -> None:
    for old, new in RENAMES.items():
        if (skills / old).is_dir():
            shutil.rmtree(skills / new, ignore_errors=True)
            (skills / old).rename(skills / new)
            skill_md = skills / new / "SKILL.md"
            skill_md.write_text(
                re.sub(r"^name: .*$", f"name: {new}", skill_md.read_text(encoding="utf-8"), count=1, flags=re.M),
                encoding="utf-8",
            )
    for name, fixes in TEXT_FIXES.items():
        skill_md = skills / name / "SKILL.md"
        if skill_md.exists():
            text = skill_md.read_text(encoding="utf-8")
            for old, new in fixes:
                text = text.replace(old, new)
            skill_md.write_text(text, encoding="utf-8")
    for name, description in DESCRIPTIONS.items():
        skill_md = skills / name / "SKILL.md"
        if skill_md.exists():
            set_frontmatter(skill_md, description, name in MANUAL_ONLY)
    for name, folders in DROP.items():
        for folder in folders:
            shutil.rmtree(skills / name / folder, ignore_errors=True)
    for name, (folder, max_width, quality) in SHRINK.items():
        target = skills / name / folder
        if target.is_dir():
            shrink_images(target, max_width, quality)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
