# 직접 준비할 이미지 목록과 GPT 프롬프트

원칙: Higgsfield 크레딧은 쓰지 않는다. 코드로 그릴 수 있는 것은 전부 코드로 만들고, 아래 목록만 사용자가 직접 준비한다.

| 언제 | 이미지 | 장수 | 필수 여부 |
|---|---|---|---|
| **지금** | 첫 화면 시안 A, B, C | 3 | 필수 |
| 시안을 고른 뒤 | 고른 시안의 그림 부분(플레이트) | 1~3 | 고른 시안에 따라 다름 (아래 2단계) |
| 시안을 고른 뒤 | 판목·한지 질감 타일 | 0~2 | 시안에서 깨끗한 질감을 잘라낼 수 없을 때만 |
| 데이터 조사 뒤 | 장소 사진 | 36~48 | 공공누리 공개 사진 (GPT 아님) |

## 코드로 만드는 것 (준비 불필요)

| 항목 | 방법 |
|---|---|
| 서울 12개 구 목판 지도의 경계선 | 구 경계 공개 데이터(GeoJSON)로 SVG를 그린다 |
| 유형 결과 카드, 코스 경로·눈금 | Satori 이미지 생성 + SVG 기호 + Phosphor 아이콘 |
| "Pull the print" 전환 | GSAP 마스크 애니메이션 + 한지 들림 3D 변형 |
| 히어로의 은은한 움직임 | 셰이더(먹 광택, 미세한 카메라 이동) |
| 메타버스 5개 구의 건물·소품·아바타 | React Three Fiber 절차적 저폴리곤 모델 |
| 메타버스 대기실 소개 | 실제 3D 장면을 카메라가 천천히 도는 실시간 렌더(영상 파일 없음) |
| 발표용 소개 영상(선택) | HyperFrames 코드 영상 |

## GPT에서 만들 때 공통 요령

1. **비율**: 시안과 플레이트는 16:9 가로. 16:9가 없으면 가로형(3:2)으로 만들어도 된다. 질감 타일은 정사각형(1:1)
2. **프롬프트는 그대로 붙여 넣는다.** 줄바꿈과 따옴표 속 문구까지 그대로 둔다. 따옴표 안의 영어 문구가 화면에 그대로 찍혀야 한다
3. **한글은 넣지 않았다.** GPT 이미지는 한글을 자주 깨뜨린다. 실제 사이트의 글자는 모두 코드로 들어가므로 시안에는 영어만 있으면 된다
4. **다시 생성해야 하는 경우**
   - 포스터나 그림처럼 나왔다 → 첫 줄 앞에 `IMPORTANT: this must look like a real website screenshot with a navigation bar and buttons.`를 붙여 다시
   - 크림색·베이지색 종이가 나왔다 → `The paper must be cool white with a faint grey-blue cast, like #ECEEEC. No yellow, no cream.`를 끝에 붙여 다시
   - 붉은 도장이 찍혔다 → `Remove every red stamp or seal. The only accent color is deep indigo.`를 붙여 다시
   - 글자가 틀렸다 → 글자만 틀린 것은 괜찮다. 구도와 질감이 좋으면 그대로 쓴다(글자는 코드로 다시 넣는다)
5. **파일 이름과 올릴 위치**: 아래 각 항목에 적힌 이름으로 저장해, GitHub 저장소 `NATHAN18-ABLE/for-nathan`의 브랜치 `claude/seoul-tour-plan`, 폴더 `assets/incoming/`에 올린다 (웹에서 Add file → Upload files)
6. 마음에 드는 결과가 여러 장이면 `comp-a-2.png`처럼 번호를 붙여 함께 올려도 된다

### 색 기준 (모든 프롬프트 공통)

| 이름 | 값 | 쓰임 |
|---|---|---|
| Ink | `#1B2026` 푸른 기가 도는 거의 검정 | 먹, 글자 |
| Pearwood block | `#24201D` ~ `#3A322C` 먹을 먹은 짙은 배나무 | 판목 |
| Hanji | `#ECEEEC` 아주 옅은 회청색이 도는 흰색 | 한지, 밝은 면 |
| Indigo (jjok) | `#26407A` 짙은 천연 쪽빛 | 유일한 포인트 색, 버튼, 선택 상태 |

---

## 1단계: 첫 화면 시안 3장 (지금, 필수)

