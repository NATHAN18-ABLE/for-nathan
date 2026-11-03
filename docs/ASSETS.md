# 직접 준비할 이미지 목록

원칙: Higgsfield 크레딧은 쓰지 않는다. 코드로 그릴 수 있는 것은 전부 코드로 만들고, 아래 목록만 사용자가 직접 준비한다.

## 코드로 만드는 것 (준비 불필요)

| 항목 | 방법 |
|---|---|
| 한양 목판 지도 | 실제 좌표(내사산, 성곽, 청계천, 도로)로 SVG를 그리고, 판목 질감은 시안에서 잘라낸 질감 조각을 반복 타일로 사용 |
| 범례 기호(취향 칩), 코스 경로·눈금 | SVG 아이콘 크기 기호 + Phosphor 아이콘 |
| "Pull the print" 전환 | GSAP 마스크 애니메이션 + 한지 들림 3D 변형 |
| 히어로의 은은한 움직임 | 셰이더(먹 광택, 미세한 카메라 이동) |
| 메타버스 3곳의 건물·소품·아바타 | React Three Fiber 절차적 저폴리곤 모델 |
| 메타버스 대기실 소개 | 실제 3D 장면을 카메라가 천천히 도는 실시간 렌더(영상 파일 없음) |
| 발표용 소개 영상(선택) | HyperFrames 코드 영상 |

## 1단계: 지금 준비할 것, 첫 화면 시안 3장 (GPT 이미지)

- 비율: **16:9 가로** (데스크톱 첫 화면)
- 세 프롬프트는 같은 세계관에서 **구도만 다르게** 만든 것이다. 결과가 포스터나 그림처럼 나오면 "website screenshot, flat UI"를 강조해 다시 생성한다
- 파일 이름: `comp-a.png`, `comp-b.png`, `comp-c.png`
- 올릴 위치: GitHub 저장소 `NATHAN18-ABLE/for-nathan`의 브랜치 `claude/seoul-tour-plan`, 폴더 `assets/incoming/` (웹에서 Add file → Upload files)

### 시안 A: 왼쪽 문구 + 전면 지도 + 하단 범례 띠

```
A desktop website homepage screenshot, 16:9, flat UI design, not a poster, not a painting.
Layout from top to bottom:
1) A slim single-line navigation bar, 64px tall, on dark ink background: small wordmark "Seoul, Printed" at left; links at right "Plan my trip", "Places", "Step inside", "About", and a small "EN / KO" toggle.
2) Hero filling the rest of the screen: a full-bleed carved woodblock map of Joseon-era Hanyang (old Seoul) seen from directly above: the four inner mountains as carved ridges, the fortress wall ring, Cheonggyecheon stream crossing east to west, roads as fine carved lines. The block surface is dark ink-soaked pearwood with visible carving grooves and wood grain; carved lines catch light in cool white.
3) In the left third, over a calm area of the map, large display headline "Seoul, printed for you." in a high-contrast serif with chiselled, carved-looking terminals, cool white. Under it one line of smaller sans-serif text: "Pick what you love. We carve a Seoul map and day routes that fit you."
4) Along the bottom edge, a horizontal legend strip styled like an old map legend table printed on cool white hanji paper with thin carved rules: six legend entries, each a small woodblock-style symbol with a label: "Palaces", "Markets & Food", "K-Culture", "Mountains & Rivers", "Night Seoul", "Art & Craft". Two entries look selected, filled with deep natural indigo. At the right end of the strip, one solid indigo button "Print my Seoul".
Palette: ink near-black with a blue-grey cast, cool white hanji (not cream, not beige), one accent of deep natural indigo. Sharp rectangular corners everywhere, no rounded cards.
Avoid: red seal stamps, cream or beige paper, dancheong patterns, hanok roof clip art, photographs, gradients, glassmorphism.
```

### 시안 B: 접이식 지도첩 패널 + 오른쪽 세로 범례표

```
A desktop website homepage screenshot, 16:9, flat UI design, not a poster, not a painting.
Layout:
1) A slim single-line navigation bar, 64px tall, cool white hanji background with a thin ink rule below: wordmark "Seoul, Printed" at left; links "Plan my trip", "Places", "Step inside", "About", "EN / KO" at right.
2) Main area: an accordion-folded woodblock atlas laid flat across the screen as five tall vertical panels with visible fold lines between them, like Daedongyeojido folding map books. Each panel shows one section of a carved woodblock map of old Seoul printed in black-blue ink on cool white hanji: mountains as stacked carved ridges, the fortress wall, the stream, roads with small tick marks along them.
3) Over the first two panels at the top left, large display headline "Seoul, printed for you." in a high-contrast serif with carved terminals, ink color. Under it one sans-serif line: "Pick what you love. We carve a Seoul map and day routes that fit you."
4) On the right edge, a tall vertical legend table framed with thin double carved rules, titled "Legend": six rows, each a small woodblock symbol and a label: "Palaces", "Markets & Food", "K-Culture", "Mountains & Rivers", "Night Seoul", "Art & Craft". Two rows are selected and marked in deep natural indigo. At the bottom of the table, one solid indigo button "Print my Seoul".
Palette: cool white hanji (not cream, not beige), black-blue ink, one accent of deep natural indigo. Sharp rectangular corners, no rounded cards.
Avoid: red seal stamps, cream or beige paper, dancheong patterns, hanok roof clip art, photographs, gradients, glassmorphism.
```

