---
name: design-md-library
description: Library of 84 DESIGN.md files describing the visual systems of well-known brands (Stripe, Linear, Apple, Airbnb, Notion, Vercel, Spotify, Tesla, Nike and more) — colors, typography, spacing, components, do's and don'ts. Use when the user wants a page or UI to look or feel "like Stripe / Linear / Apple…", names a brand as a style reference, asks for a DESIGN.md, or wants to browse brand design systems for inspiration before choosing a visual direction.
license: MIT (VoltAgent/awesome-design-md)
---

# Design MD Library

84 brand design systems in the DESIGN.md format (the plain-markdown design-system format introduced by Google Stitch), from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md). Each file in `references/` has a YAML token block (colors, typography scale, radii, spacing) followed by prose sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts, Responsive Behavior, Iteration Guide.

## How to use

1. **Pick the reference.** If the user names a brand, open `references/<slug>.md`. If they describe a mood instead ("calm fintech", "loud motorsport", "editorial AI"), scan the index below, shortlist 2–3, and let the user choose (or pick one and say why).
2. **Read only what is needed.** Read the token block and the Overview, Colors, Typography and Do's and Don'ts sections first; pull in Components / Layout when building those parts.
3. **Adopt the system, not the brand.** Turn the file's tokens into CSS custom properties (or the project's token format) and build from those tokens. Use the user's own content, name and logo — never the referenced brand's logo, wordmark, product names, trademarked illustrations or copy. The files are "inspired interpretations", not official brand guidelines.
4. **Swap proprietary fonts.** Many brands use licensed typefaces (Söhne, SF Pro, Circular, custom wordmarks). Use the substitute the file suggests under "Note on Font Substitutes", or a close free alternative from Google Fonts. For Korean text, pair the Latin face with a Korean face of similar character (e.g. Pretendard for neo-grotesk sans, Noto Serif KR / 마루 부리 for serif).
5. **Write the project DESIGN.md.** When the user wants the choice locked in, copy the chosen file to the project root as `DESIGN.md`, rename the system, and edit tokens to match the user's brand color so later work stays consistent.

## Working with other design skills

- Treat a DESIGN.md as the *visual world* decision: it answers the color, type and component-voice questions that `impeccable` (shape) and `design-taste-frontend` (Design Read) would otherwise decide. The user's brief still wins over the file.
- Still apply the anti-slop and craft rules from those skills; a brand reference is not permission to ship a template.
- Mixing two references is allowed only on separate axes (e.g. Linear's type scale + Airbnb's warmth in color), and say so explicitly.

## Index

