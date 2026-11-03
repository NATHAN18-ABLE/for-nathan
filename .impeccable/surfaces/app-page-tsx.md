---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/atlas"]
---

# Surface: Home + taste flow + my atlas (app/page.tsx, app/atlas)

Visitor mode: Experience (the map is the work; the taste flow is the way in). Persuade duty inside it: within one viewport a first-time foreign visitor knows this builds a Seoul plan from their tastes and can start.

Audience: foreign independent travellers, pre-trip on desktop and on-trip on phone. Job: pick tastes and conditions, get places with reasons, get a walkable day course, keep it.

## Direction contract

THESIS: Seoul as Kim Jeong-ho's woodblock atlas (Suseonjeondo, Daedongyeojido), re-cut for one traveller. Refuses the tourism-portal default: photo hero, sky blue, card grid of "Top 10 attractions".

OWN-WORLD: ink-soaked carved block ground, cool hanji white print surface (not cream), one accent of natural indigo (jjok). Seal red never used as accent. Components speak atlas grammar: legend table (jidopyo) symbols as taste chips, road lines with a tick every 10 ri as walking-minute markers, accordion-fold atlas pages for results, carved-relief borders instead of cards.

STORY: visitor sees Seoul carved as a block, chooses legend symbols (tastes, pace, days, companions), pulls a print, receives a map showing only their places, each with a line on why it matches, then a ticked route for each day they can save or share.

FIRST VIEWPORT: full-bleed carved Hanyang block (four inner mountains, city wall, Cheonggyecheon) as plate, headline "Seoul, printed for you." at left third in large display, a legend table strip along the bottom holding 5 to 7 taste symbols as the primary control, a single "Print my Seoul" action at its end. Nav one line, under 72px.

FORM: Woodblock atlas, position 7 of 7 on the grounded list, seed key 8ed26da8 (degraded roll, no challengers).

SIGNATURE INTERACTION: "Pull the print": an ink roller passes over the block (Higgsfield clip, code fallback), the hanji sheet lifts to reveal the personal map; route ticks draw in sequence.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Map rendering: real coordinates in SVG over plate texture (preferred) vs MapLibre with custom style.
- Save/share: URL-encoded state vs localStorage.
- Place photography source per place.
