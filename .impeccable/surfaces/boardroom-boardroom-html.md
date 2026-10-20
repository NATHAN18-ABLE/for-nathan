---
version: 1
slug: "boardroom-boardroom-html"
primary_target: "boardroom/boardroom.html"
related_targets: []
---

# 작전 회의실 (boardroom)

Scope: the whole app, one surface. Mode: Experience (the CEO is inside a live meeting scene; operate controls stay native and legible).
Audience/job: the owner as CEO brings an agenda, watches department heads present, cross-examine, and audit it, interjects, then signs a decision.
Constraints: pixel art drawn in code, no paid tilesets; Korean UI; runs as claude.ai artifact (sample) and locally (API key) from one file; roster fully editable.
Memorable moment: the 교전 cut-in, two heads face off and the agenda's 생존 HP drops by the damage the attacker priced.
Unresolved: sound effects (optional, off by default).

## Direction contract
THESIS: The meeting is a GBA tactics briefing, not a chat log. Turns, phases and damage make disagreement visible; the category default (agent cards plus a scrolling chat column) is refused.
OWN-WORLD: Night-shift war room. Deep navy floor and walls lit by a teal tactical table; GBA window chrome (navy-to-indigo fill, two-tone bevel border, 1px light inner rim); signal amber for the CEO and approvals, crimson for damage and rejection, teal for repair. Pixel bitmap Korean type (Galmuri) at integer scales, crisp nearest-neighbor canvas.
STORY: The CEO reads the agenda on the table map, watches each head stand and brief with a stance and a number, sees the weakest claims attacked, reads the audit verdict, and stamps 승인/보류/기각. Minutes are kept and exportable.
FIRST VIEWPORT: Full-width 16:9 pixel scene (room, table, seated heads, CEO seat at the head) with the phase banner across the top edge and the agenda HP bar under it; a GBA dialogue window docks under the scene with the speaker's portrait; the agenda input and 회의 시작 sit in the CEO console below. On phones the scene stays on top at full width and the console stacks.
FORM: GBA tactics war-room briefing, candidate 4 of 7 on the ordered list, seed 2611d1d6 (degraded roll, no challengers).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