| Slug | Character |
|---|---|
| `1win` | An analysis of 1win's design language |
| `airbnb` | A warm, generous consumer marketplace anchored on a clean white canvas and Airbnb Rausch (#ff385c), the… |
| `airtable` | A sober, editorial workflow-software interface anchored on white canvas and dark-ink type, where brand… |
| `aljazeera` | An analysis of Al Jazeera's design language |
| `apple` | A photography-first interface that turns marketing into a museum gallery |
| `binance` | A confident financial-platform interface anchored on a deep near-black canvas, where Binance's iconic… |
| `bmw-m` | A motorsport-engineering interface anchored on a near-black canvas with white BMW Type Next Latin display… |
| `bmw` | BMW's corporate site |
| `bugatti` | An austere luxury-automotive interface that uses near-pure black canvas, white uppercase letterspaced… |
| `cal` | A clean, calendar-software-first interface anchored on white canvas with black primary CTAs and custom Cal… |
| `claude` | A warm-canvas editorial interface for Anthropic's Claude product |
| `clay` | A vibrant claymation-meets-data interface for Clay.com (GTM data-orchestration platform) |
| `clickhouse` | A high-performance database interface anchored on near-pure black canvas with electric yellow as the brand… |
| `cohere` | Cohere's 2026 web system is a controlled enterprise AI interface built from stark white editorial space,… |
| `coinbase` | An institutional-grade crypto exchange whose marketing surfaces read like a quietly-confident… |
| `composio` | A developer-tools brand for AI-agent tool integration whose marketing surfaces lean into a dark, technical… |
| `cursor` | An AI-first code editor whose marketing site reads like a quietly-confident developer-tools brand with a… |
| `dell-1996` | An inspired interpretation of Dell.com's 1996 design language |
| `dji` | An analysis of DJI's design language |
| `elevenlabs` | A voice-AI brand whose marketing surfaces read like a quietly editorial print magazine |
| `expo` | A React Native developer-platform whose marketing site reads like a quietly-confident infrastructure brand |
| `ferrari` | A luxury-automotive brand whose marketing surfaces read as cinematic editorial |
| `figma` | A confident black-and-white editorial frame interrupted by oversized, hand-cut pastel color blocks |
| `framer` | A confident dark-canvas builder marketing site that treats the page like a working artboard |
| `hashicorp` | An enterprise-infrastructure marketing canvas built around a near-black ground (#000000) and a system of… |
| `hp` | a white-paper enterprise-consumer system anchored by HP Electric Blue (`#024ad8`) as the lone signal CTA,… |
| `ibm` | An enterprise-marketing canvas faithful to Carbon Design System: white surfaces, charcoal type, IBM Blue… |
| `intercom` | An editorial customer-service marketing canvas built around a soft cream-white ground, charcoal type set… |
| `jobright` | An analysis of Jobright's design language |
| `kraken` | (no description) |
| `lamborghini` | (no description) |
| `linear.app` | A near-black product-focused marketing canvas built around #010102 (the deepest dark surface of any tool… |
| `lovable` | (no description) |
| `mastercard` | (no description) |
| `mercury` | An analysis of Mercury's design language |
| `meta` | Meta's design system spans hardware commerce (Quest VR, Ray-Ban Meta AI glasses) and brand surfaces with a… |
| `minimax` | MiniMax presents itself as a premium AI infrastructure brand through a striking duality |
| `mintlify` | Mintlify presents documentation infrastructure with a dual-mode aesthetic |
| `miro` | Miro presents itself as the AI-powered visual workspace through a confident, almost playful brand voice |
| `mistral.ai` | Mistral AI brands itself with a singular signature |
| `mongodb` | MongoDB carries a strong dual-mode visual identity |
| `mydealz` | An analysis of mydealz's design language |
| `nerdwallet` | An analysis of NerdWallet's design language |
| `nike` | | |
| `nintendo-2001` | An analysis of Nintendo.com's 2001 design language |
| `notion` | Notion presents itself as the all-in-one workspace through a confident, illustration-rich brand voice |
| `nvidia` | | |
| `ollama` | | |
| `opencode.ai` | | |
| `oracle` | An analysis of Oracle's design language |
| `oura` | An analysis of Oura's design language |
| `pinterest` | | |
| `playstation` | | |
| `posthog` | | |
| `raycast` | | |
| `renault` | | |
| `replicate` | | |
| `resend` | | |
| `revolut` | | |
| `runwayml` | (no description) |
| `sanity` | (no description) |
| `sap` | An analysis of SAP's design language |
| `sentry` | a developer-tools brand built on a deep purple-violet midnight canvas, electric lime accents, and a… |
| `shopify` | a cinematic commerce platform that runs two parallel design tracks |
| `slack` | a workplace messaging brand built on a deep aubergine primary, with cream-lavender hero gradients, blue… |
| `spacex` | a mission-oriented aerospace brand built on pure black canvas, full-bleed photographic and video heroes of… |
| `spotify` | (no description) |
| `starbucks` | (no description) |
| `stripe` | a financial-infrastructure brand built on a deep navy ink, an electric indigo primary, and a recurring… |
| `supabase` | an open-source database platform built on a clean white-and-near-black system with a single signature… |
| `superhuman` | a fast-email productivity brand split between an editorial dark hero (deep indigo navy with violet-sky… |
| `tesla` | (no description) |
| `theverge` | (no description) |
| `together.ai` | an AI infrastructure platform whose surface alternates between near-black hero bands (with a three-color… |
| `uber` | a transportation-and-delivery super-app brand whose web surface is a black-and-white duet, framed by a… |
| `vercel` | a developer-platform brand whose surface is a stark black-and-ink duet on near-white canvas, broken at… |
| `vodafone` | a telecom super-brand whose web surface alternates between editorial photography hero bands with massive… |
| `voltagent` | a developer-focused AI agent engineering platform whose surface is an unrelenting near-black canvas broken… |
| `warp` | an agentic terminal-and-development-environment brand whose surface is a warm near-charcoal canvas (a tint… |
| `webflow` | a visual web development platform whose surface contrasts a deep near-black `#080808` primary against a… |
| `wired` | a flagship technology-magazine brand whose surface is a strict editorial duet of stark black wordmark on… |
| `wise` | a global money-transfer brand whose surface combines an unusually heavy near-black display sans (weight… |
| `x.ai` | Elon Musk's frontier-AI company whose web surface is a strict near-black canvas broken only by white pill… |
| `zapier` | a workflow-automation platform whose surface combines warm-cream neutrals (`#fffefb` canvas, `#f8f4f0`… |
