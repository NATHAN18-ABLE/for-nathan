# 개인 PR 포트폴리오 사이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 영상·VFX 스튜디오 채용 담당자에게 "AI를 언어로 삼는 미디어 감독"을 보여주는 한/영 이중 언어 포트폴리오 사이트를 만든다.

**Architecture:** 빌드 도구 없는 정적 사이트. 모든 문구·작품 데이터는 `js/content.js` 하나에 있고, `render.js`가 이를 읽어 `index.html`과 작품 상세 페이지를 채운다. 순수 로직(언어, 표시 여부, 프레임 계산)은 Node에서 단위 테스트하고, 화면 동작은 Playwright로 검증한다.

**Tech Stack:** HTML/CSS/바닐라 JS (클래식 스크립트, 모듈 아님), GSAP 3 + ScrollTrigger (`vendor/`에 파일로 포함), Pretendard + Noto Serif KR + 영문 세리프 1종(Task 1에서 선정), Netlify Forms. 테스트: `node --test`, `@playwright/test`, `http-server`.

**Spec:** `docs/superpowers/specs/2026-10-22-portfolio-site-design.md`

## Global Constraints

- **미감이 최우선 합격 기준** (spec 1-1). 금지어 목록은 `tests/unit/copy.test.js`가 검사한다.
- 컬러: 바탕 `#080808` / 본문 `#f2ede5` / 보조 텍스트 `#b0a99f` 이상 밝기 / 포인트 금색 `#c8a96e`. 금색은 면적 5% 이하. 금색 그라데이션·광택·네온·보라/파랑 AI 그라데이션 금지.
- 폰트: 본문 Pretendard, 제목은 Noto Serif KR 600~900. 본문 최소 16px, 웨이트 400 이상.
- 정렬: 히어로·섹션 헤더·핵심 메시지·Contact는 중앙 정렬.
- 글씨 위에 이펙트를 겹치지 않는다.
- **차분함**: 한 화면에 움직이는 것은 하나만. 강제 스크롤 스냅 금지, 고정(pin) 구간은 히어로 하나뿐. 연출은 2초 안에 끝나고 반복 없음. 작품·연락처·이력서는 클릭 두 번 이내. 모든 체크포인트에서 "채용 담당자가 피곤하지 않은가"를 확인한다.
- 사용자가 고치는 파일은 `js/content.js` 하나. 모든 문구는 `{ ko, en }` 형태.
- 아직 없는 자산은 눈에 띄는 placeholder + `<!-- REPLACE: ... -->` 또는 `// REPLACE:` 주석.
- `content.js`는 `window.CONTENT = {...}` 형태. `index.html`을 더블클릭해도 동작해야 한다 (ES 모듈 금지, fetch 금지).
- 모든 JS 파일 끝에 `if (typeof module !== "undefined") module.exports = {...}`를 둔다 (Node 테스트용).
- `prefers-reduced-motion: reduce`면 모든 연출을 정지 화면이나 즉시 표시로 바꾼다.
- 히어로 프레임 용량: PC ≤ 12MB, 모바일 ≤ 4MB.
- 터치 기기에서는 커스텀 커서를 끈다.
- 이펙트 위치는 넷으로 고정한다: 카드 펼침 = Why Me, 금빛 비 정지 = Philosophy, 폭죽 + 2초 검정 = Finale, 연기 = 히어로·섹션 전환에 아주 옅게.
- 작업 방식: 태스크마다 데스크톱(1440) + 모바일(390) 스크린샷을 사용자에게 보여주고 확인받은 뒤 다음으로 넘어간다. 설명은 쉬운 말로 한다.
- CLAUDE.md의 사이트 제작 파이프라인 스킬을 태스크마다 표시된 대로 적용한다.

## Review Focus

1. **느린 네트워크에서 히어로 프레임이 아직 안 받아졌을 때** → 스크롤은 막히지 않고, 이미 받아진 가장 가까운 프레임을 그린다. (Task 5 `nearestLoaded` 테스트)
2. **영어 문구가 비어 있을 때** → 한국어로 대신 보여주고 `undefined`나 빈 따옴표가 화면에 나오지 않는다. (Task 2 `t` 테스트)
3. **주소창의 작품 id가 틀렸거나 없을 때** (`work.html?id=xyz`) → 안내 문구와 작품 목록으로 돌아가는 링크를 보여준다. (Task 6)
4. **좁은 화면(320px)에서 긴 영어 문구** → 가로 스크롤이 생기지 않는다. (Task 9)
5. **시크릿 모드처럼 localStorage가 막혔을 때** → 언어 전환은 그 방문 동안 정상 동작한다. (Task 2 `getLang`/`setLang` 테스트)

