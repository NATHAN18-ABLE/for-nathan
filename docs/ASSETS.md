# 직접 준비할 이미지 목록과 GPT 프롬프트 (민화 방향)

원칙: Higgsfield 크레딧은 쓰지 않는다. 코드로 그릴 수 있는 것은 전부 코드로 만들고, 아래 목록만 사용자가 직접 준비한다.

| 언제 | 이미지 | 장수 | 비고 |
|---|---|---|---|
| **지금** | 첫 화면 시안 A, B, C (민화) | 3 | 필수 |
| 시안을 고른 뒤 | 고른 시안의 그림 부분(플레이트) | 1~2 | 고른 시안에 따라 다름 |
| 시안을 고른 뒤 | 16개 유형 민화 캐릭터 | 16 | 스타일 기준 1장을 먼저 승인받고 나머지 15장 |
| 데이터 조사 뒤 | 장소 사진 | 36~48 | 공공누리 공개 사진 (GPT 아님) |

목판 지도첩 시안 3장은 2026-11-06에 탈락했다(어둡고 무거움, 생기 없음, 각진 버튼과 글자). 참고용으로 `.impeccable/mocks/decision/rejected-woodblock-*.png`에 보관한다.

## 코드로 만드는 것 (준비 불필요)

| 항목 | 방법 |
|---|---|
| 버튼, 카드, 구름 모양 말풍선, 글자 | 코드 |
| 유형 결과 카드 조립(캐릭터 + 이름 + 구) | Satori 이미지 생성 |
| 코스 경로, 지점 표시 | SVG + Phosphor 아이콘 |
| 캐릭터가 걸어 나오는 연출, 두루마리 펼침 | 코드 모션 |
| 메타버스 5개 구의 건물·소품·아바타(민화 동물 3D) | React Three Fiber 절차적 저폴리곤 모델 |

## GPT에서 만들 때 공통 요령

1. **비율**: 16:9 가로. 없으면 가로형(3:2)
2. **프롬프트는 통째로 붙여 넣는다.** 따옴표 속 영어 문구가 화면에 그대로 찍혀야 한다
3. **한글은 넣지 않았다.** GPT 이미지는 한글을 자주 깨뜨린다. 실제 글자는 코드로 넣는다
4. **다시 생성해야 하는 경우**
   - 액자 속 그림이나 포스터처럼 나왔다 → 맨 앞에 `IMPORTANT: this must look like a real website screenshot with a navigation bar and rounded buttons.`
   - 종이가 누렇거나 베이지색이다 → 맨 끝에 `The background must be bright clean white like #F6F5F1, not yellowed, not beige.`
   - 호랑이가 무섭거나 사실적이다 → 맨 끝에 `The tiger must be cute and funny like a Korean folk painting: big round eyes, wide grin, flat colors, no realism.`
   - 글자만 틀렸다 → 구도와 그림이 좋으면 그대로 써도 된다
5. **올릴 위치**: GitHub 저장소 `NATHAN18-ABLE/for-nathan` → 브랜치 `claude/seoul-tour-plan` → `assets/incoming/` (Add file → Upload files)

### 색 기준 (모든 프롬프트 공통)

| 이름 | 값 | 쓰임 |
|---|---|---|
| Hanji white | `#F6F5F1` | 바탕 |
| Ink | `#26262B` | 먹선, 글자 |
| Peony red | `#D9475C` | 주 버튼, 강조 |
| Pine green | `#2F7A62` | 소나무, 산 |
| Pollen yellow | `#EDB43F` | 포인트, 하이라이트 |
| Indigo | `#2C4F8F` | 물, 보조 버튼 |

---

## 1단계: 첫 화면 시안 3장 (지금)

### 시안 A: 골목 담장 너머로 웃는 호랑이와 까치

