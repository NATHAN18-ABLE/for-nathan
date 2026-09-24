---
name: build-site
description: Build or redesign a website, landing page, portfolio, dashboard, or web app UI by running every installed design skill in order (impeccable, design-taste-frontend, pick-ui-library, emil-design-eng, apple-design, mobile-native, find-animation-opportunities, animate, review-animations, improve-animations). Use whenever the user asks to make, build, or redesign a site or page.
---

# Build Site — 전체 디자인 스킬 파이프라인

인자: `$ARGUMENTS` (만들 사이트에 대한 브리프)

프로젝트 루트의 `CLAUDE.md` "사이트 제작 파이프라인" 표를 1단계부터 7단계까지 순서대로 수행한다.

1. **맥락** — Skill 도구로 `impeccable` 로드, `impeccable context` 실행, 필요하면 `init` → new-work.
2. **방향** — Skill 도구로 `design-taste-frontend` 로드, Design Read와 다이얼 결정.
3. **라이브러리** — `.claude/skills/pick-ui-library/SKILL.md` Read. 토스트는 `ask-sonner`.
   시안 비교가 필요하면 `.claude/skills/prototype/SKILL.md` Read.
4. **구현** — `impeccable/reference/craft-floor.md` Read 후, `emil-design-eng`·`apple-design` 로드하고 구현.
5. **모바일** — `mobile-native` 로드, 체크리스트 적용.
6. **모션** — `find-animation-opportunities`로 후보 선정 → `animate`로 구현 (Expo면 `animate-expo`).
7. **검수** — `impeccable` audit → polish, `.claude/skills/review-animations/SKILL.md` Read 후 모션 리뷰,
   `improve-animations`로 남은 개선점 확인. 스크린샷 검증은 한 번에 묶어서, 재확인은 최대 1회.

충돌 시 우선순위: 사용자 브리프 > impeccable > design-taste-frontend > emil-design-eng/apple-design > 나머지.

끝나면 단계별로 적용한 스킬과 건너뛴 단계(및 이유)를 짧게 보고한다.