---

## 파일 구조

새 저장소 `NATHAN18-ABLE/<저장소 이름>`에 만든다 (이름은 실행 전에 확정).

```
index.html                 메인 페이지 뼈대 (섹션 10개는 빈 컨테이너 + id)
work.html                  작품 상세 공용 템플릿
works/<id>.html            작품별 공유용 작은 페이지 (OG 메타 + work.js 로드)
css/tokens.css             색·글꼴·간격·이징 변수
css/base.css               리셋, 타이포, placeholder 스타일, 커서
css/sections.css           메인 섹션 레이아웃
css/work.css               상세 페이지
js/content.js              ★ 모든 데이터
js/i18n.js                 언어
js/render.js               표시 규칙 + 메인 페이지 렌더
js/hero-sequence.js        스크롤 이미지 시퀀스
js/work.js                 상세 페이지 렌더
js/ui/tabs.js              접근 가능한 탭
js/ui/lightbox.js          이미지 크게 보기
js/effects/cards.js        Why Me 카드 펼침, ♥ 카드
js/effects/gold-rain.js    Philosophy
js/effects/finale.js       피날레 시퀀스 + 폭죽
js/motion/cursor.js        커스텀 커서
js/motion/reveal.js        등장 애니메이션, 마우스 기울기, 옅은 연기
vendor/gsap.min.js, vendor/ScrollTrigger.min.js
assets/...                 spec 6장 구조 그대로
tools/extract-frames.bat   Windows: 영상 → WebP 프레임
tools/make-placeholder-frames.sh  개발용 임시 프레임 생성 (ffmpeg)
tests/unit/*.test.js       node --test
tests/e2e/*.spec.js        Playwright
playwright.config.js, package.json (devDependencies만), netlify.toml, .gitignore, README.md
docs/PRODUCT.md, docs/DESIGN.md, docs/copy-review.md
```

---

### Task 1: 디자인 기초 (맥락 · 방향 · 말투)

코드 이전의 결정 단계다. 산출물은 사용자 승인으로 검증한다.

**Files:**
- Create: `docs/PRODUCT.md`, `docs/DESIGN.md`

**Interfaces:**
- Produces: `DESIGN.md`의 토큰 이름과 값. Task 3이 그대로 `css/tokens.css`로 옮긴다. `--ink-0/1/2`, `--line`, `--ivory`, `--ivory-dim`, `--gold`, `--font-serif-ko`, `--font-serif-en`, `--font-sans`, `--step--1..--step-6` (타입 스케일), `--space-1..--space-10`, `--ease-out`, `--ease-inout`.

- [ ] **Step 1:** `.claude/skills/impeccable/scripts/impeccable context`를 실행한다. PRODUCT.md가 없으므로 `init` → `shape`로 진행한다. 모드는 Experience, 비주얼 월드는 "먹·여백·금박·연기, 공연의 네 막"으로 하고 결과를 `docs/PRODUCT.md`에 쓴다.
- [ ] **Step 2:** `design-md-library`에서 `apple.md`(스크롤 리듬·여백)와 `runwayml.md`(AI 영상 업계 톤)를 읽는다. 복제하지 않고, 차용할 원칙 3개와 피할 점 3개를 DESIGN.md에 적는다.
- [ ] **Step 3:** `design-taste-frontend`로 한 줄 Design Read와 세 다이얼 값을 정한다. `ui-ux-pro-max --design-system`에 같은 다이얼을 넣어 폰트 조합 후보를 받는다. 영문 세리프 1종을 고른다(후보 예: Cormorant Garamond, Fraunces, Instrument Serif). 기준은 Noto Serif KR와 획 대비가 어울리는가다.
- [ ] **Step 4:** DESIGN.md에 다음을 쓴다.
  - 토큰 값 (Interfaces 목록)
  - 먹색 3층 값 (예: `#080808` / `#0f0e0d` / `#171513`, 대비 검증 포함)
  - 금색 사용 규칙
  - 타입 스케일
  - **말투 가이드**: 문장 길이, 존댓말 규칙, 금지어 목록(spec 1-1 + 추가), 영어 톤 3원칙
