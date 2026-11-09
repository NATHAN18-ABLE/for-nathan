# 직접 준비할 이미지 목록과 GPT 프롬프트 (백자와 서울의 빛)

원칙: 코드로 그릴 수 있는 것은 전부 코드로 만들고, 아래 목록만 사용자가 직접 준비한다. Higgsfield는 첫 화면 스크롤 영상 2개에만 쓴다(2026-11-09 사용자 결정).

| 언제 | 이미지 | 장수 | 비고 |
|---|---|---|---|
| **지금** | 첫 화면 시안 A, B, C | 3 | 필수 |
| **지금** (시안 B 승인됨) | 스크롤 영상용 키프레임: 낮 마스터, 같은 구도의 밤, 남산타워 확대 | 3 | 생성 이미지임을 사이트에 표기 |
| 데이터 조사 뒤 | 장소 사진 | 36~48 | 공공누리 공개 사진 (GPT 아님). 구마다 대표 사진 포함 |

방향 이력: 목판 지도첩 시안 탈락(2026-11-06, `.impeccable/mocks/decision/rejected-woodblock-*.png`), 민화 보류(만화처럼 보일 우려), 백자와 서울의 빛 확정(2026-11-09).

## 코드로 만드는 것 (준비 불필요)

| 항목 | 방법 |
|---|---|
| 버튼, 둥근 패널, 글자, 진행 표시 | 코드 |
| 청화 코발트 선 그림(구 윤곽, 코스 경로) | 구 경계 공개 데이터 + SVG, 붓으로 그리듯 그려지는 모션 |
| 유형 결과 카드 | Satori 이미지 생성 (유형 이름 + 코발트 선 그림 + 구 사진) |
| 메타버스 5개 구 | React Three Fiber 절차적 저폴리곤 모델 |

## GPT에서 만들 때 공통 요령

1. **비율**: 16:9 가로. 없으면 가로형(3:2)
2. **프롬프트는 통째로 붙여 넣는다.** 따옴표 속 영어 문구가 화면에 그대로 찍혀야 한다
3. **한글은 넣지 않았다.** 실제 글자는 코드로 넣는다
4. **다시 생성해야 하는 경우**
   - 웹사이트가 아니라 사진이나 포스터처럼 나왔다 → 맨 앞에 `IMPORTANT: this must look like a real website screenshot with a navigation bar, readable text and rounded buttons.`
   - 검정·금색이나 베이지가 섞였다 → 맨 끝에 `Keep the palette porcelain white, soft grey, cobalt blue and a hint of pale celadon only. No black backgrounds, no gold, no beige.`
   - 각진 버튼이 나왔다 → 맨 끝에 `Every button is a fully rounded pill and every panel has large rounded corners.`
   - 글자만 틀렸다 → 구도와 분위기가 좋으면 그대로 써도 된다
5. **올릴 위치**: GitHub 저장소 `NATHAN18-ABLE/for-nathan` → 브랜치 `claude/seoul-tour-plan` → `assets/incoming/`. 채팅에 바로 올려도 된다

### 색 기준

| 이름 | 값 | 쓰임 |
|---|---|---|
| Porcelain white | `#F6F6F3` | 바탕 |
| Porcelain shadow | `#E4E6E2` | 패널, 구분 |
| Ink | `#1E2126` | 글자 |
| Cobalt (cheonghwa) | `#22418F` | 유일한 포인트: 주 버튼, 선 그림, 선택 상태 |
| Celadon | `#9CC3B3` | 아주 옅은 보조 바탕에만 |

---

## 1단계: 첫 화면 시안 3장

### 시안 A: 달항아리 정물과 창 너머 서울

