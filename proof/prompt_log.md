# 넾다세일 AI 광고제 — AI 제작 과정 기록 (prompt log)

작성 규칙: 모든 생성 작업마다 날짜·시간(KST), 툴/모델, 전체 프롬프트, 파라미터, job id, 결과 파일명, 채택 여부를 기록한다.
사용 툴 상업 이용 근거: Higgsfield Terms of Use §4.4 — 출력물 소유권은 사용자, 상업 이용 제한 없음. 유료(Plus) 요금제라 워터마크 없음.

## 2026-10-10 (토)

### 환경 점검
- Higgsfield MCP 연결 확인: Plus 요금제, 잔여 827.03 크레딧
- 로컬: Python 3.13 / ffmpeg 6.1.1 / Node 22 / Playwright 1.56 (Chromium) / ImageMagick 6.9 / poppler(pdftocairo) / psd-tools 1.24
- 폰트: Pretendard 1.3.9 (SIL OFL 1.1) 설치

### 비용 사전 확인 (get_cost, 크레딧 차감 없음)
| 모델 | 설정 | 크레딧 |
|---|---|---|
| seedance_2_5 | t2v 5초 480p draft 9:16 무음 | 15 |
| seedance_2_5 | t2v 5초 1080p 9:16 무음 | 60 |
| seedance_2_0 | std 5초 1080p 9:16 무음 | 45 |
| seedance_2_0_mini | 5초 720p 9:16 무음 | 5 |
| gpt_image_2_5 | 9:16 이미지 1장 | 0.25 |

### 모션그래픽 파이프라인 테스트
- motion/render.mjs (Playwright 프레임 캡처 → ffmpeg libx264 crf16 yuv420p faststart)
- motion/smoke_test.html → out/smoke_test.mp4 (1080×1920, 30fps, 1.5초) — 기술 테스트용, 채택 안 함
- 콘택트 시트: proof/contact_sheets/smoke_test.png

### KV 에셋 확보 (PSD 대체 경로)
- 사용자 제공: KV 가이드 평면 이미지 `assets/ref/kv_guide_2576.jpg` (2576×2125, 원본 PSD 3070×2532를 약 84%로 줄인 버전으로 추정)
- 로고 벡터화: `tools/trace_logo.py` (potracer). 8배 업샘플 → 블러로 JPEG 노이즈 제거 → 트레이싱
  - 결과 `assets/kv/logo_traced.svg`: 곡선 14개(글자 조각 12개 + 내부 구멍), 원본 대비 픽셀 일치율(IoU) **99.87%**
  - 손으로 다시 그린 것이 아니라 공식 아트워크를 그대로 트레이싱함. 원본 PSD를 받으면 원본 벡터로 교체 예정
- 배너 크롭: `assets/kv/kv_banner_from_jpg.png`

### 3D 렌더 가능성 테스트
- three.js 0.170 + 헤드리스 Chromium(SwiftShader WebGL) → `out/three_test.mp4`, 1080×1920, 그림자 포함, 프레임당 약 1.07초

### IMG-01 상품 컷아웃 룩 테스트 (운동화)
- 시간: 2026-10-10 15:27 KST / 모델: Higgsfield `gpt_image_2_5` / 비율 1:1 / 1장 / 비용 0.25크레딧
- job id: `0133456a-b761-4735-af99-3c9562aabd33`
- 프롬프트:
  > Commercial e-commerce hero product photograph of a single generic white leather low-top sneaker, completely unbranded: no logos, no text, no letters, no stripes, no brand marks anywhere. Dynamic three-quarter angle, toe pointing slightly toward camera as if tossed into the air, laces neatly tied. Isolated on a pure flat #FFFFFF seamless background with no shadow and no floor. Soft large diffused key light from top-left, gentle fill, crisp clean silhouette edges for cutout. Real material detail: fine leather grain, visible stitching, slightly textured rubber sole, tiny natural creases near the toe box. 85mm lens, f/8, sharp focus throughout, neutral color grading, photorealistic, not CGI, not illustration.
- 결과: 1024×1024 PNG (Higgsfield 샌드박스 경유로 수신, 미리보기 `assets/gen/img01_sneaker_v1_preview.jpg`)
- 채택: 보류 (사용자 검토 대기)
- 참고: 이 작업 환경의 네트워크 정책이 결과물 CDN(d8j0ntlcm91z4.cloudfront.net)을 막고 있어, Higgsfield 샌드박스 → 이미지 반환 경로로 파일을 받음

### 애니매틱 v2 (코드)
- `motion/comp.html` (Canvas 2D, `render(f)`는 프레임 번호만으로 화면이 정해지는 순수 함수) → `out/animatic_v2.mp4`, 1080×1920, 30fps, 21초, 렌더 306초
- 로고 조각 분리: `tools/split_logo.py` → `motion/logo_pieces.json` (12조각)
- 콘택트 시트: `proof/contact_sheets/animatic_v2_sheet.png`

### KV 섬광 벡터화
- `tools/trace_kv.py`: 공식 KV 배너에서 색(그린·퍼플·블랙)별 연결 영역을 추출해 조각마다 트레이싱 → `motion/kv_pieces.json` (11조각), 확인용 `assets/kv/kv_traced.svg`
- 로고·카피·날짜 영역은 섬광이 아니므로 제외. 손으로 그린 도형은 없음