파일 이름: `comp-a.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, as seen in a browser. A real, friendly web page with a navigation bar, readable text and rounded pill buttons. It is not a poster and not a framed painting.

CONCEPT
A playful travel website that matches foreign visitors to one of twelve Seoul districts through a short personality test. The visual world is Korean folk painting (minhwa) from the Joseon era, redrawn bright, warm and cute: soft hand-drawn ink outlines, flat gouache-like color fills, gentle humor, lots of white space.

LAYOUT
1) Navigation bar, 72px tall, on the page background with no divider line. At the left, a wordmark "Which Seoul" in a soft, rounded, friendly display typeface. On the right, links in a clean rounded sans-serif: "Take the test", "12 Districts", "16 Types", "Meet travelers", and a small pill toggle "EN | KO".
2) Left 45% of the hero: the headline on two lines "Which Seoul" / "are you?" in a large, warm, rounded display typeface with slightly brush-like stroke endings, ink color #26262B, about 96px per line. Under it, one line of body text in a clean rounded sans-serif, about 22px, ink at 75% opacity: "Answer 12 playful questions. Meet your folk-painting travel animal and the Seoul district that fits you." Under that, a large pill-shaped button filled peony red #D9475C with white text "Take the test", and beside it a pill-shaped outline button in ink with the text "See the 16 types".
3) Right 55% of the hero: a big, cheerful minhwa-style tiger with big round eyes and a wide grin, peeking over a low stone wall of a Seoul alley with both front paws resting on top of the wall. Its stripes are bold flat shapes in pollen yellow #EDB43F and ink. Behind the wall: a twisted pine tree in pine green #2F7A62, a magpie perched on a branch looking down at the tiger (the classic minhwa tiger and magpie pairing), soft rounded minhwa clouds, and in the distance a few small Seoul rooftops drawn in the same folk style: one curved hanok roof and one modern apartment block side by side.
4) Along the bottom of the hero, a row of five round character badges, each a white circle with a thin ink outline containing a small cute minhwa animal, with a name in small text under each: "Scholar Rabbit", "Collector Magpie", "Market Tiger", "Wall-walking Turtle", "Rooftop Squirrel".

STYLE RULES
Background bright clean hanji white #F6F5F1 with very subtle paper fibers. Full minhwa palette used with restraint: peony red #D9475C, pine green #2F7A62, pollen yellow #EDB43F, indigo #2C4F8F, ink #26262B. All buttons are fully rounded pills, any card has 20px rounded corners. Illustrations have hand-drawn ink outlines and flat color fills, like a modern picture book inspired by minhwa. Warm, light and inviting.

DO NOT INCLUDE
A scary or realistic tiger, a tiger smoking a pipe, dancheong patterns, taegeuk symbols, red seal stamps, yellowed or beige aged paper, dark backgrounds, sharp square buttons, photographs, 3D rendering, gradients, glassmorphism, emoji, Korean characters, a scroll arrow.
```

### 시안 B: 12칸 책거리 책장에 담긴 12개 동네

파일 이름: `comp-b.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, as seen in a browser. A real, friendly web page with a navigation bar, readable text and rounded pill buttons. It is not a poster and not a framed painting.

CONCEPT
A playful travel website that matches foreign visitors to one of twelve Seoul districts through a short personality test. The visual world is Korean folk painting (minhwa), redrawn bright, warm and cute. The hero is a chaekgeori, the Joseon folk painting of a bookshelf full of treasures, reimagined so that each compartment holds a tiny Seoul neighborhood.

LAYOUT
1) Navigation bar, 72px tall, on the page background with no divider line. At the left, a wordmark "Which Seoul" in a soft, rounded, friendly display typeface. On the right, links in a clean rounded sans-serif: "Take the test", "12 Districts", "16 Types", "Meet travelers", and a small pill toggle "EN | KO".
2) Left 38% of the hero: the headline on two lines "Which Seoul" / "are you?" in a large, warm, rounded display typeface with slightly brush-like stroke endings, ink color #26262B, about 88px per line. Under it, one line of body text in a clean rounded sans-serif, about 22px: "Answer 12 playful questions. Meet your folk-painting travel animal and the Seoul district that fits you." Under that, a large pill button filled peony red #D9475C with white text "Take the test".
3) Right 62% of the hero: a chaekgeori bookshelf drawn in minhwa style with its typical playful reverse perspective, the shelf frame painted soft pine green #2F7A62 with pollen-yellow #EDB43F trim. Twelve compartments in four columns and three rows. Each compartment is a tiny cozy folk-painted scene of one Seoul neighborhood, with a small rounded label tag under it:
   "Jongno": a hanok alley with a craft workshop.
   "Jung": a night alley with paper lanterns and small printing shops.
   "Dongdaemun": an herbal medicine market with sacks of roots.
   "Seodaemun": a forest trail beside a small stream.
   "Nowon": a forest path along an old railway track.
   "Songpa": a grassy ancient earthen fortress mound in a park.
   "Yongsan": hillside stairs with colorful rooftops.
   "Mapo": a neighborhood market street leading to the Han River.
   "Seongdong": red-brick factories and a handmade shoe workshop.
   "Yeongdeungpo": small metal workshops with art murals.
   "Gwanak": a mountain path above a lively student street.
   "Gangnam": green royal tomb mounds among pine trees and a stream walk.
   A few cute minhwa animals play around the shelf: a rabbit reading a book on the top edge, a cat curled up asleep in one corner, a magpie hopping between two compartments.

STYLE RULES
Background bright clean hanji white #F6F5F1 with very subtle paper fibers. Full minhwa palette: peony red #D9475C, pine green #2F7A62, pollen yellow #EDB43F, indigo #2C4F8F, ink #26262B. All buttons are fully rounded pills, labels and cards have rounded corners. Hand-drawn ink outlines and flat color fills, like a modern picture book inspired by minhwa. Warm, light and inviting, every scene readable at a glance.

DO NOT INCLUDE
Dancheong patterns, taegeuk symbols, red seal stamps, yellowed or beige aged paper, dark backgrounds, sharp square buttons, photographs, 3D rendering, gradients, glassmorphism, emoji, Korean characters, a scroll arrow.
```