세 시안은 같은 세계관(목판 지도첩)에서 **구도만 다르다**. 셋 다 만들어 주면 그중 하나를 고른다.

### 시안 A: 전면 판목 지도 + 왼쪽 문구 + 하단 첫 문항 미리보기

파일 이름: `comp-a.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, flat UI rendering as seen in a browser. This is a real web page with a navigation bar, readable text and buttons. It is not a poster, not an illustration, not a photograph of an object.

OVERALL CONCEPT
A travel website that matches foreign visitors to one of twelve Seoul districts through a short personality test. The page looks like a Joseon-era woodblock printing block of a modern Seoul map, carved from dark ink-soaked pearwood, with UI elements printed on cool white hanji paper.

LAYOUT, TOP TO BOTTOM
1) Navigation bar: full width, 64px tall, solid ink color #1B2026. At the far left, a small wordmark "Seoul, Printed" in a crisp high-contrast serif, cool white. On the right, four text links in a small clean sans-serif, evenly spaced: "Take the test", "12 Districts", "Meet travelers", "About", followed by a small toggle "EN / KO" with EN highlighted. A single thin hairline separates the bar from the hero.
2) Hero, filling everything below the nav to the bottom edge: a full-bleed carved woodblock map of modern Seoul seen from directly above, cropped so the city fills the frame edge to edge.
   - Each Seoul district is a separate carved block piece, fitted together like a jigsaw puzzle with thin dark gaps (2 to 3px) between pieces.
   - The Han River runs from the left edge to the right edge slightly below the vertical middle, as a deep carved channel filled with fine parallel horizontal gouge strokes.
   - Twelve districts are carved deeper and higher: their raised edges catch a soft cool white highlight from a raking light at the upper left. The remaining districts are carved shallow and sit darker.
   - Inside the raised districts, very fine carved lines suggest streets and small hills, like the carving style of the 1861 Daedongyeojido map: mountains as stacked wavy ridges, roads as thin single lines.
   - Material: dark pearwood (#24201D to #3A322C) soaked with ink, visible wood grain running diagonally, small V-gouge tool marks, a faint satin ink sheen on the high points. Soft studio light, no harsh shadows.
3) Headline block in the left third of the hero, vertically centered in the upper half, sitting over a calmer area of the map with a subtle dark vignette behind it for legibility:
   - Headline on two lines: "Find the Seoul that" / "feels like you." in a large high-contrast display serif with sharp, chiselled, carved-looking terminals, cool white #ECEEEC. The headline is about 72px tall per line.
   - Under it, one line of body text in a clean sans-serif, about 20px, cool white at 80% opacity: "Answer 12 quick questions. We match you to one of 12 Seoul districts and print your day."
4) Bottom strip: a horizontal band 120px tall spanning the full width at the bottom of the hero, printed on cool white hanji paper #ECEEEC with visible soft paper fibers and a thin double ink rule along its top edge, like the border of an old printed map.
   - At the left of the strip, a small label in ink: "Question 1 of 12".
   - Next to it, the question in a medium serif, ink color: "Your first morning in Seoul?"
   - Then two option buttons side by side, each a sharp-cornered rectangle with a 1px ink border and ink text: "A quiet alley with an old tea house" and "A riverside run at sunrise".
   - At the far right of the strip, one solid deep-indigo #26407A rectangular button with cool white text: "Find my Seoul".

STYLE RULES
Palette strictly limited to ink #1B2026, dark pearwood, cool white hanji #ECEEEC and one accent of deep natural indigo #26407A. Sharp 90-degree corners on every element, no rounded corners, no cards with shadows. Generous spacing, nothing crowded. Text is crisp and horizontal.

DO NOT INCLUDE
Red seal stamps or red accents, cream, beige or yellowed paper, dancheong patterns, taegeuk symbols, hanok roof clip art, photographs, people, gradients, glassmorphism, emoji, Korean characters, a scroll arrow.
```

### 시안 B: 한지에 찍힌 지도첩 한 면 + 오른쪽 12개 구 색인표

