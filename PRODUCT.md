# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single self-contained HTML file (inline CSS/JS, canvas-drawn pixel art, no build step). Runs two ways from the same file: published as a claude.ai Artifact, where the page asks Claude through the built-in `sample` capability with no API key; and opened locally in a browser, where the user pastes their own Claude API key. Chosen by the user ("claude.ai 링크 + 로컬 둘 다").

## Users

One person: the owner, playing the CEO of an imagined large company (first example: an AI video production company). They bring an idea to a meeting, watch their department-head agents argue about it, interject, and make the final call. Korean-speaking; all UI and agent speech in Korean.

## Product Purpose

A pixel-art meeting room where AI department heads hold a real meeting about the CEO's agenda, rendered as a living game scene rather than a chat log. Success: the CEO leaves each meeting with a decision they could defend, because the room told them the uncomfortable parts.

## Positioning

Existing agent-office simulators (Claw-Empire, The Office, Pixel Agents) visualize agents doing work. This one stages the meeting itself: presentations, cross-examination, an audit verdict, and the CEO's sign-off, with heads designed to disagree and to price risk with numbers.

## Operating Context

- Meeting flow (confirmed): each head presents in turn → rebuttal round where heads attack each other's weak points → audit head summarizes risk → CEO approves, holds, or rejects. Minutes are kept.
- Default roster for the AI video company: 기획팀장, 리서치팀장, 판단팀장, 제작팀장, 홍보팀장, 감사팀장. The CEO is the human user.
- The roster is fully user-editable: add, remove, rename heads, rewrite their role and personality.

## Capabilities and Constraints

- Heads must judge objectively and harshly. Every judgment carries a reason and, where possible, a number (cost, probability, timeline). No flattery.
- Answers stay short and specific; no generic filler.
- Pixel-art art must be original (drawn in code). Paid tilesets used by referenced repos (LimeZu, itch.io office packs) are not redistributable and are not used.
- Ideas borrowed from open-source projects: Claw-Empire (Apache-2.0) CEO-desk directives and meeting minutes; The Office (ISC) per-role markdown prompts and boardroom review; AI Town (MIT) character movement and speech bubbles. Patterns only, no copied code or assets.
- Local mode stores the API key only in the user's own browser storage.

## Evidence on Hand

None. No real company data, customers, or metrics exist; any figures agents produce are their own estimates and must read as such.

## Product Principles

1. Disagreement is the feature. A meeting where everyone agrees has failed.
2. Show, don't log: the meeting is watched as a scene first and read as text second.
3. The CEO decides. Agents advise, argue, and price risk; they never make the final call.
4. Every claim earns its reason. A verdict without a basis is not allowed to stand.

## Anti-goals (user-stated)

- Yes-man heads who only praise the CEO's idea.
- A screen that looks like a messenger or chat window instead of a game.
- Obvious, long-winded answers.
- Judgments without evidence or numbers.
