# design-taste-kit

Claude Cowork plugin that bundles every skill installed in this repository's `.claude/skills/`
(the same copies Claude Code uses) plus the MCP servers in `.mcp.json`. This folder only holds the
manifest and the MCP config; build the installable file with `scripts/build-cowork-plugin.sh`.

Entry points:
- Websites and UI: `build-site` runs the whole design pipeline. Its `pipeline.md` is generated from
  `CLAUDE.md` at build time, since Cowork has no project CLAUDE.md.
- Video and motion graphics: `hyperframes` picks the right workflow.
- Planning: `brainstorming`, `/grill-me`, `/to-spec`.
- CAD: `cad`.

## Skills

| Area | Skills | Upstream |
|---|---|---|
| Pipeline | `build-site` | this repository |
| Design direction and audit | `impeccable`, `design-taste-frontend`, `design-md-library`, `ui-ux-pro-max` (needs Python 3), `hallmark` | pbakaus/impeccable, Leonxlnx/taste-skill, VoltAgent/awesome-design-md, nextlevelbuilder/ui-ux-pro-max-skill, Nutlope/hallmark |
| Craft, motion, mobile | `emil-design-eng`, `apple-design`, `pick-ui-library`, `prototype`, `ask-sonner`, `mobile-native`, `find-animation-opportunities`, `animate`, `animate-expo`, `animation-vocabulary`, `review-animations`, `improve-animations`, `write-swift` | emilkowalski/skills |
| Video | `hyperframes`, `hyperframes-*`, `motion-graphics`, `general-video`, `product-launch-video`, `faceless-explainer`, `music-to-video`, `talking-head-recut`, `embedded-captions`, `pr-to-video`, `slideshow`, `media-use`, `figma`, `remotion-to-hyperframes` (needs Node 22+, Chrome, FFmpeg) | heygen-com/hyperframes |
| Animation | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-frameworks`, `gsap-performance`, `gsap-utils` | greensock/gsap-skills |
| Audio | `text-to-speech`, `speech-to-text`, `music`, `sound-effects`, `dubbing`, `voice-changer`, `voice-isolator`, `onboarding`, `setup-api-key` | elevenlabs/skills |
| Video (Remotion) | `remotion-best-practices`, `remotion-*` | remotion-dev/skills |
| PPT and planning | `theme-factory`, `grill-me`, `grilling`, `to-spec`, `setup-matt-pocock-skills` | anthropics/skills, mattpocock/skills |
| Design review | `web-design-guidelines` (fetches Vercel's latest rules) | vercel-labs/agent-skills |
| Development discipline | `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion` and the other superpowers skills; `karpathy-guidelines` | obra/superpowers, forrestchang/andrej-karpathy-skills |
| CAD and fabrication | `cad`, `dxf`, `engineering-drawing`, `dfm`, `dfam-check`, `gcode`, `bambu-labs`, `step-parts`, `sendcutsend`, `urdf`, `srdf`, `sdf` | earthtojake/text-to-cad |

## MCP servers

| Server | Sign-in |
|---|---|
| `playwright` (browser checks) | none; runs `npx @playwright/mcp` locally |
| `elevenlabs` (voice, music, sound effects) | ElevenLabs account, OAuth on first use |
| `gamma` (presentations) | Gamma account, OAuth on first use |

## Install in Cowork

Open `design-taste-kit.plugin` in a Cowork conversation (or drag it into the chat) and accept
the plugin from the preview card. Installing a new version replaces the old one.