파일 이름: `comp-a.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, as seen in a browser. A real, refined web page with a navigation bar, readable text and rounded pill buttons. It is not a poster and not an advertisement photo.

CONCEPT
A premium travel website that matches foreign visitors to one of twelve Seoul districts through a short, elegant personality test. The mood is quiet luxury: Joseon white porcelain and the light of contemporary Seoul. Bright, airy, calm, expensive, never dark.

LAYOUT
1) Navigation bar, 72px tall, on the porcelain white page background with no divider line. At the left, a wordmark "Seoul, Curated" in an elegant contemporary sans-serif with wide letter spacing. On the right, links in the same sans-serif, small and light: "The test", "12 Districts", "Meet travelers", "About", and a small pill toggle "EN | KO".
2) Left 42% of the hero, vertically centered: the headline "Find your Seoul." in a large, elegant, light-weight contemporary sans-serif with generous spacing, ink #1E2126, about 88px. Under it, one line of body text, about 20px, ink at 65% opacity: "Twelve quiet questions. One district that suits you, and a day to spend there." Under that, a pill-shaped button filled cobalt blue #22418F with white text "Take the test", and beside it a pill-shaped text button with a thin grey outline: "Explore 12 districts".
3) Right 58% of the hero: a photorealistic still life inside a large panel with 28px rounded corners. A Joseon moon jar (white porcelain, slightly asymmetric, soft milky glaze) stands on a low pale stone plinth, lit by warm late-afternoon sunlight from the left that casts a long soft shadow. Behind it, a tall window shows Seoul at golden hour, softly out of focus: curved hanok roof tiles in the foreground and modern glass towers and a mountain ridge beyond. The light is golden and gentle, the room is white and minimal.
4) At the very bottom of the viewport, partly visible, a horizontal row of three rounded photo cards hinting at the next section, each a small sunlit photograph of a Seoul neighborhood with a name under it: "Jongno", "Seongdong", "Mapo".

STYLE RULES
Palette: porcelain white #F6F6F3, porcelain shadow grey #E4E6E2, ink #1E2126, one accent of cobalt underglaze blue #22418F used only on the main button, a hint of pale celadon #9CC3B3 allowed in shadows. Fully rounded pill buttons, panels and cards with large rounded corners, no sharp corners, no heavy lines. Lots of white space, like a high-end design hotel or a fine fragrance brand website.

DO NOT INCLUDE
Black or dark backgrounds, gold or brass, beige or cream, red, dancheong patterns, taegeuk symbols, cartoon illustrations, sharp square buttons, heavy borders, gradients, glassmorphism, emoji, Korean characters, people's faces, a scroll arrow.
```

### 시안 B: 해 질 녘 서울 사진 위의 백자 패널

파일 이름: `comp-b.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, as seen in a browser. A real, refined web page with a navigation bar, readable text and rounded pill buttons. It is not a poster and not an advertisement photo.

CONCEPT
A premium travel website that matches foreign visitors to one of twelve Seoul districts through a short, elegant personality test. Quiet luxury: Joseon white porcelain and the light of contemporary Seoul. Bright and warm, never dark.

LAYOUT
1) Navigation bar, 72px tall, transparent over the hero photograph, text in white: wordmark "Seoul, Curated" at the left in an elegant contemporary sans-serif with wide letter spacing; links "The test", "12 Districts", "Meet travelers", "About" and a small pill toggle "EN | KO" at the right.
2) Hero: a full-bleed cinematic photograph of Seoul at golden hour, bright and warm rather than dark. In the foreground, the graceful upturned eave of a hanok roof with grey clay tiles, sharp and sunlit; beyond it, a softly blurred city of low neighborhoods, modern towers and a mountain ridge under a pale peach and blue sky.
3) Over the left side of the photo, a large porcelain-white panel #F6F6F3 with 28px rounded corners, slightly translucent at the edges, occupying about 36% of the width and centered vertically. Inside: the headline "Find your Seoul." in a large, elegant, light-weight contemporary sans-serif, ink #1E2126, about 76px; one line of body text, about 19px, ink at 65%: "Twelve quiet questions. One district that suits you, and a day to spend there."; a pill button filled cobalt blue #22418F with white text "Take the test"; under it, a small grey line "About 3 minutes".
4) Along the bottom of the hero, a row of twelve small pill-shaped chips on a frosted white strip, each with a tiny round photo thumbnail and a district name: Jongno, Jung, Yongsan, Mapo, Seodaemun, Seongdong, Dongdaemun, Nowon, Yeongdeungpo, Gwanak, Gangnam, Songpa.

STYLE RULES
Palette: porcelain white #F6F6F3, porcelain shadow grey #E4E6E2, ink #1E2126, one accent of cobalt blue #22418F on the main button only. Fully rounded pill buttons and chips, panels with large rounded corners, no sharp corners, no heavy lines. Feels like a luxury hotel or fine fragrance brand website: calm, generous spacing, golden light.

DO NOT INCLUDE
A dark or night-time photo, black backgrounds, gold or brass, beige or cream, red, dancheong patterns, taegeuk symbols, cartoon illustrations, sharp square buttons, heavy borders, gradients over text, emoji, Korean characters, people's faces, a scroll arrow.
```

### 시안 C: 컨시어지 테스트 미리보기와 청화 달항아리