- [ ] **Step 5: 체크포인트.** 무드 보드 대신 토큰을 적용한 타이포·색 견본 HTML 한 장(`docs/specimen.html`)을 만든다. 스크린샷으로 보여주고 승인을 받는다.
- [ ] **Step 6:** 커밋 `docs: product context, design direction, voice guide`

### Task 2: 데이터 구조와 언어

**Files:**
- Create: `js/content.js`, `js/i18n.js`, `js/render.js`(표시 규칙 함수만), `tests/unit/i18n.test.js`, `tests/unit/render-rules.test.js`, `tests/unit/content-schema.test.js`, `package.json`

**Interfaces:**
- Produces:
  - `content.js`: spec 5장 구조를 따르는 `window.CONTENT`. 최상위 키는 `SHOW_PLACEHOLDERS: boolean`, `SITE_URL: string`, `meta`, `nav`, `hero`, `about`, `works`, `gallery`, `record`, `toolkit`, `whyMe`, `philosophy`, `finale`, `contact`. 문구는 `{ko, en}`, 비어 있음은 `""` 또는 `null`.
  - `works[]` 항목: `{ id, title, method, status: "done"|"wip"|"planned", featured: boolean, oneLiner, meta:{role, period, tools:string[], length}, video:{provider:"youtube"|"vimeo"|null, id}, thumb, problems:[{problem, decision}], process:[{step:"plan"|"board"|"frame"|"generate"|"edit", by:"human"|"ai"|"both", image, note}], scene:{prompt, generated, final} }`
  - `i18n.js`: `t(field, lang) -> string`, `getLang(storage) -> "ko"|"en"`, `setLang(lang, storage) -> void`, `applyLang(doc, lang) -> void` (`<html lang>` 변경 + `langchange` 이벤트 발생)
  - `render.js`: `isMissing(value) -> boolean`, `visibility(value, showPlaceholders) -> "show"|"placeholder"|"hide"`, `featuredWork(works) -> work` (`featured:true` 첫 항목, 없으면 `works[0]`)

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/unit/i18n.test.js
test("t: en 비어 있으면 ko로 대체", () => assert.equal(t({ko:"안녕", en:""}, "en"), "안녕"));
test("t: 문자열은 그대로", () => assert.equal(t("TOXIC", "en"), "TOXIC"));
test("t: null/undefined는 빈 문자열", () => { assert.equal(t(null,"ko"), ""); assert.equal(t(undefined,"en"), ""); });
test("getLang: storage가 throw해도 'ko'", () => assert.equal(getLang({getItem(){throw new Error()}}), "ko"));
test("setLang: storage가 throw해도 예외 없음", () => assert.doesNotThrow(() => setLang("en", {setItem(){throw new Error()}})));
test("getLang: 저장값 en이면 en", () => assert.equal(getLang({getItem:()=>"en"}), "en"));
// tests/unit/render-rules.test.js
test("visibility: 값 있으면 show", () => assert.equal(visibility("a", false), "show"));
test("visibility: 빈 값 + 스위치 on → placeholder", () => assert.equal(visibility("", true), "placeholder"));
test("visibility: 빈 값 + 스위치 off → hide", () => assert.equal(visibility(null, false), "hide"));
test("isMissing: {ko:'',en:''}는 비어 있음", () => assert.equal(isMissing({ko:"",en:""}), true));
test("featuredWork: featured 우선, 없으면 첫 번째", ...);
// tests/unit/content-schema.test.js
test("works id는 고유하고 [a-z0-9-]만", ...);
test("featured:true는 최대 1개", ...);
test("process.by는 human|ai|both 중 하나", ...);
test("nav 5개, 각 id가 섹션 id 목록에 존재", ...);
```

- [ ] **Step 2:** `node --test tests/unit` → FAIL (함수 없음)
- [ ] **Step 3:** 구현. `content.js`는 다음 순서로 채운다.
  - spec 5장의 **확정 카피를 글자 그대로** 넣는다.
  - 작품 6편: 17분, TOXIC(`featured:true`, 17분 완성 전까지), Just Leave, 자동차 광고, 넾다세일, 추가 1편. 각 작품의 status를 넣는다.
  - 미정 값은 `""`로 두고 각 줄에 `// REPLACE:` 주석을 단다.
  - 영어 칸은 이 태스크에서 비워 둔다 (Task 4에서 채운다).