파일 이름: `comp-b.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, flat UI rendering as seen in a browser. This is a real web page with a navigation bar, readable text and buttons. It is not a poster, not an illustration, not a photograph of an object.

OVERALL CONCEPT
A travel website that matches foreign visitors to one of twelve Seoul districts through a short personality test. The whole page is a sheet of cool white hanji paper on which a woodblock map of modern Seoul has been printed in black-blue ink, like one page of an old folding atlas.

LAYOUT
1) Navigation bar: full width, 64px tall, on the same cool white hanji #ECEEEC as the page, with one thin ink hairline below it. At the far left, the wordmark "Seoul, Printed" in a crisp high-contrast serif, ink #1B2026. On the right, four links in a small clean sans-serif: "Take the test", "12 Districts", "Meet travelers", "About", then a small "EN / KO" toggle with EN in bold.
2) Left two thirds of the page below the nav: the printed map.
   - A rectangular frame made of a thick outer ink line and a thin inner ink line (an atlas border), with 40px of paper margin around it.
   - Inside, a woodblock print of modern Seoul in ink #1B2026 on hanji. District boundaries are carved lines of varying weight. The Han River crosses from left to right below the middle as a band of fine parallel horizontal strokes.
   - Twelve districts are printed with dense carved texture: hatching for hills, stacked wavy ridges for mountains, thin single lines for roads. The other districts are left almost blank, outline only.
   - The ink has the slightly uneven, velvety coverage of a hand-pulled woodblock print: tiny gaps where the paper fibers show through, slightly heavier ink at the edges of solid areas.
   - Over the upper left of the print, on a cleared patch of paper, the headline on two lines: "Find the Seoul that" / "feels like you." in a large high-contrast display serif with chiselled carved terminals, ink color, about 68px per line. Under it, one line of clean sans-serif body text, about 20px, ink at 75% opacity: "Answer 12 quick questions. We match you to one of 12 Seoul districts and print your day."
3) Right third: an index panel aligned to the top of the map frame.
   - A tall rectangle framed by a thin double ink rule, titled at the top "12 Districts" in a medium serif.
   - Inside, twelve rows in two columns. Each row has a small square carved number mark (01 to 12 in tiny ink numerals inside a square) followed by the district name in a clean sans-serif: Jongno, Jung, Yongsan, Mapo, Seodaemun, Seongdong, Dongdaemun, Nowon, Yeongdeungpo, Gwanak, Gangnam, Songpa. Thin ink rules only between the two column groups, not under every row.
   - Under the panel, one solid deep-indigo #26407A rectangular button, full panel width, cool white text "Find my Seoul", and under the button a small ink text line "Takes about 3 minutes".

STYLE RULES
Palette strictly limited to ink #1B2026, cool white hanji #ECEEEC with soft visible fibers, and one accent of deep natural indigo #26407A used only on the button. Sharp 90-degree corners everywhere, no rounded corners, no drop shadows, no cards. Calm and spacious, like a museum print.

DO NOT INCLUDE
Red seal stamps or red accents, cream, beige or yellowed paper, dancheong patterns, taegeuk symbols, hanok roof clip art, photographs, people, gradients, glassmorphism, emoji, Korean characters, a scroll arrow.
```

### 시안 C: 판목 확대 + 들려 나온 한 구의 판목 + 한지에 찍힌 하루 코스

파일 이름: `comp-c.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, flat UI rendering as seen in a browser. This is a real web page with a navigation bar, readable text and buttons. It is not a poster, not an illustration, not a photograph of an object.

OVERALL CONCEPT
A travel website that matches foreign visitors to one of twelve Seoul districts through a short personality test. The page shows the moment a matched district is lifted out of a carved woodblock map of Seoul and printed onto hanji paper as a one-day route.

LAYOUT
1) Navigation bar: full width, 64px tall, transparent, sitting directly on the dark woodblock. At the far left, the wordmark "Seoul, Printed" in a crisp high-contrast serif, cool white. On the right, four links in a small clean sans-serif, cool white: "Take the test", "12 Districts", "Meet travelers", "About", then a small "EN / KO" toggle.
2) Left 55% of the page: a close-up of the carved woodblock map of Seoul, as if the camera is 30cm above the block.
   - Dark ink-soaked pearwood (#24201D to #3A322C) with clear diagonal wood grain, V-gouge marks and a faint satin ink sheen.
   - District pieces fit together like a jigsaw with thin dark gaps. Near the right edge of this area, one district piece is missing, leaving an empty carved socket with clean vertical walls and a slightly lighter raw-wood floor.
   - Over the calm upper-left part of the block: the headline on two lines "Find the Seoul that" / "feels like you." in a large high-contrast display serif with chiselled carved terminals, cool white #ECEEEC, about 72px per line. Under it, one line of clean sans-serif body text, about 20px, cool white at 80% opacity: "Answer 12 quick questions. We match you to one of 12 Seoul districts and print your day."
3) Right 45% of the page, on a cool white hanji background #ECEEEC with soft visible fibers:
   - The missing district piece floats above the paper, tilted about 12 degrees, showing its carved top surface and 3cm-thick wooden side. It casts a soft, cool-tinted shadow on the paper.
   - Below and beside it, the paper shows the print of that same district shape in ink, and on top of the print a one-day route: six small deep-indigo #26407A square stop marks connected by a thin ink route line. Along the line, small perpendicular tick marks every few millimetres like distance marks on an old road map.
   - Each stop has a tiny label in a clean sans-serif, ink color: "Morning", "Lunch", "Afternoon", "Snack", "Dinner", "Night".
   - Under the print, one solid deep-indigo #26407A rectangular button with cool white text: "Find my Seoul".

STYLE RULES
Palette strictly limited to ink #1B2026, dark pearwood, cool white hanji #ECEEEC and one accent of deep natural indigo #26407A. Sharp 90-degree corners on every UI element, no rounded corners, no cards. Soft raking light from the upper left. Clean and premium, not busy.

DO NOT INCLUDE
Red seal stamps or red accents, cream, beige or yellowed paper, dancheong patterns, taegeuk symbols, hanok roof clip art, photographs, people, gradients, glassmorphism, emoji, Korean characters, a scroll arrow.
```

