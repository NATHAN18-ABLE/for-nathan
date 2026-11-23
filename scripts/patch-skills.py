"""Re-apply this repo's local changes to upstream skills after an install or update.

Usage: python3 scripts/patch-skills.py <skills-dir>

Every change is idempotent, and a skill that is not installed is skipped.
"""
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
    lines = [
        'description: "' + description.replace('"', "'") + '"' if line.startswith("description:") else line
        for line in head.split("\n")
    ]
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