- [ ] **Step 4:** `node --test tests/unit` → PASS
- [ ] **Step 5:** 커밋 `feat: content schema, i18n, visibility rules`

### Task 3: 페이지 뼈대와 기본 렌더

**Files:**
- Create: `index.html`, `css/tokens.css`, `css/base.css`, `css/sections.css`, `vendor/*`, `playwright.config.js`, `tests/e2e/shell.spec.js`, `.gitignore`, `netlify.toml`
- Modify: `js/render.js` (`renderPage` 추가)

**Interfaces:**
- Consumes: Task 1 토큰, Task 2 `t`, `visibility`, `featuredWork`
- Produces: `renderPage(content, lang, doc) -> void`. 섹션 id는 `hero, about, works, gallery, record, toolkit, why, philosophy, finale, contact`로 고정한다. 반복 렌더 시 기존 내용을 교체한다(중복 생성 없음). placeholder 요소는 `.ph` 클래스 + `data-replace="<content 경로>"`를 단다.

- [ ] **Step 1: 실패하는 테스트**

```js
// tests/e2e/shell.spec.js
test("배경색과 본문색", async ({page}) => { /* body bg = rgb(8, 8, 8), color = rgb(242, 237, 229) */ });
test("섹션 10개가 순서대로 존재", ...);  // ids 배열과 일치
test("네비 5개 클릭 시 해당 섹션으로 이동", ...);
test("KO/EN 토글 시 hero 부제가 바뀌고 html lang이 바뀜", ...);
test("새로고침해도 선택 언어 유지", ...);
test("SHOW_PLACEHOLDERS=false면 .ph 요소 0개", ...); // page.addInitScript로 스위치 덮어쓰기
test("콘솔 에러 0", ...);
test("본문 텍스트 계산 크기 ≥ 16px, weight ≥ 400", ...);
```

- [ ] **Step 2:** `npx playwright test tests/e2e/shell.spec.js` → FAIL
- [ ] **Step 3:** 구현
  - `index.html`: 시맨틱 랜드마크, 폰트 링크, 스크립트 순서(content → i18n → render → vendor → 나머지)
  - 네비: 5개 + KO/EN + 이력서
  - 섹션: 이펙트 없이 정적 레이아웃만 완성
  - 실전 기록 탭과 갤러리는 이 태스크에서 목록 형태로만 렌더
  - 적용 스킬: impeccable craft-floor를 먼저 읽고, `emil-design-eng`, `apple-design`
- [ ] **Step 4:** PASS 확인 후 데스크톱·모바일 스크린샷
- [ ] **Step 5: 체크포인트.** 사용자에게 스크린샷을 보여주고 승인받는다 (레이아웃·여백·타이포 리듬).
- [ ] **Step 6:** 커밋 `feat: page shell and static render of all sections`

### Task 4: 카피 다듬기와 영어 버전

**Files:**
- Create: `docs/copy-review.md`, `tests/unit/copy.test.js`
- Modify: `js/content.js`

**Interfaces:**
- Consumes: DESIGN.md의 말투 가이드와 금지어 목록

- [ ] **Step 1: 실패하는 테스트**

