# 프로젝트 지침

## 사이트 제작 파이프라인 (필수)

웹사이트·랜딩페이지·포트폴리오·대시보드·웹앱 UI 등 **프론트엔드 화면을 새로 만들거나 리디자인할 때는**
`.claude/skills/`에 설치된 디자인 스킬을 아래 순서대로 **전부** 적용한다. 일부만 골라 쓰지 않는다.
작은 수정(버그 하나, 문구 하나)이라면 해당 단계의 스킬만 적용해도 된다.

`disable-model-invocation`이 걸린 스킬(`pick-ui-library`, `prototype`, `review-animations`)은
Skill 도구로 호출할 수 없으므로 해당 `SKILL.md`를 직접 Read 해서 지침을 따른다.

| 단계 | 스킬 | 할 일 |
|---|---|---|
| 1. 맥락 | `impeccable` (+ `design-md-library`) | `.claude/skills/impeccable/scripts/impeccable context` 실행 → PRODUCT.md 없으면 `init`, 이어서 `shape`/new-work로 모드(Persuade/Operate/Read/Experience)와 비주얼 월드 결정. 사용자가 "Stripe처럼"처럼 브랜드를 레퍼런스로 들면 `design-md-library`에서 해당 DESIGN.md를 읽어 비주얼 월드의 근거로 쓴다 |
| 2. 방향 | `design-taste-frontend` (+ `ui-ux-pro-max`) | 한 줄 "Design Read" 출력, 세 다이얼 값 결정, 템플릿 같은 AI 디자인 금지 규칙 적용. 팔레트·폰트 조합 후보가 필요하면 `ui-ux-pro-max`의 `--design-system` 검색에 같은 다이얼 값을 넣어 근거 데이터로 참고 |
| 3. 라이브러리 | `pick-ui-library` (Read) | 필요한 UI 라이브러리 선정. 토스트가 필요하면 `ask-sonner` |
| 4. 구현 | `impeccable` craft-floor + `emil-design-eng` + `apple-design` | UI 편집 전 `impeccable/reference/craft-floor.md`를 읽고, 컴포넌트 완성도·타이포·재질·제스처 원칙을 지키며 구현 |
| 5. 모바일 | `mobile-native` | 100vh, 입력 확대, 탭 하이라이트, 노치 safe-area 등 모바일 네이티브 감각 처리 |
| 6. 모션 | `find-animation-opportunities` → `animate` | 애니메이션이 필요한 곳을 고르고(불필요한 곳은 배제) 구현. React Native/Expo면 `animate-expo` |
| 7. 검수 | `impeccable` `audit` + `hallmark audit` + `web-design-guidelines` → `polish`, `review-animations` (Read), `improve-animations` | 접근성·성능·반응형 점검, AI 슬롭 패턴 점검(`hallmark audit`은 수정 없이 목록만), 모션 리뷰, 최종 폴리시. 데스크톱·모바일 스크린샷을 한 번에 확인하고 수정은 한 번에 묶어서 최대 1회 재확인 |

`hallmark`는 이 파이프라인 안에서는 `audit`(필요하면 `study`)만 쓴다. 기본 디자인 플로우는 테마를 따로 골라
`impeccable`/`design-taste-frontend`의 결정과 충돌하므로, 사용자가 Hallmark를 이름으로 부를 때만 실행한다.

여러 시안을 비교해야 하면 4단계 전에 `prototype` (Read)으로 변형안을 만든다.
Swift 코드가 있으면 `write-swift`를 적용한다. 동작 이름을 모르면 `animation-vocabulary`를 참고한다.

## Higgsfield 크레딧 규칙 (필수, 2026-11-16 사용자 지시)

- Higgsfield 크레딧을 쓰는 생성(이미지·영상·3D·오디오·업스케일 등)은 **사용자의 명시적 허락을 받은 뒤에만** 실행한다.
- 허락을 구할 때는 무엇을, 어떤 모델로, 몇 개, 단가와 합계 크레딧이 얼마인지 먼저 말한다. 견적은 `get_cost`처럼 크레딧이 들지 않는 조회로만 낸다.
- 허락받은 범위(개수·금액)를 넘지 않는다. 실패나 재시도로 범위를 넘게 되면 다시 허락을 받는다.
- 낭비 금지: 코드로 만들 수 있는 것은 코드로 만들고, 생성물은 시험용 1개로 먼저 확인한 뒤 나머지를 만든다.

## 줄바꿈 규칙 (웹·PPT·영상 자막 공통, 필수)

한국어·영어 모든 문구에 적용한다. 화면 폭이 바뀌어도 지켜져야 한다.

1. **단어 중간에서 줄을 바꾸지 않는다.** "동|네", "서울|관광재단"처럼 한 단어가 두 줄로 갈라지면 안 된다. 줄은 띄어쓰기에서만 바뀐다.
2. **문장·구절 단위로 줄을 바꾼다.** 줄 끝에 문장 앞부분 한두 단어만 남기고 나머지를 다음 줄로 넘기지 않는다. 다음 줄에 다 들어가는 짧은 문장이나 구절은 통째로 넘긴다. 쉼표·마침표 뒤에서 끊는 것을 우선한다.
   - 틀림: "한성백제부터 지금 걷게 될 도시까지, 서울의 2천 년. 곧 ⏎ 이어집니다."
   - 맞음: "한성백제부터 지금 걷게 될 도시까지, 서울의 2천 년. ⏎ 곧 이어집니다."
