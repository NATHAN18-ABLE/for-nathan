---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/test","app/type","app/gu"]
---

# Surface: Home + type test + district day (app/page.tsx, app/test, app/type, app/gu)

Visitor mode: Experience (the folk-painting world and its characters are the work; the type test is the way in). Persuade duty inside it: within one viewport a first-time foreign visitor knows this matches them to a Seoul district and a travel animal through a short, fun test, and can start.

Audience: foreign independent travellers who want lived-in Seoul rather than famous sights; pre-trip on desktop, on-trip on phone. Job: answer 12 quick questions, get a travel type with its folk-painting animal and a matched district with reasons, follow that district's day course, optionally meet same-district travellers in the metaverse as their animal.

## Direction history

- 2026-11-03 woodblock atlas (seed 8ed26da8, degraded roll). 2026-11-06 user rejected all three comps: too dark and heavy, no fun or life, angular buttons and type. Comps kept at .impeccable/mocks/decision/rejected-woodblock-*.png as anti-reference.
- 2026-11-06 user pinned Minhwa (Joseon folk painting) from a four-way choice. User pin beats the roll.

## Direction contract

THESIS: Seoul told through Joseon folk painting (minhwa), redrawn bright, warm and funny; every travel type is a minhwa animal and every district a small folk-painted scene. Refuses the tourism-portal default (photo hero, sky blue, top-10 card grid), the personality-quiz default (pastel cards, emoji), and the heavy museum-heritage look of the rejected woodblock comps.

OWN-WORLD: bright clean hanji white ground (#F6F5F1, never yellowed or beige), hand-drawn ink outlines (#26262B) with flat gouache fills in a full minhwa palette: peony red #D9475C, pine green #2F7A62, pollen yellow #EDB43F, indigo #2C4F8F. Rounded, friendly shapes: pill buttons, 20px card radius, soft minhwa cloud shapes as containers. Characters: sixteen minhwa animals (tiger, magpie, rabbit, turtle, crane and others) with big round eyes and gentle humor, never scary, never realistic.

STORY: visitor meets a grinning folk-painting tiger in a Seoul alley, answers playful either-or questions, receives a four-letter type with its animal and a district scene, then follows a morning-to-night route of lived-in places and food with tips, and can walk into that district's metaverse room as their animal.

FIRST VIEWPORT: decided by the comp round (three minhwa compositions: tiger-and-magpie hero, chaekgeori shelf of twelve district scenes, folk panorama map with characters). Constant across all three: headline "Which Seoul are you?", one primary pill action "Take the test", characters visible above the fold, one-line nav under 80px.

FORM: Minhwa folk painting, user-pinned 2026-11-06 (replaces woodblock atlas, seed 8ed26da8).

SIGNATURE INTERACTION: the reveal: on the result, the type's animal steps out of a folk-painting frame (code motion over a raster character plate), then the district scene unrolls like a painted scroll with the day route drawn stop by stop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Wordmark: "Which Seoul" is a working name.
- Sixteen character plates: user produces with GPT after the comp is approved, from one approved style sheet.
- Share format: URL-encoded type and district vs localStorage.
