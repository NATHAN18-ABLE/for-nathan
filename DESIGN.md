---
name: 작전 회의실
description: GBA 전략 게임의 작전 브리핑 문법으로 그린, CEO와 AI 팀장들의 픽셀아트 회의실
colors:
  night-ink: "#0a0f1f"
  night-panel: "#121a36"
  window-navy: "#1c2b66"
  window-deep: "#111a47"
  window-rim: "#c8d4ff"
  window-edge: "#050816"
  rule-line: "#2a3a7a"
  text-bright: "#eef1ff"
  text-muted: "#a3afdc"
  table-teal: "#3fd6c4"
  ceo-amber: "#ffb547"
  ceo-amber-deep: "#b8741a"
  damage-crimson: "#ff5468"
  damage-crimson-deep: "#9c2134"
typography:
  display:
    fontFamily: "Galmuri11 Bold"
    fontSize: 24px
    lineHeight: 1.2
  title:
    fontFamily: "Galmuri11 Bold"
    fontSize: 16px
    lineHeight: 1.3
  body:
    fontFamily: "Galmuri11"
    fontSize: 17px
    lineHeight: 1.7
  label:
    fontFamily: "Galmuri11"
    fontSize: 13px
    lineHeight: 1.5
  scene-label:
    fontFamily: "Galmuri7"
    fontSize: 8px
rounded:
  world: 3px
spacing:
  gutter: 16px
  stack: 12px
  window: 14px 16px
components:
  button-primary:
    backgroundColor: "{colors.ceo-amber}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.world}"
    padding: 9px 18px
  button-default:
    backgroundColor: "{colors.night-panel}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.world}"
    padding: 9px 18px
  window:
    backgroundColor: "{colors.window-navy}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.world}"
    padding: 14px 16px
  input:
    backgroundColor: "{colors.window-edge}"
    textColor: "{colors.text-bright}"
    rounded: "{rounded.world}"
    padding: 10px 12px
---

# Design System: 작전 회의실

## Overview

**Creative North Star: "The Night-Shift War Room"**

A company meeting staged as a GBA tactics briefing. The pixel scene is the product: heads sit around a teal tactical table, stand to speak under an amber selection cursor, and clash in full-screen cut-ins while the agenda's 생존율 bar takes damage. Everything outside the scene speaks the same handheld-game grammar: navy windows with a bright inner rim, pixel type, beveled buttons.

Disagreement is made visible. Stance marks float over heads, damage numbers rise over the HP bar, and the CEO's decision lands as a stamp on a paper document, the one warm, light surface in the room.

**Key Characteristics:**
- One dark night scene, no light theme: the room is lit by its table.
- Three role colors with fixed meanings: teal (찬성, repair, the table), amber (CEO, 조건부, the cursor), crimson (반대, damage, 기각).
- Pixel art drawn in code at 384x216, scaled by integer factors, never smoothed.

## Colors

Deep navy grounds with three signal colors that always mean the same thing.

### Primary
- **CEO Amber** (#ffb547): the CEO's seat trim and nameplate, the speaker cursor, primary buttons, 조건부.

### Secondary
- **Table Teal** (#3fd6c4): the tactical table light, 찬성, HP above 60%, focus rings, repair numbers.

### Tertiary
- **Damage Crimson** (#ff5468): 반대, damage numbers, HP under 35%, the attacker's half of the cut-in, destructive confirms.

### Neutral
- **Night Ink** (#0a0f1f): page ground.
- **Window Navy to Window Deep** (#1c2b66 to #111a47): every panel's vertical fill.
- **Window Rim** (#c8d4ff): the 2px inner rim that makes a panel read as a game window.
- **Text Bright** (#eef1ff) and **Text Muted** (#a3afdc): body and secondary text, both AA on the window fill.

### Named Rules
**The Fixed Meaning Rule.** Teal, amber and crimson are states, never decoration. A color used for a stance cannot appear elsewhere with another meaning.

## Typography

**Display Font:** Galmuri11 Bold
**Body Font:** Galmuri11
**Scene Label Font:** Galmuri7 (canvas nameplates only)

**Character:** Korean bitmap faces at their native grid, so the UI text and the scene share one pixel voice. All three are SIL OFL, subset to Hangul and Latin and embedded.

### Hierarchy
- **Display** (Galmuri11 Bold, 24px): app name; banner titles scale to 48px.
- **Title** (Galmuri11 Bold, 16px): window headings, speaker name tab.
- **Body** (Galmuri11, 17px, 1.7): dialogue lines; 16px in inputs so iOS never zooms.
- **Label** (Galmuri11, 12 to 13px): meta lines, unit titles, notes.
- **Scene label** (Galmuri7, 8px): nameplates inside the canvas.

## Layout

Scene (16:9) on top, dialogue window docked under it, CEO console below; a 316px 작전판 rail on the right above 1080px, stacked below it under. 16px side gutter via `max(16px, env(safe-area-inset-*))`, 12 to 14px stack gaps. The scene canvas renders at 384x216 and is blitted at the smallest integer multiple that covers its box.

## Elevation & Depth

Flat. Depth comes from the window frame itself: 2px outer edge line, 2px bright rim, 2px inner edge, and a vertical navy gradient. The only cast shadow is under the paper decision document, which is a physical object laid on the table.

## Shapes

One radius, 3px, for windows, buttons, inputs and chips. The seal is the only circle. Clip-path diagonals appear only in the clash cut-in.

## Components

### Buttons
- **Shape:** 3px radius, 2px edge line, 44px minimum height.
- **Primary:** amber fill, ink text, a 3px darker inner bottom bevel that flattens to 1px on press with a 1px drop.
- **Default:** night panel fill, 1px inner rule line.
- **Destructive confirms** (stop meeting, remove a head, delete minutes) arm on first press, turn crimson for 3 seconds and act on the second press.

### Window
The GBA dialogue frame used for every panel. The dialogue window adds a name tab overlapping its top edge and a blinking amber advance triangle.

### Inputs
Edge-color well, 2px rule-line border that turns teal on focus. Labels above, 16px text.

### Signature: Clash cut-in
Two diagonal halves slide in from opposite edges (260ms, strong ease-out), attacker on crimson, defender on window deep, an amber 교전 plate between them. The HP bar then shakes and a damage number rises.

## Do's and Don'ts

### Do:
- **Do** draw new scene art in code on the 384x216 grid with `rect()` and keep it unsmoothed.
- **Do** keep stance, damage and decision colors to their fixed meanings.
- **Do** put anything readable at length (dialogue, minutes) in DOM text, not on the canvas.

### Don't:
- **Don't** introduce a light theme or a second palette; the room is a night scene.
- **Don't** use paid tilesets or third-party sprites; all art is authored in `art.js`.
- **Don't** animate the scene ambiently (breathing loops, pulsing glows); motion marks state changes only.
