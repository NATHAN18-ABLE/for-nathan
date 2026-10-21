# design-taste-kit

Claude Cowork plugin that bundles three design skills. The skill sources live in
`.claude/skills/` of this repository (the same copies Claude Code uses); this folder only
holds the plugin manifest. Build the installable file with `scripts/build-cowork-plugin.sh`.

| Skill | Upstream | What it does |
|---|---|---|
| `design-md-library` | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT) | 84 brand design systems in DESIGN.md format, with an index and usage rules |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT) | Searchable database of styles, palettes, font pairings, UX guidelines (needs Python 3) |
| `hallmark` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) (MIT) | Anti-AI-slop design flow plus `audit`, `redesign`, `study` verbs |

## Install in Cowork

Open `design-taste-kit.plugin` in a Cowork conversation (or drag it into the chat) and accept
the plugin from the preview card.
