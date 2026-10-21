# design-taste-kit

Claude Cowork plugin that bundles every design skill installed in this repository's
`.claude/skills/` (the same copies Claude Code uses). This folder only holds the plugin
manifest; build the installable file with `scripts/build-cowork-plugin.sh`.

Start with the `build-site` skill: it runs the whole pipeline in order. Its `pipeline.md` is
generated from the "사이트 제작 파이프라인" section of `CLAUDE.md` at build time.

| Stage | Skills | Upstream |
|---|---|---|
| Pipeline | `build-site` | this repository |
| Context, critique, audit | `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) |
| Direction, anti-slop | `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| Brand references | `design-md-library` | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) |
| Style / palette / font data | `ui-ux-pro-max` (needs Python 3) | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| Anti-slop audit | `hallmark` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) |
| Craft, motion, mobile | `emil-design-eng`, `apple-design`, `pick-ui-library`, `prototype`, `ask-sonner`, `mobile-native`, `find-animation-opportunities`, `animate`, `animate-expo`, `animation-vocabulary`, `review-animations`, `improve-animations`, `write-swift` | [emilkowalski/skills](https://github.com/emilkowalski/skills) |

## Install in Cowork

Open `design-taste-kit.plugin` in a Cowork conversation (or drag it into the chat) and accept
the plugin from the preview card. Installing a new version replaces the old one.