### 시안 C: 판목 확대 + 반쯤 들린 한지 인쇄본

```
A desktop website homepage screenshot, 16:9, flat UI design, not a poster, not a painting.
Layout:
1) A slim single-line navigation bar, 64px tall, transparent over the hero: wordmark "Seoul, Printed" at left; links "Plan my trip", "Places", "Step inside", "About", "EN / KO" at right, in cool white.
2) Left 55% of the screen: an extreme close-up of a carved woodblock printing block, dark ink-soaked wood, showing part of the Seoul fortress wall line and one carved mountain ridge in deep relief with wood grain. Large display headline "Seoul, printed for you." sits on this dark block in a high-contrast serif with carved terminals, cool white, with one sans-serif line under it: "Pick what you love. We carve a Seoul map and day routes that fit you."
3) Right 45%: a sheet of cool white hanji paper half lifted off the block, its corner curling toward the viewer, revealing a printed map of central Seoul on its underside with only a few places marked by small indigo woodblock symbols connected by a route line with tick marks.
4) Along the lower edge of the lifted sheet, a row of six legend chips with small woodblock symbols: "Palaces", "Markets & Food", "K-Culture", "Mountains & Rivers", "Night Seoul", "Art & Craft"; two chips are filled indigo. Below the chips, one solid indigo button "Print my Seoul".
Palette: ink-soaked dark wood, cool white hanji (not cream, not beige), one accent of deep natural indigo. Sharp rectangular corners.
Avoid: red seal stamps, cream or beige paper, dancheong patterns, hanok roof clip art, photographs, gradients, glassmorphism.
```

## 2단계: 시안 승인 후 (필요할 때만)

시안 속 그림 부분(판목, 들린 한지 같은 질감·입체 표현)은 사이트에 쓸 고해상도 이미지로 다시 그려야 할 수 있다. 승인된 시안을 보고 필요한 장수(예상 0~2장)와 프롬프트를 그때 따로 드린다. 시안을 잘라서 그대로 쓰지는 않는다.

## 3단계: 장소 사진 (공개 사진)

- 출처: 한국관광공사 포토코리아(photo.visitkorea.or.kr) 등 **공공누리 1유형**(출처 표시 시 자유 이용) 사진
- 장당 가로 1600px 이상, 사람 얼굴이 크게 나오지 않은 사진
- 파일 이름은 아래 `slug`를 그대로 쓴다(예: `gyeongbokgung.jpg`)
- 올릴 위치: `assets/incoming/places/`
- 같은 폴더에 `credits.csv`를 함께 올린다: `slug,제목,촬영자,출처URL,공공누리유형`

| 분류 | slug (장소) |
|---|---|
| 궁궐·유산 | `gyeongbokgung` 경복궁, `changdeokgung` 창덕궁·후원, `deoksugung` 덕수궁, `jongmyo` 종묘, `bukchon` 북촌한옥마을, `seochon` 서촌, `seoul-city-wall` 한양도성(낙산 구간), `jogyesa` 조계사, `bongeunsa` 봉은사 |
| 시장·음식 | `gwangjang-market` 광장시장, `namdaemun-market` 남대문시장, `mangwon-market` 망원시장, `tongin-market` 통인시장, `noryangjin` 노량진수산시장, `ikseon-dong` 익선동, `euljiro` 을지로 골목 |
| K컬처·쇼핑 | `myeongdong` 명동, `hongdae` 홍대, `seongsu` 성수동, `garosu-gil` 가로수길, `starfield-library` 별마당도서관, `insadong` 인사동, `ddp` 동대문디자인플라자 |
| 산과 물 | `namsan` 남산·N서울타워, `cheonggyecheon` 청계천, `yeouido-hangang` 여의도 한강공원, `seoul-forest` 서울숲, `bukhansan` 북한산, `naksan-park` 낙산공원, `haneul-park` 하늘공원, `seonyudo` 선유도공원 |
| 밤의 서울 | `banpo-fountain` 반포 달빛무지개분수, `seoul-sky` 롯데월드타워 서울스카이, `gwanghwamun-square` 광화문광장 |
| 전시·공방 | `national-museum` 국립중앙박물관, `mmca-seoul` 국립현대미술관 서울관, `leeum` 리움미술관, `craft-museum` 서울공예박물관, `war-memorial` 전쟁기념관, `ihwa-mural` 이화벽화마을 |

40곳이다. 운영 여부와 최신 정보는 2단계(데이터 정리)에서 확인하며 목록이 일부 바뀔 수 있다. 사진은 데이터 정리 단계 전까지만 준비하면 되며, 시안보다 급하지 않다.
