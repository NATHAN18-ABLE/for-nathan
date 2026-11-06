# 직접 준비할 이미지 목록

원칙: Higgsfield 크레딧은 쓰지 않는다. 코드로 그릴 수 있는 것은 전부 코드로 만들고, 아래 목록만 사용자가 직접 준비한다.

## 코드로 만드는 것 (준비 불필요)

| 항목 | 방법 |
|---|---|
| 서울 12개 구 목판 지도 | 구 경계 공개 데이터(GeoJSON)로 SVG를 그리고, 판목 질감은 시안에서 잘라낸 질감 조각을 반복 타일로 사용 |
| 유형 결과 카드, 코스 경로·눈금 | Satori 이미지 생성 + SVG 기호 + Phosphor 아이콘 |
| "Pull the print" 전환 | GSAP 마스크 애니메이션 + 한지 들림 3D 변형 |
| 히어로의 은은한 움직임 | 셰이더(먹 광택, 미세한 카메라 이동) |
| 메타버스 5개 구의 건물·소품·아바타 | React Three Fiber 절차적 저폴리곤 모델 |
| 메타버스 대기실 소개 | 실제 3D 장면을 카메라가 천천히 도는 실시간 렌더(영상 파일 없음) |
| 발표용 소개 영상(선택) | HyperFrames 코드 영상 |

## 1단계: 지금 준비할 것, 첫 화면 시안 3장 (GPT 이미지)

- 비율: **16:9 가로** (데스크톱 첫 화면)
- 세 프롬프트는 같은 세계관에서 **구도만 다르게** 만든 것이다. 결과가 포스터나 그림처럼 나오면 "website screenshot, flat UI"를 강조해 다시 생성한다
- 지도 모양이 실제와 조금 달라도 괜찮다. 시안은 구도와 질감의 기준이고, 실제 구 경계는 코드가 공개 데이터로 그린다
- 파일 이름: `comp-a.png`, `comp-b.png`, `comp-c.png`
- 올릴 위치: GitHub 저장소 `NATHAN18-ABLE/for-nathan`의 브랜치 `claude/seoul-tour-plan`, 폴더 `assets/incoming/` (웹에서 Add file → Upload files)

### 시안 A: 전면 판목 지도 + 왼쪽 문구 + 하단 첫 문항 미리보기

```
A desktop website homepage screenshot, 16:9, flat UI design, not a poster, not a painting.
Layout from top to bottom:
1) A slim single-line navigation bar, 64px tall, on dark ink background: small wordmark "Seoul, Printed" at left; links at right "Take the test", "12 Districts", "Meet travelers", "About", and a small "EN / KO" toggle.
2) Hero filling the rest of the screen: a full-bleed map of modern Seoul seen from directly above, carved as a woodblock print. Each district is a separate carved block piece fitted together like a puzzle with thin gaps between pieces; the Han River runs east to west through the middle as a deep carved channel. Twelve districts are carved deeper and catch cool white light on their edges; the other districts are shallow and dim. The block surface is dark ink-soaked pearwood with visible carving grooves and wood grain.
3) In the left third, over a calm area of the map, large display headline "Find the Seoul that feels like you." in a high-contrast serif with chiselled, carved-looking terminals, cool white. Under it one line of smaller sans-serif text: "Answer 10 quick questions. We match you to one of 12 Seoul districts and print your day."
4) Along the bottom edge, a horizontal strip printed on cool white hanji paper with thin carved rules, previewing the first question: "Your first morning in Seoul?" with two option buttons side by side: "A quiet alley with an old tea house" and "A riverside run at sunrise". At the right end of the strip, one solid deep-indigo button "Find my Seoul".
Palette: ink near-black with a blue-grey cast, cool white hanji (not cream, not beige), one accent of deep natural indigo. Sharp rectangular corners everywhere, no rounded cards.
Avoid: red seal stamps, cream or beige paper, dancheong patterns, hanok roof clip art, photographs, gradients, glassmorphism.
```

### 시안 B: 한지에 찍힌 지도 + 오른쪽 12개 구 색인표

