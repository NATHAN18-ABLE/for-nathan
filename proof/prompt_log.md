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