파일 이름: `comp-c.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, as seen in a browser. A real, refined web page with a navigation bar, readable text and rounded pill buttons. It is not a poster and not an advertisement photo.

CONCEPT
A premium travel website that matches foreign visitors to one of twelve Seoul districts through a short, elegant personality test, presented like a fine fragrance finder. Quiet luxury: Joseon white porcelain, cobalt underglaze painting and the light of contemporary Seoul. Bright and airy.

LAYOUT
1) Navigation bar, 72px tall, on the porcelain white background: wordmark "Seoul, Curated" at the left in an elegant contemporary sans-serif with wide letter spacing; links "The test", "12 Districts", "Meet travelers", "About" and a small pill toggle "EN | KO" at the right.
2) Left 55% of the hero: at the top, the headline "Find your Seoul." in a large, elegant, light-weight contemporary sans-serif, ink #1E2126, about 72px, with one line of body text under it, about 19px, ink at 65%: "Twelve quiet questions. One district that suits you, and a day to spend there." Below, a large porcelain-white card with 28px rounded corners and a very soft shadow, showing the first question of the test:
   - a small progress indicator of twelve tiny dots with the first one filled cobalt, and the label "1 of 12",
   - the question "Your first morning in Seoul?" in the same elegant sans-serif, about 34px,
   - two large side-by-side option tiles with rounded corners, each with a sunlit photograph on top and a caption below: "A quiet alley with an old tea house" (photo of a narrow hanok alley with a wooden tea house door in morning light) and "A riverside run at sunrise" (photo of the Han River path at sunrise with soft mist),
   - under the tiles, a pill button filled cobalt blue #22418F with white text "Take the test".
3) Right 45% of the hero: a tall photorealistic image of a white porcelain moon jar, softly lit from the left against a pale grey wall. On the jar, a delicate cobalt-blue underglaze painting in the Joseon cheonghwa style shows a flowing line drawing of the Seoul skyline: a mountain ridge, hanok roofs, a few modern towers and the curve of the Han River.

STYLE RULES
Palette: porcelain white #F6F6F3, porcelain shadow grey #E4E6E2, ink #1E2126, one accent of cobalt blue #22418F for the progress dot, the button and the painting on the jar. Fully rounded pill buttons, cards and tiles with large rounded corners, no sharp corners, no heavy lines. Calm, generous spacing, the feel of a fine fragrance brand or a design hotel.

DO NOT INCLUDE
Black or dark backgrounds, gold or brass, beige or cream, red, dancheong patterns, taegeuk symbols, cartoon illustrations, sharp square buttons, heavy borders, gradients, glassmorphism, emoji, Korean characters, people's faces, a scroll arrow.
```

---

## 2단계: 스크롤 영상용 키프레임 3장 (시안 B 승인 후, 2026-11-09)

흐름: GPT로 키프레임 3장(낮 마스터 → 같은 구도의 밤 → 남산타워 확대)을 만들고, Higgsfield에서 첫 장면과 끝 장면을 지정하는 영상 2개(낮→밤, 밤→남산 확대)를 만든다. 사이트에서는 스크롤을 내리면 영상이 앞으로, 올리면 뒤로 재생된다.

### F-1 낮 마스터 (`frame-1-day.png`)

ChatGPT에 승인 시안 `comp-b.png`를 첨부한 뒤 새 이미지로 생성한다.

```
Use the attached website screenshot only as the composition reference. Recreate the photograph behind the interface as a clean, full-frame cinematic photo, 16:9 landscape, the highest resolution available. Remove every interface element: no navigation bar, no text, no white panel, no buttons, no chips. Where the panel and the chip strip were, continue the scene naturally.

Keep the composition exactly the same as the reference:
- On the right third, in sharp focus, the graceful upturned eave of a traditional hanok roof seen from below and to the side: dark grey clay roof tiles with round end tiles, wooden rafters and brackets in warm natural wood, the roof line sweeping up toward the upper right.
- In the center, slightly right of the middle, Namsan mountain with N Seoul Tower standing on top, small and clear against the sky. Keep the tower in the same position as in the reference.
- Below and around it, a softly focused view of Seoul: low neighborhoods and hanok roofs in the foreground, mid-rise and modern glass towers in the middle distance, green trees between them.
- Sky: clear late-afternoon golden hour, pale blue above fading to soft peach near the horizon, a few small light clouds on the left.

Photographic style: shot on a full-frame camera with a 35mm lens, natural light, warm sun from the left, gentle haze over the city, shallow depth of field on the roof eave, realistic colors, bright and clean, high dynamic range, no lens flare, no vignette.

No text, no logos, no people, no birds, no interface, no frame or border.
```

### F-2 같은 장면의 밤 (`frame-2-night.png`)

ChatGPT에 **F-1(낮 마스터, `assets/incoming/frames/frame-1-day.png`)을 첨부하고 "이 이미지를 편집"하는 방식**으로 만든다. 새로 생성하면 구도가 어긋난다. 2026-11-09 사용자 요청으로 건물 조명을 주인공으로 다시 썼다.

