# 리더십 팀프로젝트 계획 발표 (현대카드 정태영 부회장)

- `leadership-plan.pptx`: 발표 파일 (16장, 발표자 노트 포함)
- `leadership-plan.pdf`: 백업용 PDF (폰트가 깨지면 이걸로 발표)
- `fonts/`: Pretendard Regular · Bold (SIL OFL, 무료)

## 강의실 PC에서 폰트가 그대로 보이게 하는 법

1. 내 PC에 `fonts/` 안의 두 TTF 파일을 설치 (더블클릭 → 설치)
2. PowerPoint에서 `leadership-plan.pptx` 열기
3. Windows: 파일 → 옵션 → 저장 → **파일의 글꼴 포함** 체크 → "모든 문자 포함" 선택
   Mac: PowerPoint → 환경설정 → 저장 → **파일에 글꼴 포함** 체크
4. 다시 저장 후 USB에 PPTX와 PDF 둘 다 담아 가기

## 수정할 곳

- 조원 이름: 1번(표지), 16번(마무리) 슬라이드의 `조원1~4`, `○조`

## 다시 만들기

```sh
npm install
./build.sh   # deck.js → leadership-plan.pptx, review/ 에 PDF·PNG 렌더
```
