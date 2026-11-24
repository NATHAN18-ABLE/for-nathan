# design-taste-kit

The one plugin that carries every skill and MCP server for this account. Claude Code and Cowork
both load it, so nothing lives in `.claude/skills/` any more.

- `skills/` — the skills. Install or update them with `scripts/skills.sh` (it runs the skills CLI
  in a scratch folder, copies the result here, updates `skills-lock.json`, then re-applies local
  changes with `scripts/patch-skills.py`).
- `mcp/` — launchers for the Playwright and Chrome DevTools servers (headless Chromium without
  Chrome's sandbox inside the Claude Code cloud container, defaults everywhere else).
- `.mcp.json` — the MCP servers.

Build the installable file with `scripts/build-cowork-plugin.sh`, then install
`cowork/design-taste-kit.plugin` in Cowork (it replaces the previous version). The build copies the
pipeline sections of `CLAUDE.md` into `skills/build-site/pipeline.md`.

## Entry points

| Work | Start with |
|---|---|
| Websites and UI | `build-site` (whole design pipeline) |
| Video and motion graphics | `hyperframes`; Remotion projects: `remotion-best-practices` |
| Planning | `brainstorming`, `/grill-me` |
| CAD | `cad` |

## Skills

| Area | Skills | Upstream |
|---|---|---|
| Pipeline | `build-site` | this repository |
| Design direction and audit | `impeccable`, `design-taste-frontend`, `design-md-library`, `ui-ux-pro-max` (Python 3), `hallmark`, `web-design-guidelines`, `create-design-md`, `device-frames` | pbakaus/impeccable, Leonxlnx/taste-skill, VoltAgent/awesome-design-md, nextlevelbuilder/ui-ux-pro-max-skill, Nutlope/hallmark, vercel-labs/agent-skills, ibelick/ui-skills |
| Craft, motion, mobile | `emil-design-eng`, `apple-design`, `pick-ui-library`, `prototype`, `ask-sonner`, `mobile-native`, `find-animation-opportunities`, `animate`, `animate-expo`, `animation-vocabulary`, `review-animations`, `improve-animations`, `write-swift` | emilkowalski/skills |
| Development | `vercel-react-best-practices`, `supabase`, `supabase-postgres-best-practices`, `netlify-deploy`, `netlify-config`, `netlify-frameworks`, `netlify-caching`, `automation-recommender`, `karpathy-guidelines`, superpowers (`brainstorming`, `writing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion` and the rest) | vercel-labs/agent-skills, supabase/agent-skills, netlify/context-and-tools, anthropics/claude-plugins-official, forrestchang/andrej-karpathy-skills, obra/superpowers |
| Video (HyperFrames) | `hyperframes`, `hyperframes-*`, `motion-graphics`, `general-video`, `product-launch-video`, `faceless-explainer`, `music-to-video`, `talking-head-recut`, `embedded-captions`, `pr-to-video`, `slideshow`, `media-use`, `figma`, `remotion-to-hyperframes` (Node 22+, Chrome, FFmpeg) | heygen-com/hyperframes |
| Video (Remotion) | `remotion-best-practices`, `remotion-*` | remotion-dev/skills |
| Video analysis and editing | `watch` (Python 3.10+, FFmpeg, yt-dlp), `video-use` (Python, FFmpeg, ElevenLabs key), `cartoon-3d-short` (Remotion + three.js), `line-art-animation` (Node) | bradautomates/claude-video, browser-use/video-use, mromidev/claude-animated-shorts, JDhruv14/line-art-animation |
| Animation | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-frameworks`, `gsap-performance`, `gsap-utils` | greensock/gsap-skills |
| Audio | `text-to-speech`, `speech-to-text`, `music`, `sound-effects`, `dubbing`, `voice-changer`, `voice-isolator`, `onboarding`, `setup-api-key`; `earshot`, `real-sound` (needs `pip install "earshot[listen] @ git+https://github.com/Leonxlnx/earshot"`) | elevenlabs/skills, Leonxlnx/earshot |
| PPT and planning | `theme-factory`, `grill-me`, `grilling`, `to-spec`, `setup-matt-pocock-skills` | anthropics/skills, mattpocock/skills |
| CAD and fabrication | `cad`, `dxf`, `engineering-drawing`, `dfm`, `dfam-check`, `gcode`, `bambu-labs`, `step-parts` | earthtojake/text-to-cad |

## MCP servers

| Server | Role | Sign-in |
|---|---|---|
| `playwright` | Page interaction, screenshots, device and WebKit (Safari) checks | none |
| `chrome-devtools` | Lighthouse, performance traces, network and console only (input and memory tools off) | none |
| `context7` | Current docs for libraries without an official skill | optional free key |
| `netlify` | Deploys and site settings | Netlify account, OAuth |
| `elevenlabs` | Voice, music, sound effects | ElevenLabs account, OAuth |
| `gamma` | Presentations | Gamma account, OAuth |

The earshot MCP server is not registered: it needs the earshot Python package first. After
installing it with the `mcp` extra, add it with `claude mcp add earshot -- earshot mcp`.