### IMG-02 상자 히어로 (C1 낙하 컷)
- 2026-10-10 15:59 KST / `gpt_image_2_5` quality=high, resolution=2k, 9:16 / 2.75크레딧 / job `7f6f191c-60da-4bbd-89d0-77fc1be20288`
- 프롬프트: Minimal premium product photograph, vertical 9:16 frame. A single small closed corrugated cardboard shipping box sits alone in the exact horizontal center of an infinite pure white seamless studio cyclorama, slightly below the vertical center, occupying only about 30% of the frame width, with generous clean negative space above and below. The box is sealed with one strip of vivid neon green packing tape (#00F550) running across the middle of the lid and folding down the front face; the tape is plain glossy plastic with no print, no text, no logos. Natural matte kraft cardboard with visible fibres, subtly soft worn edges, faint corrugation visible at the cut edges, one tiny dent on a corner - real, not perfect. Camera: slight high angle, three-quarter view, 85mm lens, f/8, everything sharp. Lighting: one very large soft overhead light with gentle wraparound fill, a soft natural contact shadow directly under the box, floor fading seamlessly into the white background. Clean neutral whites, no color cast. Absolutely no text, no labels, no barcodes, no shipping stickers, no logos anywhere. Photorealistic Apple-style commercial product photography, crisp, high detail, not CGI, not illustration.
- 결과: 1520×2688 → `assets/gen/img02_box_hero_v1_1080.jpg` / **채택**

### IMG-03 긴장감 클로즈업 (C3 컷)
- 2026-10-10 16:00 KST / `gpt_image_2_5` high 2k 9:16, 참조 이미지 IMG-02 / 2.75크레딧 / job `ea41ad43-02f4-4d7d-9a02-eafbe52be63a`
- 프롬프트: Use the referenced box exactly: same natural kraft corrugated cardboard, same plain neon green (#00F550) tape with no print. Vertical 9:16 macro close-up, centered composition: the camera is very close to the top edge of the box where the green tape crosses the lid seam. The box is under enormous pressure from inside: the lid flaps bulge upward in a gentle dome, the cardboard edges strain and slightly crease, the green tape is stretched taut and wrinkled with a small split beginning at one edge. Through the thin gap along the lid seam, a razor-thin line of vivid neon green light glows outward, softly lighting the cardboard fibres near the seam. Pure white studio background, soft and out of focus. 100mm macro lens, f/5.6, shallow depth of field, focus on the seam and tape. Soft large overhead light, natural, slightly imperfect. Absolutely no text, no labels, no logos, no barcodes. Photorealistic commercial product photography, not CGI, not illustration.
- 결과: `assets/gen/img03_box_strain_v1_1080.jpg` / **채택**

### IMG-04 거대한 상자 (C5 컷)
- 2026-10-10 16:00 KST / `gpt_image_2_5` high 2k 9:16, 참조 이미지 IMG-02 / 2.75크레딧 / job `50431ddb-222b-4ef6-93cc-b68a7d9dcdd1`
- 프롬프트: Use the referenced box design exactly: natural kraft corrugated cardboard, plain neon green (#00F550) tape with no print running over the lid and down the front. Vertical 9:16, centered composition. The box is now ENORMOUS - as tall as a three-story building - standing alone in an infinite pure white seamless studio. Shot from a low camera near the floor looking up, 24mm wide lens, strong upward perspective, the top of the giant box is cropped off by the top edge of the frame so it feels endless. For scale, the original small box (identical design, tiny) sits on the floor in front of the giant box at the bottom center of the frame. Soft overhead studio light, gentle soft shadows, giant cardboard texture visible in huge detail: fibres, corrugation, slight dents and creases. Clean neutral whites. Absolutely no people, no text, no labels, no logos, no barcodes. Photorealistic commercial photography, surreal scale, not CGI, not illustration.
- 결과: `assets/gen/img04_box_giant_v1_1080.jpg` / **채택**

### v3 드래프트 (사용자 피드백 반영 전면 재구성)
- `motion/v3.html` → `out/v3_draft.mp4` (1080×1920, 30fps, 20.2초)
- 콘택트 시트: `proof/contact_sheets/v3_style_sheet.png`, `proof/contact_sheets/v3_draft_sheet.png`

### IMG-05 상자가 화면을 꽉 채운 끝 프레임 (AI 영상 V2의 end_image, V3의 start_image)
- 2026-10-10 16:22 KST / `gpt_image_2_5` high 2k 9:16, 참조 이미지 IMG-02 / 2.75크레딧 / job `bd3cb0d8-8d82-4284-b814-2472e410aea3`
- 프롬프트: Same studio, same camera position and same lighting as the reference photo, but the very same box has grown ENORMOUS: it is now so large that its front face fills almost the entire vertical 9:16 frame edge to edge. The plain neon green (#00F550) tape runs vertically down the exact center of the frame. The bottom edge of the giant box rests on the white studio floor just above the bottom of the frame, with a thin strip of white floor and a soft contact shadow visible below it; the top of the box is cropped off by the top of the frame. The cardboard is under pressure: faint bulging, subtle stress creases radiating from the center, tape stretched taut and slightly wrinkled. Huge-scale kraft texture detail: fibres, corrugation flutes visible at the left and right vertical edges. Pure white seamless background visible only as narrow slivers at the far left and right edges. No small box, no people, no text, no labels, no logos, no barcodes. Photorealistic commercial product photography, not CGI.
- 결과: `assets/gen/img05_box_giantface_v1_1080.jpg` / **채택**
- IMG-04(작은 상자가 함께 있는 거대 상자)는 맥락이 없다는 피드백에 따라 **불채택**

### v4 드래프트
- KV 스타일 섬광 `motion/kvburst.js`: 화면 안에서 온전한 형태로 보이는 날, 카피 영역을 자동으로 피함
- `motion/v4.html` → `out/v4_draft.mp4` (23.0초). 성장·폭발 컷은 AI 영상이 들어갈 자리를 임시 이미지로 채움