---

## 2단계: 시안을 고른 뒤 만들 플레이트 (고른 시안 것만)

플레이트는 시안 속 **그림 부분만** 글자와 버튼 없이 고해상도로 다시 그린 이미지다. 사이트에서는 이 플레이트 위에 코드로 글자와 버튼을 올린다.

**만드는 방법**: ChatGPT에 **고른 시안 이미지를 첨부**하고, 아래 해당 프롬프트를 붙여 넣는다. 시안을 그대로 잘라 쓰지 않는다(해상도와 가장자리 문제 때문). 정확한 영역은 시안을 고른 뒤 제가 시안을 측정해서 다시 알려드리고, 그때 프롬프트를 조금 고칠 수 있다.

### 시안 A를 고른 경우

**A-1 판목 지도 플레이트** (필수), 파일 이름 `plate-a-map.png`, 16:9

```
Use the attached image only as a composition and material reference. Recreate ONLY the carved woodblock map of Seoul from the hero area, as a clean full-frame image at 16:9, the highest resolution available.

Remove everything that is user interface: no navigation bar, no headline, no body text, no bottom strip, no buttons, no labels. Where text and UI were, continue the woodblock surface naturally, keeping the calmer, slightly darker area in the left third where the headline sat.

Keep exactly: the top-down view of Seoul carved as separate jigsaw-like district pieces with thin dark gaps; the Han River as a deep carved channel with fine parallel horizontal gouge strokes crossing left to right slightly below the middle; twelve districts carved higher with cool white highlights on their raised edges from a soft raking light at the upper left; the other districts shallow and darker; fine carved streets and stacked wavy ridges for hills inside the raised districts.

Material: dark ink-soaked pearwood #24201D to #3A322C, diagonal wood grain, V-gouge tool marks, faint satin ink sheen on high points. Even, soft lighting across the whole frame so it can sit behind text.

No text, no letters, no numbers, no red, no cream, no people, no frame or border.
```

### 시안 B를 고른 경우

**B-1 한지 인쇄 지도 플레이트** (필수), 파일 이름 `plate-b-print.png`, 16:9

```
Use the attached image only as a composition and material reference. Recreate ONLY the woodblock-printed map of Seoul on hanji paper from the left two thirds of the page, as a clean image at 16:9, the highest resolution available.

Remove everything that is user interface: no navigation bar, no headline, no body text, no index panel, no button, no district names, no numbers. Where the headline sat over the upper left of the print, leave clean paper with only the faintest print texture so text can sit on it later.

Keep exactly: the atlas border of a thick outer and thin inner ink line; the modern Seoul map printed in ink #1B2026 with district boundaries as carved lines; the Han River as a band of fine parallel horizontal strokes below the middle; twelve districts with dense carved hatching, wavy mountain ridges and thin road lines; the other districts as outlines only; the uneven, velvety coverage of a hand-pulled woodblock print with paper fibers showing through.

Paper: cool white hanji #ECEEEC with soft visible long fibers, no yellow, no cream. Extend the paper beyond the border to fill the frame.

No text, no letters, no numbers, no red, no people.
```