```js
// tests/unit/copy.test.js — content의 모든 문자열을 재귀로 모아 검사
test("금지어 없음 (ko/en)", ...);       // DESIGN.md 목록과 같은 배열을 테스트 파일에 둠
test("확정 카피가 글자 그대로", ...);   // hero 메인 3줄, About 소개문, Why Me 4문장, Philosophy, Contact 제목
test("SHOW_PLACEHOLDERS=false 대상 필드 외에 en이 비어 있지 않음", ...);
test("영어 hero 메인이 'of the people'/'by the people'/'for the people'을 포함하지 않음", ...);
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 영어 전체 초안을 쓴다. 직역이 아니라 같은 태도로 다시 쓴다. 영어 히어로 메인은 후보 3개를 `copy-review.md`에 올린다.
- [ ] **Step 4:** 확정 카피는 건드리지 않는다. 대신 다듬을 제안을 "원문 / 제안 / 이유" 표로 `copy-review.md`에 쓴다. 포함 대상:
  - 피날레 문구
  - 성격 강점 표현
  - 실전 기록의 한 줄 성과
  - "회사를 위해 해줄 수 있는 것" 3줄 초안
- [ ] **Step 5:** PASS 확인
- [ ] **Step 6: 체크포인트.** 사용자가 `copy-review.md`를 승인하면 그대로 반영하고 테스트를 다시 통과시킨다.
- [ ] **Step 7:** 커밋 `content: copy refinement and English version`

### Task 5: 히어로 스크롤 시퀀스

**Files:**
- Create: `js/hero-sequence.js`, `tests/unit/hero.test.js`, `tests/e2e/hero.spec.js`, `tools/extract-frames.bat`, `tools/make-placeholder-frames.sh`, `assets/hero/desktop/*`, `assets/hero/mobile/*`, `assets/hero/poster.webp`

**Interfaces:**
- Consumes: `CONTENT.hero.frames = { desktop:{dir, count, ext:"webp", pad:4}, mobile:{...}, poster }`
- Produces:
  - `frameIndex(progress, count) -> number`: 0..count-1로 제한, 반올림
  - `frameUrl(set, i) -> string`: 파일 번호는 1부터, 4자리 0 채움
  - `loadOrder(count, step=8) -> number[]`
  - `nearestLoaded(i, loaded:Set<number>) -> number|-1`
  - `initHero(canvas, content, {reducedMotion, isMobile}) -> {destroy()}`. 그린 프레임 번호는 `canvas.dataset.frame`에 노출한다(테스트용).

- [ ] **Step 1: 실패하는 테스트**

```js
test("frameIndex 경계", () => { assert.equal(frameIndex(0,150),0); assert.equal(frameIndex(1,150),149); assert.equal(frameIndex(-0.2,150),0); assert.equal(frameIndex(1.3,150),149); });
test("frameUrl 0 → frame_0001.webp", ...);
test("loadOrder: 0,8,16…이 먼저, 전체는 중복 없이 count개", ...);
test("nearestLoaded: 가장 가까운 로드된 프레임, 없으면 -1", ...);
// e2e
test("스크롤하면 canvas data-frame이 증가", ...);
test("reduced-motion이면 canvas 대신 poster 이미지", ...);
test("모바일 뷰포트는 mobile 세트를 요청", ...);    // network 요청 경로 확인
test("히어로 '작품 보기 ↓' 클릭 시 #works로 이동", ...);
test("히어로 아래 '60초 쇼릴' 버튼: url 비면 placeholder, 있으면 라이트박스로 재생", ...);
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** `make-placeholder-frames.sh`로 개발용 임시 프레임을 만든다. 먹색 위로 금빛 점이 천천히 퍼지는 150장이고, 파일마다 `PLACEHOLDER` 워터마크를 넣는다.
- [ ] **Step 4:** 구현
  - 고정 구간: 약 200vh, GSAP ScrollTrigger의 `scrub`
  - 그리기: canvas에 cover 방식, devicePixelRatio 반영
  - 카피 배치: 라벨·메인·부제·서브·버튼은 영상이 어두워지는 구간에 순서대로 등장시키고, 서로 겹치지 않게 한다
  - 적용 스킬: `gsap-scrolltrigger`, `gsap-performance`
- [ ] **Step 5:** `extract-frames.bat` 작성. 사용법: `extract-frames.bat 원본.mp4`. 출력: desktop 1600px / mobile 800px, WebP q70, 프레임 수 150. ffmpeg 설치 한 줄(`winget install ffmpeg`)은 README에 적는다.
- [ ] **Step 6:** PASS 확인 + 용량 확인 (`du -sh assets/hero/*` → PC ≤ 12MB, 모바일 ≤ 4MB)
- [ ] **Step 7: 체크포인트.** 스크롤 동작을 짧은 화면 녹화나 연속 스크린샷으로 보여주고 승인받는다.
- [ ] **Step 8:** 커밋 `feat: scroll-scrubbed hero image sequence`

### Task 6: 작품 섹션과 상세 페이지

**Files:**
- Create: `work.html`, `js/work.js`, `css/work.css`, `works/{17min,toxic,just-leave,car-ad,nepda-sale,work-6}.html`, `tests/e2e/works.spec.js`
- Modify: `js/render.js` (works 섹션: 대표작 1 + 카드)

**Interfaces:**
- Consumes: `featuredWork`, `t`, `visibility`
- Produces:
  - `renderWork(content, id, lang, doc) -> boolean` (id가 없으면 false)
  - `workStubHtml(work, siteUrl) -> string`: `works/<id>.html`을 만들 때 쓰는 함수. 작품을 추가할 때 README 안내대로 복사한다.

- [ ] **Step 1: 실패하는 테스트**

```js
test("대표작은 featured:true 작품, 카드는 나머지", ...);
test("카드에 방식 태그와 상태 배지(제작 중) 표시", ...);
test("카드 클릭 → works/<id>.html, 제목·메타·영상 임베드 표시", ...);
test("process 단계마다 '감독'/'AI' 배지가 by 값대로", ...);
test("이전/다음 작품 이동", ...);
test("work.html?id=xyz → 안내 문구 + 작품 목록 링크", ...);
test("works/toxic.html의 og:title, og:image가 절대 URL", ...);
test("영상 provider가 null이면 썸네일 + '제작 중' placeholder", ...);
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현. 영상은 클릭 전에는 썸네일만 보여주고, 클릭하면 iframe을 불러온다(초기 로딩을 가볍게). 3D 기울기와 마우스 반응은 대표작 썸네일에만 둔다.
- [ ] **Step 4:** PASS 확인
- [ ] **Step 5: 체크포인트** (메인 작품 섹션 + 상세 페이지 스크린샷)
- [ ] **Step 6:** 커밋 `feat: works section and case study pages`

### Task 7: 이미지·사운드 갤러리, 실전 기록 탭, Toolkit

**Files:**
- Create: `js/ui/tabs.js`, `js/ui/lightbox.js`, `tests/e2e/gallery-record.spec.js`
- Modify: `js/render.js`, `css/sections.css`

**Interfaces:**
- Produces:
  - `initTabs(rootEl) -> void`: WAI-ARIA 탭 패턴
  - `openLightbox(items, index) -> void`, `closeLightbox() -> void`

- [ ] **Step 1: 실패하는 테스트**

```js
test("갤러리 묶음 탭 전환", ...);
test("이미지 클릭 → 라이트박스, Esc로 닫으면 포커스가 원래 이미지로", ...);
test("라이트박스 좌우 화살표 이동", ...);
test("실전 기록 탭: 방향키로 이동, aria-selected 갱신", ...);
test("몽글이·컵홀더 링크가 새 탭(rel=noopener)으로 열림", ...);
test("Toolkit에 드론 항목 포함", ...);
test("사운드: Suno 트랙이 비면 placeholder, 있으면 <audio controls> 렌더", ...);
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현. `pick-ui-library`(Read)로 라이트박스를 직접 만들지 라이브러리를 쓸지 판단하고, 결정과 이유를 커밋 메시지에 남긴다.
- [ ] **Step 4:** PASS 확인
- [ ] **Step 5: 체크포인트**
- [ ] **Step 6:** 커밋 `feat: gallery, record tabs, toolkit strip`

### Task 8: 마술의 네 순간 (Why Me · Philosophy · Finale · ♥ 카드)

**Files:**
- Create: `js/effects/cards.js`, `js/effects/gold-rain.js`, `js/effects/finale.js`, `tests/e2e/moments.spec.js`
- Modify: `index.html` (Netlify 폼), `css/sections.css`

**Interfaces:**
- Produces:
  - `initWhyCards(sectionEl, {reducedMotion})`
  - `initHeartCard(buttonEl, revealEl)`
  - `initGoldRain(canvas, triggerEl, {reducedMotion})`
  - `initFinale(sectionEl, {reducedMotion})`. 상태는 `sectionEl.dataset.stage = "video"|"fireworks"|"black"|"message"`.

- [ ] **Step 1: 실패하는 테스트**

```js
test("Why Me: 섹션 진입 시 카드 3장이 펼쳐지고 문구가 겹치지 않음", ...); // 카드 bounding box 서로 비교
test("♥ 카드: button, Enter/Space로 뒤집힘, aria-pressed=true, 연락 버튼 노출", ...);
test("♥ 카드: reduced-motion이면 처음부터 앞면 + 연락 버튼 노출", ...);
test("Philosophy: 인용문이 보일 때 금빛 입자 정지(data-frozen=true)", ...);
test("Finale: stage가 video→fireworks→black→message 순서, black은 2초", ...); // page.clock 사용
test("Finale: black 단계의 배경은 순수 #000", ...);
test("Contact 폼: data-netlify=true, honeypot 필드, name/email/message 필수", ...);
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현
  - 적용 스킬: `find-animation-opportunities`로 이 네 순간 외의 후보는 배제하고, `animate`로 구현한다. 이름이 애매하면 `animation-vocabulary`를 참고한다. GSAP 스킬은 timeline, plugins.
  - 폭죽은 금색 단색 파티클 한 번만 터진다. 반복하지 않는다.
- [ ] **Step 4:** PASS 확인
- [ ] **Step 5: 체크포인트** (네 순간을 각각 캡처)
- [ ] **Step 6:** 커밋 `feat: four magic moments and contact form`

### Task 9: 전역 모션과 모바일

**Files:**
- Create: `js/motion/cursor.js`, `js/motion/reveal.js`, `tests/e2e/motion-mobile.spec.js`
- Modify: `css/base.css`, `index.html` (viewport, theme-color 메타)

**Interfaces:**
- Produces: `initCursor({isTouch, reducedMotion})`, `initReveal(doc, {reducedMotion})`, `initTilt(el)`, `initSmoke(el)`

- [ ] **Step 1: 실패하는 테스트**

```js
test("데스크톱: 커서 점과 링 존재, 기본 커서 숨김", ...);
test("터치 기기(hasTouch): 커스텀 커서 없음", ...);
test("reduced-motion: .reveal 요소가 처음부터 보임", ...);
test("320px·390px, EN/KO 모두 가로 스크롤 없음", ...);  // scrollWidth <= innerWidth
test("모바일 입력창 font-size ≥ 16px (확대 방지)", ...);
test("탭 하이라이트 투명, 100svh 사용", ...);
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현. 적용 스킬: `mobile-native`(safe-area, 100vh 문제, 탭 하이라이트), `apple-design`(제스처·감속).
- [ ] **Step 4:** PASS 확인
- [ ] **Step 5:** 커밋 `feat: cursor, reveal, tilt, mobile polish`

### Task 10: 검수와 폴리시

**Files:**
- Create: `docs/audit-2026-xx.md`
- Modify: 검수 결과에 따른 파일들

- [ ] **Step 1:** 데스크톱 1440, 모바일 390 스크린샷을 KO/EN 각각, 섹션마다 한 번에 찍는다.
- [ ] **Step 2:** 검수를 차례로 돌린다. 결과는 목록으로만 `audit` 문서에 모은다 (아직 수정하지 않음).
  - `impeccable audit`
  - `hallmark audit` (수정 없이 목록만)
  - `web-design-guidelines`
  - `review-animations` (Read)
  - spec 1-1 미감 원칙을 항목별로 대조
- [ ] **Step 3: 체크포인트.** 목록과 스크린샷을 사용자에게 보여주고 고칠 범위를 정한다.
- [ ] **Step 4:** `polish` + `improve-animations`로 수정을 한 번에 묶어 적용한다.
- [ ] **Step 5:** 전체 테스트 `node --test tests/unit && npx playwright test` → 모두 PASS
- [ ] **Step 6:** 스크린샷으로 1회만 재확인한다.
- [ ] **Step 7:** 커밋 `polish: audit fixes`

### Task 11: 배포와 교체 가이드

**Files:**
- Create: `README.md`
- Modify: `js/content.js` (`SITE_URL`), `works/*.html`

- [ ] **Step 1:** README를 쓴다. "무엇을 어디서 바꾸나" 표(사진, 영상, 링크, 이력서, 작품 추가, 히어로 영상 교체 순서), ffmpeg 설치, 공유 전 체크리스트(`SHOW_PLACEHOLDERS=false`, OG 이미지, SITE_URL)를 넣는다.
- [ ] **Step 2:** 사용자가 Netlify에서 저장소를 연결하고 서브도메인을 정한다. 정해진 주소를 `SITE_URL`과 각 `works/*.html`의 OG 절대 주소에 반영한다.
- [ ] **Step 3:** 배포된 주소에서 e2e 스모크를 돌린다: `BASE_URL=https://<주소> npx playwright test tests/e2e/shell.spec.js` → PASS
- [ ] **Step 4:** 커밋·푸시 `docs: README and deploy config`