3. **마지막 줄에 단어 하나만 남기지 않는다.** 제목은 줄 길이를 고르게 나눈다.

구현 방법:
- 웹: 전역에 `word-break: keep-all; overflow-wrap: break-word;`, 제목은 `text-wrap: balance`, 본문은 `text-wrap: pretty`. 짧은 설명문·안내문·카드 문구는 `src/components/Phrases.tsx`(`<Phrases text={...} />`)로 감싸 문장·구절 단위로만 줄이 바뀌게 한다. 검수 때 휴대폰(375px)·iPad·데스크톱에서 한국어와 영어 둘 다 실제 줄바꿈을 확인한다.
- PPT·문서: 텍스트 상자 폭에 맡기지 않고 구절 경계에 줄바꿈(Shift+Enter)을 직접 넣는다. 한국어 텍스트는 단어 단위 줄바꿈 옵션을 켠다(PowerPoint: 단락 → 한글 단어 잘림 허용 끔). python-pptx 등 코드로 만들 때도 같은 기준으로 줄을 나눠 넣고, 렌더링한 이미지로 확인한다.
- 영상 자막·모션그래픽: 한 줄에 한 구절씩 끊어서 배치하고, 렌더 프레임에서 확인한다.

## 영상·모션그래픽·PPT·기획 파이프라인

| 작업 | 순서 |
|---|---|
| 기획 | 브리프가 모호하면 `brainstorming`으로 의도·대상·범위를 먼저 확정한다. 브리프가 이미 구체적이면 짧게 확인만 하고 넘어간다. 사용자가 계획을 검증받고 싶어 하면 `grilling`(사용자 명령은 `/grill-me`), 대화를 기획서로 정리할 때는 `/to-spec`(처음 한 번 `/setup-matt-pocock-skills`로 이슈 트래커 설정) |
| 개발 | 코드를 쓰거나 고칠 때는 `karpathy-guidelines`를 지킨다. 여러 단계짜리 개발은 superpowers 흐름(`writing-plans` → `test-driven-development` → `verification-before-completion`)을 따르고, 버그는 `systematic-debugging` |
| 영상·모션그래픽 | `hyperframes`(진입점)가 용도별 워크플로(`motion-graphics`, `product-launch-video`, `faceless-explainer`, `music-to-video`, `talking-head-recut`, `embedded-captions` 등)를 고른다. 움직임은 `hyperframes-animation` + GSAP 공식 스킬(`gsap-*`), 디자인 방향은 `hyperframes-creative`와 `design-md-library`. 사용자가 Remotion(React)을 지정하거나 기존 Remotion 프로젝트면 `remotion-best-practices`(진입점)와 `remotion-*` |
| 3D·CAD·제작 | 부품 모델링은 `cad`, 2D 도면은 `dxf`·`engineering-drawing`, 제조성 검토는 `dfm`·`dfam-check`, 3D 프린팅은 `gcode` → `bambu-labs`, 기성 부품은 `step-parts` |
| 소리 | 내레이션·음악·효과음은 ElevenLabs MCP(`elevenlabs`)를 우선 쓰고, 코드로 처리해야 하면 `text-to-speech`·`music`·`sound-effects`·`speech-to-text` 스킬. 믹싱은 `hyperframes-audio` |
| PPT | 편집 가능한 .pptx가 필요하면 Anthropic `pptx` 스킬 + `theme-factory`, 비주얼 중심 덱은 Gamma MCP(`gamma`), 인터랙티브 HTML 덱은 `slideshow` |

superpowers 스킬(`brainstorming`, `writing-plans`, `test-driven-development` 등)은 실제로 무언가를 만들거나 고치는 작업에서만 쓴다.
질문·검색·조사·설명·스킬 설치·설정 작업에는 쓰지 않는다. `using-superpowers`는 사용자가 `/using-superpowers`로 직접 부를 때만 쓴다.
`npx skills update`로 superpowers를 업데이트하면 이 제한을 넣은 설명문이 원본으로 돌아가므로, 업데이트 뒤에는 다시 좁혀 둔다.

이 작업들에도 아래 우선순위와 완료 보고 규칙을 그대로 적용한다.

### 스킬 간 충돌 시 우선순위

1. 사용자 브리프 (명시된 폰트·색·스타일·시대감이 항상 우선)
2. `impeccable` (전체 흐름, craft-floor의 절대 금지 규칙)
3. `design-taste-frontend` (안티 슬롭 규칙, 다이얼)
4. `emil-design-eng` / `apple-design` (세부 완성도, 모션 원칙)
5. 나머지 스킬

### 완료 보고

작업이 끝나면 어떤 단계에서 어떤 스킬을 적용했는지, 건너뛴 단계가 있다면 그 이유를 짧게 보고한다.