### 시안 C를 고른 경우

**C-1 판목 확대 플레이트** (필수), 파일 이름 `plate-c-block.png`, 16:9

```
Use the attached image only as a composition and material reference. Recreate ONLY the close-up of the carved woodblock map of Seoul from the left part of the page, extended to fill a full 16:9 frame, the highest resolution available.

Remove everything that is user interface: no navigation bar, no headline, no body text, no button. Remove the floating district piece and the hanji sheet; extend the woodblock across the whole frame instead. Keep the empty carved socket where one district piece is missing, with clean vertical walls and a slightly lighter raw-wood floor.

Material: dark ink-soaked pearwood #24201D to #3A322C, clear diagonal wood grain, V-gouge marks, faint satin ink sheen, jigsaw-like district pieces with thin dark gaps. Soft raking light from the upper left. Keep the upper-left area calm for text.

No text, no letters, no numbers, no red, no cream, no people.
```

**C-2 들린 구 판목 컷아웃** (필수), 파일 이름 `plate-c-piece.png`, 1:1, **투명 배경**

```
Use the attached image only as a reference for the floating district piece. Create ONLY that single carved woodblock district piece as an isolated object on a fully transparent background (PNG with alpha), square 1:1, the highest resolution available.

The piece: an irregular district-shaped block of dark ink-soaked pearwood #24201D to #3A322C, about 3cm thick, tilted about 12 degrees toward the viewer so both its carved top surface and its wooden side are visible. The top surface has fine carved streets and small stacked wavy ridges for hills, with cool white highlights on the raised edges. The side shows raw wood grain, slightly lighter than the top. Soft raking light from the upper left.

No shadow on the background, no paper, no text, no other objects. Clean, crisp edges against transparency.
```

**C-3 한지 종이** (선택: 시안의 한지가 깨끗하면 생략), 파일 이름 `plate-c-paper.png`, 16:9: 아래 질감 타일 T-2로 대신한다.

---

## 3단계 (예비): 질감 타일

시안에서 깨끗한 질감 조각을 잘라낼 수 없을 때만 만든다. 시안을 측정한 뒤 필요 여부를 알려드린다. 이음매 없이 반복되는 정사각형 이미지다.

**T-1 판목 질감**, 파일 이름 `texture-pearwood.png`, 1:1

```
A seamless, tileable square texture, 1:1, the highest resolution available, viewed straight on with no perspective.

Flat surface of a dark pearwood woodblock used for traditional Korean woodblock printing, soaked with ink over many years: base color between #24201D and #3A322C, fine wood grain running diagonally from lower left to upper right, a few shallow V-gouge tool marks, a faint satin sheen where ink has polished the surface. Even, shadowless lighting.

The texture must repeat seamlessly on all four edges with no visible seams, no vignette, no obvious repeating features. No carvings of shapes, no text, no objects.
```

**T-2 한지 질감**, 파일 이름 `texture-hanji.png`, 1:1

```
A seamless, tileable square texture, 1:1, the highest resolution available, viewed straight on with no perspective.

Flat sheet of handmade Korean hanji mulberry paper, cool white #ECEEEC with a faint grey-blue cast. Long, soft mulberry fibers visible as slightly brighter and slightly darker strands running in random directions, very subtle thickness variation, no stains, no yellowing. Even, shadowless lighting.

The texture must repeat seamlessly on all four edges with no visible seams, no vignette, no obvious repeating features. No print, no ink, no text, no folds, no cream or beige.
```

---

## 4단계: 장소 사진 (공개 사진, GPT 아님)

- 출처: 한국관광공사 포토코리아(photo.visitkorea.or.kr) 등 **공공누리 1유형**(출처 표시 시 자유 이용) 사진
- 장당 가로 1600px 이상, 사람 얼굴이 크게 나오지 않은 사진
- 올릴 위치: `assets/incoming/places/`, 같은 폴더에 `credits.csv`(`slug,제목,촬영자,출처URL,공공누리유형`)
- **목록은 데이터 조사 단계에서 확정한다.** 12개 구의 장소·식당 100~120곳을 조사하고 확인한 뒤, 사진이 꼭 필요한 곳만 골라 slug와 함께 드린다(예상 36~48장). 그 전에는 준비하지 않아도 된다.