### 시안 C: 민화풍 서울 파노라마 + 첫 문항 카드

파일 이름: `comp-c.png`

```
A high-fidelity desktop website homepage screenshot, 16:9 landscape, 1920x1080, as seen in a browser. A real, friendly web page with a navigation bar, readable text and rounded pill buttons. It is not a poster and not a framed painting.

CONCEPT
A playful travel website that matches foreign visitors to one of twelve Seoul districts through a short personality test. The visual world is Korean folk painting (minhwa), redrawn bright, warm and cute. The hero is a cheerful folk-painting panorama of Seoul full of small animal characters, with the first test question already waiting.

LAYOUT
1) Navigation bar, 72px tall, on the page background with no divider line. At the left, a wordmark "Which Seoul" in a soft, rounded, friendly display typeface. On the right, links in a clean rounded sans-serif: "Take the test", "12 Districts", "16 Types", "Meet travelers", and a small pill toggle "EN | KO".
2) The hero fills the rest of the screen with a wide minhwa-style panorama of Seoul seen from a gentle bird's-eye angle:
   - Rounded blue-green mountains along the top in pine green #2F7A62 and indigo #2C4F8F with soft folk-painting clouds.
   - The Han River crossing the lower third from left to right, drawn with curly minhwa wave patterns in indigo and white.
   - Cozy neighborhood clusters on both banks: hanok roofs, small markets, red-brick factories, apartment blocks and parks, all in the same flat folk style.
   - Small cute minhwa animals doing things around the city: a turtle walking along a stone fortress wall on a hill, a squirrel hopping across rooftops, a tiger at a market stall happily eating a rice cake, an egret reading a book on the riverbank, a deer on a mountain trail, a carp leaping out of the river, a pair of mandarin ducks having a picnic on the grass.
3) Top-left of the hero, on a soft rounded minhwa cloud shape in white: the headline on two lines "Which Seoul" / "are you?" in a large, warm, rounded display typeface with slightly brush-like stroke endings, ink color #26262B, about 84px per line, and one line of body text under it in a clean rounded sans-serif, about 20px: "Answer 12 playful questions. Meet your folk-painting travel animal and the Seoul district that fits you."
4) Bottom-right of the hero, a floating white card with 24px rounded corners and a soft shadow: a small label "Question 1 of 12", the question "Your first morning in Seoul?" in a rounded display typeface, two pill-shaped option buttons stacked vertically with ink outlines: "A quiet alley with an old tea house" and "A riverside run at sunrise", and under them a full-width pill button filled peony red #D9475C with white text "Take the test".

STYLE RULES
Background bright clean hanji white #F6F5F1 with very subtle paper fibers. Full minhwa palette: peony red #D9475C, pine green #2F7A62, pollen yellow #EDB43F, indigo #2C4F8F, ink #26262B. All buttons are fully rounded pills. Hand-drawn ink outlines and flat color fills, like a modern picture book inspired by minhwa. Warm, light and lively but not cluttered; leave calm space behind the headline and the card.

DO NOT INCLUDE
A scary or realistic tiger, dancheong patterns, taegeuk symbols, red seal stamps, yellowed or beige aged paper, dark backgrounds, sharp square buttons, photographs, 3D rendering, gradients, glassmorphism, emoji, Korean characters, a scroll arrow.
```

---

## 2단계: 시안을 고른 뒤

- **플레이트**: 고른 시안의 그림 부분만 글자와 버튼 없이 다시 그린 고해상도 이미지. 고른 시안을 ChatGPT에 첨부해서 만든다. 프롬프트는 시안을 측정한 뒤 드린다
- **16개 민화 캐릭터**: 고른 시안의 그림체를 기준으로, 먼저 1장(시장 호랑이)을 만들어 승인받은 뒤 그 이미지를 첨부해 나머지 15장을 같은 그림체로 만든다. 투명 배경, 정사각형. 프롬프트는 시안 승인 뒤 드린다

## 3단계: 장소 사진 (공개 사진, GPT 아님)

- 출처: 한국관광공사 포토코리아(photo.visitkorea.or.kr) 등 **공공누리 1유형** 사진
- 장당 가로 1600px 이상, 사람 얼굴이 크게 나오지 않은 사진
- 올릴 위치: `assets/incoming/places/`, 같은 폴더에 `credits.csv`(`slug,제목,촬영자,출처URL,공공누리유형`)
- 목록은 데이터 조사 단계에서 확정해 드린다(예상 36~48장)