```
Edit the attached photo. Keep the image identical in every way: same camera position, same lens, same framing, the hanok roof eave in exactly the same place and shape, N Seoul Tower and Namsan in exactly the same position, every building in exactly the same place and size. Do not move, add or remove any object.

Change the time to blue hour about 20 minutes after sunset, and make the city lights the main subject of the image. The lights must be the brightest, most eye-catching elements in the frame.

CITY LIGHTS, ZONE BY ZONE
- Hanok houses in the foreground and lower half: every house glows from inside. Warm amber light shines through the paper-covered lattice windows and doors, so the window grids are clearly visible as glowing patterns. Small warm lanterns hang under some eaves. Gentle pools of warm light fall on the courtyards and alleys between the roofs.
- Mid-rise apartment and office buildings in the middle distance: most windows are lit, about three out of four, arranged in clear regular grids floor by floor. Mix warm yellow and soft white window light, with a few dark windows scattered for realism. Every building facade reads as a lit grid, not a dark silhouette.
- Taller glass towers further back: lit floor by floor as bright horizontal bands, a few with softly glowing rooftop signs without readable text, and small blinking red aviation lights on the highest rooftops.
- Streets between the buildings: thin glowing lines of orange and white streetlights tracing the roads, with a few soft streaks of car headlights and taillights.
- N Seoul Tower: fully illuminated, its shaft and observation deck glowing white with soft blue accents, clearly the brightest point on Namsan. The path lights up the mountain slope to the tower are visible as a delicate line of small lights.

SKY AND ATMOSPHERE
- Sky: deep luminous cobalt blue at the top, fading to soft violet and a last thin band of warm orange glow at the horizon on the left. Not pitch black, so the building shapes stay readable.
- A faint warm haze of city light rising above the skyline. Each light source has a very soft natural glow, no harsh starburst flares.

FOREGROUND ROOF
- The hanok roof eave on the right is softly lit from below by a warm lantern glow: the wooden rafters and brackets glow honey-colored, and the grey roof tiles catch a cool blue reflection from the sky.

STYLE
Photographic and realistic, like a long-exposure night photo on a tripod: clean, crisp, rich but natural colors, gentle contrast, low noise. No text, no readable signs, no people, no fireworks, no moon, no interface.
```

불빛이 약하면 같은 대화에서 결과를 그대로 두고 한 번 더 편집한다:

```
Keep everything exactly the same, but turn on more lights: light up at least three quarters of all windows in every building, make the hanok paper windows glow brighter amber, and make the streetlights and N Seoul Tower brighter. Do not change the composition.
```

구도가 어긋났으면 낮 마스터를 다시 첨부해 처음부터 편집한다.

### F-3 남산타워 밤 확대 (`frame-3-tower.png`)

ChatGPT에 **F-2를 첨부해서** 만든다. 타워 아래 산 중턱과 기단 건물의 불빛도 F-2처럼 켜져 있어야 영상이 자연스럽다.

```
Use the attached night photo as the reference for lighting, color and viewing angle. Create the view you would see if the camera moved straight forward toward N Seoul Tower, about four times closer, keeping the same direction, the same slightly upward viewing angle and the same blue-hour lighting. 16:9 landscape, the highest resolution available.

Composition:
- N Seoul Tower centered horizontally at the same left-right position it had in the reference, standing on the dark green ridge of Namsan, occupying about 60% of the image height, its lights glowing white and soft blue.
- The lit trees and the base buildings of the tower on the mountain top visible below it.
- The same deep cobalt-to-violet blue-hour sky behind, with the last warm glow near the bottom edge.
- The hanok roof is no longer in the frame.

Photographic, realistic, sharp focus on the tower, calm and clean, no lens flare. No text, no people, no fireworks, no moon, no interface.
```

### 영상으로 만들기 (Claude가 Higgsfield에서 진행, 사용자 확인 후)

- 영상 1: 첫 장면 F-1 → 끝 장면 F-2, 카메라가 아주 천천히 아래로 내려가며 해가 지고 불이 켜짐
- 영상 2: 첫 장면 F-2 → 끝 장면 F-3, 남산타워를 향해 빠르게 다가감
- 생성 전에 크레딧 견적을 보여주고 승인받는다(2026-11-03 기준 Kling 3.0 5초 1개 약 8.75 크레딧)
- 사이트에서는 스크롤로 앞뒤를 매끄럽게 움직이기 위해 영상을 프레임 이미지 묶음으로 바꿔 캔버스에 그린다. 모바일은 가볍게 줄인 버전을 쓴다

## 3단계: 장소 사진 (공개 사진, GPT 아님)

- 출처: 한국관광공사 포토코리아(photo.visitkorea.or.kr) 등 **공공누리 1유형** 사진
- 이 방향은 사진이 생기를 맡으므로 중요하다. 밝은 시간대(아침, 해 질 녘)의 사진을 우선한다
- 장당 가로 1600px 이상, 사람 얼굴이 크게 나오지 않은 사진
- 올릴 위치: `assets/incoming/places/`, 같은 폴더에 `credits.csv`(`slug,제목,촬영자,출처URL,공공누리유형`)
- 목록은 데이터 조사 단계에서 확정해 드린다(예상 36~48장)
