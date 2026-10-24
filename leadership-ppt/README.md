# 리더십 팀프로젝트 계획 발표 (현대카드 정태영 부회장)

- **`leadership-plan-final.pptx` / `.pdf`: 최종본** (19장, v2 디자인 · Canva/미리캔버스 호환: 차트·화살표·대각선을 기본 도형으로, 색은 고정값, 플레이스홀더 없음)
- `leadership-plan.pptx`: 발표 파일 (16장, 발표자 노트 포함)
- `leadership-plan.pdf`: 백업용 PDF (폰트가 깨지면 이걸로 발표)
- `leadership-plan-v2.pptx` / `.pdf`: 디자인 강화 버전 (19장, 섹션 구분 장 · 색 블록 · 리더 행동 도식 추가)
- `fonts/`: Pretendard Regular · Bold (SIL OFL, 무료)

## 강의실 PC에서 폰트가 그대로 보이게 하는 법

1. 내 PC에 `fonts/` 안의 두 TTF 파일을 설치 (더블클릭 → 설치)
2. PowerPoint에서 `leadership-plan-final.pptx` 열기
3. Windows: 파일 → 옵션 → 저장 → **파일의 글꼴 포함** 체크 → "모든 문자 포함" 선택
   Mac: PowerPoint → 환경설정 → 저장 → **파일에 글꼴 포함** 체크
4. 다시 저장 후 USB에 PPTX와 PDF 둘 다 담아 가기

## 수정할 곳

- 조원 이름: 최종본 1번(표지), 19번(마무리) 슬라이드의 `조원1~4`, `○조`
- 재무 막대 높이 (최종본 10번): 막대는 일반 사각형이라 높이를 직접 늘리거나 줄이면 됨

## 다시 만들기

```sh
npm install
./build.sh      # deck.js → leadership-plan.pptx
./build-v2.sh   # deck-v2.js → leadership-plan-v2.pptx
./build-final.sh  # deck-final.js → leadership-plan-final.pptx
```