```
A desktop website homepage screenshot, 16:9, flat UI design, not a poster, not a painting.
Layout:
1) A slim single-line navigation bar, 64px tall, cool white hanji background with a thin ink rule below: wordmark "Seoul, Printed" at left; links "Take the test", "12 Districts", "Meet travelers", "About", "EN / KO" at right.
2) Left two thirds: a woodblock print of modern Seoul printed in black-blue ink on cool white hanji, like a page from an old folding atlas with a carved double-line border. District outlines are carved lines; the Han River is a band of fine parallel carved strokes. Twelve districts are printed with dense carved texture, the rest are left nearly blank.
3) Over the upper left of the print, large display headline "Find the Seoul that feels like you." in a high-contrast serif with carved terminals, ink color, with one sans-serif line under it: "Answer 10 quick questions. We match you to one of 12 Seoul districts and print your day."
4) Right third: a tall index table framed with thin double carved rules, titled "12 Districts", listing in two columns with a small carved number mark each: Jongno, Jung, Yongsan, Mapo, Seodaemun, Seongdong, Dongdaemun, Nowon, Yeongdeungpo, Gwanak, Gangnam, Songpa. Under the table, one solid deep-indigo button "Find my Seoul" and a small text link "Takes about 3 minutes".
Palette: cool white hanji (not cream, not beige), black-blue ink, one accent of deep natural indigo. Sharp rectangular corners, no rounded cards.
Avoid: red seal stamps, cream or beige paper, dancheong patterns, hanok roof clip art, photographs, gradients, glassmorphism.
```

### 시안 C: 판목 확대 + 들려 나온 한 구의 판목과 인쇄된 하루 코스

```
A desktop website homepage screenshot, 16:9, flat UI design, not a poster, not a painting.
Layout:
1) A slim single-line navigation bar, 64px tall, transparent over the hero: wordmark "Seoul, Printed" at left; links "Take the test", "12 Districts", "Meet travelers", "About", "EN / KO" at right, in cool white.
2) Left 55%: a close-up of the carved woodblock map of Seoul, dark ink-soaked wood, district pieces fitted together with thin gaps; one district piece is missing from the puzzle, leaving an empty carved socket. Large display headline "Find the Seoul that feels like you." on the dark block in a high-contrast serif with carved terminals, cool white, with one sans-serif line under it: "Answer 10 quick questions. We match you to one of 12 Seoul districts and print your day."
3) Right 45%: that missing district piece lifted out and floating at a slight angle, and beside it a sheet of cool white hanji printed with the district's shape and a one-day route: six small deep-indigo stop marks connected by a route line with tick marks, labeled "Morning", "Lunch", "Afternoon", "Snack", "Dinner", "Night".
4) Under the hanji sheet, one solid deep-indigo button "Find my Seoul".
Palette: ink-soaked dark wood, cool white hanji (not cream, not beige), one accent of deep natural indigo. Sharp rectangular corners.
Avoid: red seal stamps, cream or beige paper, dancheong patterns, hanok roof clip art, photographs, gradients, glassmorphism.
```

## 2단계: 시안 승인 후 (필요할 때만)

시안 속 그림 부분(판목, 들린 한지 같은 질감·입체 표현)은 사이트에 쓸 고해상도 이미지로 다시 그려야 할 수 있다. 승인된 시안을 보고 필요한 장수(예상 0~2장)와 프롬프트를 그때 따로 드린다. 시안을 잘라서 그대로 쓰지는 않는다.

## 3단계: 장소 사진 (공개 사진)

- 출처: 한국관광공사 포토코리아(photo.visitkorea.or.kr) 등 **공공누리 1유형**(출처 표시 시 자유 이용) 사진
- 장당 가로 1600px 이상, 사람 얼굴이 크게 나오지 않은 사진
- 올릴 위치: `assets/incoming/places/`, 같은 폴더에 `credits.csv`(`slug,제목,촬영자,출처URL,공공누리유형`)
- **목록은 데이터 단계에서 확정한다.** 12개 구의 장소·식당 100~120곳을 조사하고 확인한 뒤, 구마다 대표 사진 1장과 코스 지점 사진을 합쳐 사진이 꼭 필요한 곳만 골라 slug와 함께 드린다(예상 36~48장). 그 전에는 준비하지 않아도 된다.
