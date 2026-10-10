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
