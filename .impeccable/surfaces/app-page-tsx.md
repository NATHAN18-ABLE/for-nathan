---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/test","app/type","app/gu"]
---

# Surface: Home + type test + district day (app/page.tsx, app/test, app/type, app/gu)

Visitor mode: Experience with a Persuade duty: within one viewport a first-time foreign visitor senses a refined, contemporary Seoul, understands that a short test matches them to a district, and can start.

Audience: foreign independent travellers who want lived-in Seoul rather than famous sights; pre-trip on desktop, on-trip on phone. Job: answer 12 quick questions, get a travel type and a matched district with reasons, follow that district's day course, optionally meet same-district travellers in the metaverse.

## Direction history

- 2026-11-03 woodblock atlas (seed 8ed26da8, degraded roll). 2026-11-06 all three comps rejected: too dark and heavy, no life, angular buttons and type. Kept at .impeccable/mocks/decision/rejected-woodblock-*.png as anti-reference.
- 2026-11-06 minhwa chosen, then set aside on 2026-11-09 before any comp: user worried it reads as cartoon and asked for Seoul's sophistication and a luxurious feel.
- 2026-11-09 user pinned "Porcelain Seoul" (Joseon white porcelain and Seoul's light). User pin beats the roll.

## Direction contract

THESIS: quiet luxury from Joseon white porcelain, the moon jar's white space and soft curve, set against contemporary Seoul in golden light; the test is a concierge ritual, like a fine fragrance finder, that hands you one district as a curated collection. Refuses the tourism-portal default (sky blue, top-10 card grid), the quiz default (pastel cards, emoji), the luxury default (black and gold, beige and brass) and the rejected heavy woodblock look.

OWN-WORLD: porcelain white ground #F6F6F3 with porcelain-shadow grey #E4E6E2, ink text #1E2126, one accent of cobalt underglaze blue #22418F (cheonghwa), celadon #9CC3B3 only as a quiet surface tint. Restrained color strategy. Shapes follow the moon jar: pill buttons, generously rounded panels (28px), no sharp corners, no heavy rules. Type: an elegant contemporary sans with open spacing for display and body; no classical high-contrast serif. Imagery: cinematic, sunlit photography of real Seoul neighborhoods; porcelain objects as still-life anchors; cobalt line drawings in the cheonghwa manner for maps and routes.

STORY: visitor meets a moon jar in late-afternoon light with Seoul beyond the window, begins the test, moves through twelve unhurried questions with photo-backed choices, receives a type and a district presented like a gallery collection, then follows a morning-to-night route drawn as a cobalt line, and can step into that district's metaverse room.

FIRST VIEWPORT: decided by the comp round (three compositions: moon-jar still life with the city beyond, full-bleed dusk photograph with a porcelain panel, concierge test preview beside a cobalt-painted jar). Constant across all three: headline "Find your Seoul.", one primary pill action "Take the test", real Seoul visible above the fold, one-line nav under 80px.

FORM: Porcelain Seoul, user-pinned 2026-11-09 (replaces woodblock atlas seed 8ed26da8 and the unbuilt minhwa direction).

SIGNATURE INTERACTION: the glaze: on the result, a cobalt line draws the district's outline and day route across a porcelain surface as if painted with a brush, stop by stop, while the district photograph resolves behind it (code motion over SVG).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Wordmark: "Seoul, Curated" is a working name.
- Metaverse keeps the cozy diorama but takes this palette (porcelain white, celadon, cobalt).
- Share format: URL-encoded type and district vs localStorage.
