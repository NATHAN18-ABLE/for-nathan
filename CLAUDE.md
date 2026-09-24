# 프로젝트 지침

## 사이트 제작 파이프라인 (필수)

웹사이트·랜딩페이지·포트폴리오·대시보드·웹앱 UI 등 **프론트엔드 화면을 새로 만들거나 리디자인할 때는**
`.claude/skills/`에 설치된 디자인 스킬을 아래 순서대로 **전부** 적용한다. 일부만 골라 쓰지 않는다.
작은 수정(버그 하나, 문구 하나)이라면 해당 단계의 스킬만 적용해도 된다.

`disable-model-invocation`이 걸린 스킬(`pick-ui-library`, `prototype`, `review-animations`)은
Skill 도구로 호출할 수 없으므로 해당 `SKILL.md`를 직접 Read 해서 지침을 따른다.

| 단계 | 스킬 | 할 일 |
|---|---|---|
| 1. 맥락 | `impeccable` | `.claude/skills/impeccable/scripts/impeccable context` 실행 → PRODUCT.md 없으면 `init`, 이어서 `shape`/new-work로 모드(Persuade/Operate/Read/Experience)와 비주얼 월드 결정 |
| 2. 방향 | `design-taste-frontend` | 한 줄 "Design Read" 출력, 세 다이얼 값 결정, 템플릿 같은 AI 디자인 금지 규칙 적용 |
| 3. 라이브러리 | `pick-ui-library` (Read) | 필요한 UI 라이브러리 선정. 토스트가 필요하면 `ask-sonner` |
| 4. 구현 | `impeccable` craft-floor + `emil-design-eng` + `apple-design` | UI 편집 전 `impeccable/reference/craft-floor.md`를 읽고, 컴포넌트 완성도·타이포·재질·제스처 원칙을 지키며 구현 |
| 5. 모바일 | `mobile-native` | 100vh, 입력 확대, 탭 하이라이트, 노치 safe-area 등 모바일 네이티브 감각 처리 |
| 6. 모션 | `find-animation-opportunities` → `animate` | 애니메이션이 필요한 곳을 고르고(불필요한 곳은 배제) 구현. React Native/Expo면 `animate-expo` |
| 7. 검수 | `impeccable` `audit` → `polish`, `review-animations` (Read), `improve-animations` | 접근성·성능·반응형 점검, 모션 리뷰, 최종 폴리시. 데스크톱·모바일 스크린샷을 한 번에 확인하고 수정은 한 번에 묶어서 최대 1회 재확인 |

여러 시안을 비교해야 하면 4단계 전에 `prototype` (Read)으로 변형안을 만든다.
Swift 코드가 있으면 `write-swift`를 적용한다. 동작 이름을 모르면 `animation-vocabulary`를 참고한다.

### 스킬 간 충돌 시 우선순위

1. 사용자 브리프 (명시된 폰트·색·스타일·시대감이 항상 우선)
2. `impeccable` (전체 흐름, craft-floor의 절대 금지 규칙)
3. `design-taste-frontend` (안티 슬롭 규칙, 다이얼)
4. `emil-design-eng` / `apple-design` (세부 완성도, 모션 원칙)
5. 나머지 스킬

### 완료 보고

작업이 끝나면 어떤 단계에서 어떤 스킬을 적용했는지, 건너뛴 단계가 있다면 그 이유를 짧게 보고한다.
