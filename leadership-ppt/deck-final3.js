// 리더십 팀프로젝트 계획 발표 최종본: Canva · 미리캔버스 호환용
// 차트 · 대각선 · 화살표를 기본 도형으로, 색은 hex로, 폰트는 텍스트마다 직접 지정한다
// usage: NODE_PATH=./node_modules node deck.js
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const OUT = "leadership-plan-final3.pptx";
const HEX = {
  ink: "141414", grey: "6E6E6E", mute: "A3A3A3", rule: "D9D9D9", tint: "F3F3F3",
  accent: "D8452B", darkRule: "3A3A3A", darkSub: "A8A8A8", seg3: "8C8C8C", seg4: "BDBDBD",
};
const THEME = {
  name: "Leadership Ink Vermilion",
  headFontFace: "Pretendard",
  bodyFontFace: "Pretendard",
  colors: {
    dk1: HEX.ink, lt1: "FFFFFF", dk2: HEX.grey, lt2: HEX.tint,
    accent1: HEX.accent, accent2: HEX.seg4, accent3: "4A4A4A", accent4: HEX.seg3, accent5: HEX.rule, accent6: "2E2E2E",
    hlink: HEX.accent, folHlink: HEX.grey,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "리더십 팀프로젝트 계획서: 현대카드 정태영 부회장";
pres.subject = "리더십 팀프로젝트 계획 발표";
pres.author = "○조";
// 테마 색 대신 실제 색상값 (다른 편집기에서도 같은 색으로 열리도록)
const C = { text1: HEX.ink, text2: HEX.grey, background1: "FFFFFF", background2: HEX.tint, accent1: HEX.accent };
const FONT = "Pretendard";

const SW = 13.333, SH = 7.5, M = 0.75, W = SW - M * 2;
const TOP = 1.95; // 본문 시작선

// ---------- helpers ----------
let oid = 0;
const T = (s, text, o) => s.addText(text, { margin: 0, isTextBox: true, color: C.text1, fontFace: FONT, objectName: `t${++oid}`, ...o });
const rect = (s, o) => s.addShape(pres.shapes.RECTANGLE, { line: { type: "none" }, objectName: `r${++oid}`, ...o });
const rrect = (s, o) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { line: { type: "none" }, objectName: `rr${++oid}`, ...o });
const hline = (s, x, y, w, color = HEX.rule, width = 0.75) => rect(s, { x, y: y - width / 144, w, h: width / 72, fill: { color } });
const vline = (s, x, y, h, color = HEX.rule, width = 0.75) => rect(s, { x: x - width / 144, y, w: width / 72, h, fill: { color } });
const dot = (s, x, y, d, color) => s.addShape(pres.shapes.OVAL, { x: x - d / 2, y: y - d / 2, w: d, h: d, fill: { color }, line: { type: "none" }, objectName: `d${++oid}` });

// 세로형 카드 모티프 (ID-1 카드 비율 1 : 1.586)
function card(s, x, y, w, { fill, chip, lines = [], lineSize = 11 }) {
  const h = w * 1.586;
  rrect(s, { x, y, w, h, rectRadius: Math.min(0.14, w * 0.05), fill: { color: fill } });
  rrect(s, { x: x + w * 0.11, y: y + w * 0.14, w: w * 0.17, h: w * 0.135, rectRadius: w * 0.02, fill: { color: chip } });
  if (lines.length) {
    T(s, lines, { x: x + w * 0.11, y: y + h - w * 0.42, w: w * 0.8, h: w * 0.3, fontSize: lineSize, color: C.background1, valign: "bottom" });
  }
  return h;
}

let page = 0;
function slide(dark) {
  const s = pres.addSlide();
  s.background = { color: dark ? HEX.ink : "FFFFFF" };
  page++;
  return s;
}
const darkLabel = (s, text) => T(s, text, { x: M, y: 0.7, w: 9, h: 0.3, fontSize: 12, bold: true, color: HEX.darkSub, valign: "middle" });

function content(label, title, source) {
  const s = slide(false);
  T(s, label, { x: M, y: 0.5, w: 9, h: 0.3, fontSize: 12, bold: true, color: C.text2, valign: "middle" });
  T(s, title, { x: M, y: 0.84, w: W, h: 0.75, fontSize: 28, bold: true, valign: "top" });
  if (source) T(s, source, { x: M, y: 6.93, w: 10.6, h: 0.28, fontSize: 10, color: C.text2, valign: "middle" });
  T(s, String(page), { x: SW - M - 0.6, y: 6.93, w: 0.6, h: 0.28, fontSize: 10, color: HEX.grey, align: "right", valign: "middle" });
  return s;
}

// ---------- v2 전용 ----------
// 시기 1→4를 밝은 회색에서 검정으로 진해지게: 타임라인 · 프레임워크 · 가설 도식에서 같이 쓴다
const PHASE = [
  { fill: "E4E4E4", fg: HEX.ink },
  { fill: "BDBDBD", fg: HEX.ink },
  { fill: "6E6E6E", fg: "FFFFFF" },
  { fill: HEX.ink, fg: "FFFFFF" },
];
const PANEL_DARK = "262626";

// 비스듬히 겹친 카드 묶음 (뒤에서 앞으로)
function cardStack(s, x, y, w, fills, chip) {
  const dx = w * 0.17, dy = w * 0.13, n = fills.length;
  fills.forEach((f, i) => {
    const k = n - 1 - i;
    const opts = { fill: f, chip: i === n - 1 ? chip : f };
    card(s, x - k * dx, y + k * dy, w, opts);
  });
}

function section(num, title, sub, note) {
  const s = slide(true);
  T(s, num, { x: M, y: 1.35, w: 4, h: 1.5, fontSize: 96, bold: true, color: C.accent1, valign: "bottom" });
  T(s, title, { x: M, y: 3.05, w: 8, h: 0.8, fontSize: 40, bold: true, color: C.background1, valign: "top" });
  if (sub) T(s, sub, { x: M, y: 3.95, w: 8, h: 0.4, fontSize: 18, color: HEX.darkSub });
  cardStack(s, SW - M - 1.9, 3.2, 1.9, ["2E2E2E", "4A4A4A", HEX.accent], C.text1);
  s.addNotes(note);
  return s;
}

// 두 점을 잇는 선 (위로 올라가면 flipV)
// 두 점을 잇는 선: 선 도형 뒤집기는 편집기마다 다르게 읽혀서, 회전한 얇은 사각형으로 그린다
function seg(s, x1, y1, x2, y2, color, width) {
  const len = Math.hypot(x2 - x1, y2 - y1), t = width / 72;
  const deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  rect(s, { x: (x1 + x2) / 2 - len / 2, y: (y1 + y2) / 2 - t / 2, w: len, h: t, rotate: deg, fill: { color } });
}

// 오른쪽 화살표: 막대 + 삼각형
function arrowRight(s, x, y, w, color) {
  const t = 1.25 / 72, hw = 0.14;
  rect(s, { x, y: y - t / 2, w: w - hw + 0.02, h: t, fill: { color } });
  s.addShape(pres.shapes.ISOSCELES_TRIANGLE, { x: x + w - hw - 0.02, y: y - hw / 2 + 0.01, w: hw, h: hw - 0.02, rotate: 90, fill: { color }, line: { type: "none" }, objectName: `ah${++oid}` });
}

const NOTES = [
"안녕하세요, ○조입니다. 저희 조는 현대카드 정태영 부회장을 분석 대상으로 정했습니다. 오늘은 보고서를 어떻게 쓸지, 그 계획을 말씀드리겠습니다.",
"순서는 과제에서 주신 항목 그대로입니다. 리더를 왜 골랐는지, 어떤 사람이고 어떤 회사를 이끄는지 먼저 말씀드리고, 마지막에 보고서를 어떤 틀로 쓸지 가장 자세히 설명드리겠습니다.",
"보고서 전체를 이 질문 하나로 끌고 가려고 합니다. 정 부회장이 상황에 맞춰 자기 행동을 바꿨다면 House의 경로-목표이론으로 설명이 되고, 반대로 제휴나 원칙 같은 걸로 상황 자체를 바꿨다면 Fiedler의 상황 모델로 설명이 됩니다. 두 이론 중 어느 쪽이 더 잘 맞는지 비교하는 게 보고서의 목표입니다.",
"먼저 정태영 부회장이 어떤 사람인지, 그리고 저희가 왜 이 사람을 골랐는지 말씀드리겠습니다.",
"정 부회장은 현대차그룹 계열사에서 기획과 해외 사업을 하다가, 카드대란이 한창이던 2003년에 적자 상태인 현대카드를 맡았습니다. 첫해에만 6천억 원대 적자가 났는데, 현대카드M을 내놓으면서 반전의 계기를 만들었습니다. 그 뒤로 프리미엄 카드와 문화 마케팅, 디지털 선언, 희망퇴직, 애플페이, AI 수출까지 이어집니다. 저희는 이 23년을 네 시기로 나누고, 그중 검은색으로 표시한 두 시기를 깊게 볼 계획입니다.",
"정 부회장을 고른 이유는 세 가지입니다. 가장 큰 이유는 성격이 전혀 다른 네 시기를 한 사람이 이끌었다는 점입니다. 리더가 같으니까 상황만 바뀌었을 때 리더십이 어떻게 달라지는지 비교하기 좋습니다. 또 본인이 SNS나 인터뷰로 직접 설명한 자료가 많고, 성과만큼 논란도 있어서 칭찬만 하는 보고서가 되지 않을 거라고 봤습니다.",
"다음은 정 부회장 개인과 현대카드라는 회사를 간단히 소개하겠습니다.",
"정 부회장은 1960년생이고, 서울대 불문과를 나와 MIT에서 MBA를 했습니다. 여기서 눈여겨볼 건 정몽구 명예회장의 사위라는 점입니다. 월급 받는 전문경영인이면서 동시에 오너 일가이기도 해서, 이 사람의 영향력이 어디서 나오는지는 6장 권력 부분에서 따로 보려고 합니다. 그리고 2003년부터 23년째 대표를 맡고 있습니다.",
"현대카드는 다이너스클럽코리아를 현대차그룹이 인수해서 2001년에 이름을 바꾼 회사입니다. 상장은 안 되어 있고, 올해 6월 기준 회원이 1,311만 명 정도 됩니다. 사업은 크게 네 가지인데, 자체 카드, 코스트코나 대한항공처럼 제휴사 이름을 단 PLCC, 카드대출, 그리고 최근에 키우고 있는 데이터와 AI 사업입니다.",
"작년 영업수익은 4조 78억 원이고, 순이익은 3,503억 원으로 1년 전보다 10.7% 늘었습니다. 카드 이용실적 점유율은 19.3%로, 신한카드 바로 다음인 업계 2위입니다. 2003년에 적자 회사였다는 걸 생각하면 꽤 큰 변화입니다.",
"주주를 보면 현대자동차가 1대 주주, 현대커머셜이 2대 주주입니다. 재미있는 건 정 부회장 본인은 현대카드 주식이 한 주도 없다는 점입니다. 대신 부부가 대주주인 현대커머셜이 현대카드 지분의 34.62%를 갖고 있어서, 간접적으로 영향력을 가집니다. 지분보다는 직위와 관계에서 나오는 힘이라서, 이 부분도 권력 이론으로 연결해 볼 생각입니다.",
"이제 보고서를 어떻게 쓸지 말씀드리겠습니다. 오늘 발표에서 가장 중요한 부분입니다.",
"자료는 네 군데서 모읍니다. 매출이나 지분 같은 숫자는 DART 공시를 기준으로 하고, 회사가 직접 낸 IR 자료와 뉴스룸으로 시기별 발표를 확인합니다. 리더가 왜 그런 결정을 했는지는 인터뷰와 본인 SNS에서 찾고, 논문은 앞선 연구가 현대카드를 어떤 틀로 분석했는지 참고하려고 합니다.",
"23년을 다 똑같은 깊이로 보면 얕아질 것 같아서, 두 시기만 골라 깊게 보기로 했습니다. 하나는 리더십이 가장 많이 발휘된 2003년부터의 위기와 회생기이고, 다른 하나는 지금도 이어지고 있는 2022년 이후의 디지털 전환기입니다. 가운데 두 시기는 흐름만 짚습니다. 두 시기 모두 상황, 리더가 한 일, 결과, 이론 연결 순서로 똑같이 정리해서 비교할 수 있게 하겠습니다.",
"첫 번째로 깊게 볼 시기는 2003년부터의 위기와 회생기입니다. 당시 현대카드는 카드대란 속에서 업계 꼴찌권이었고, 점유율은 1.8%, 정 부회장이 취임한 첫해에만 6,300억 원 적자가 났습니다. 정 부회장은 현대카드M 하나에 힘을 모았고, 2005년에는 GE와 손잡아 6,783억 원 투자를 받았고, the Black 같은 프리미엄 카드로 브랜드를 차별화했습니다. 그 결과 5년 만에 점유율이 약 7배가 됐고, 현대카드M 회원은 460만 명까지 늘었습니다. 이론으로 보면, 리더가 방향을 직접 정한 지시적 리더십이면서, 동시에 GE 제휴로 리더에게 유리한 상황을 만든 사례로 볼 수 있습니다.",
"두 번째는 2022년 이후의 디지털 전환기입니다. 고금리와 연체 증가로 업계 전체가 어려웠는데, 정 부회장은 2022년 하반기에 이미 '전시상황'이라고 판단하고 움직였습니다. 먼저 저신용 카드론을 줄여 위험을 낮췄고, 2023년 3월에는 애플페이를 국내 처음으로 들여와 출시 달에만 신규 회원 20만 명을 모았습니다. 2024년에는 직접 만든 AI 플랫폼 '유니버스'를 일본 3대 카드사에 수출했습니다. 그 결과 작년 순이익 3,503억 원으로 처음 업계 3위에 올랐습니다. 이번에는 '테크 기업'이라는 높은 목표를 던지는 성취지향적 리더십에 가깝고, 대출 구조를 바꿔 상황을 관리했다는 점에서 Fiedler 관점도 함께 볼 수 있습니다.",
"두 시기를 나란히 놓으면 이렇게 정리됩니다. 리더의 행동은 위기 때는 직접 방향을 정하는 지시적 리더십, 최근에는 높은 목표를 던지는 성취지향적 리더십으로 달라졌습니다. 이건 상황에 맞춰 스스로 바뀐 리더라는 근거입니다. 그런데 두 시기 모두 GE 제휴나 대출 구조 재편처럼 상황 자체도 바꿨습니다. 이건 판을 바꾼 리더라는 근거입니다. 그래서 보고서에서는 둘 중 어느 쪽이 더 컸는지를 판단하고, 위험을 감수하는 성향은 특성이론으로, 오너 일가로서의 영향력은 권력 이론으로 보완하겠습니다.",
"평가할 때는 잘한 점만 늘어놓지 않으려고 합니다. 점유율 1.8% 회사를 업계 상위권으로 키웠고, 위기를 두 번 다 먼저 읽고 대응했고, AI 소프트웨어까지 수출했습니다. 반면 애플페이 수수료 논란은 국정감사까지 갔고, 저신용 고객을 줄이면서 성장했다는 비판, 그리고 리더 한 사람에게 너무 기대는 구조라는 지적도 있습니다. 이걸 다 놓고 결론에서는 처음 질문으로 돌아가 저희 판단을 내리겠습니다.",
"참고한 자료입니다. 따로 설명하지 않고 넘어가셔도 됩니다.",
"이상으로 저희 조의 계획 발표를 마치겠습니다. 질문 주시면 답변드리겠습니다."
];

// 슬라이드에는 봐야 할 것만, 설명은 발표자 노트로
const note = () => NOTES[page - 1];

// =====================================================================
// 표지
// =====================================================================
{
  const s = slide(true);
  darkLabel(s, "리더십 · 팀프로젝트 계획 발표");
  T(s, "스스로 바뀐 리더인가,\n판을 바꾼 리더인가", { x: M, y: 2.0, w: 8.0, h: 1.8, fontSize: 44, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.12 });
  T(s, "현대카드 정태영 부회장", { x: M, y: 4.0, w: 8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub, breakLine: true } },
    { text: "2026. 10. 26", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.6, w: 6, h: 1.0, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.75, cx = SW - M - cw, cy = 1.05;
  cardStack(s, cx, cy, cw, ["2E2E2E", "8C8C8C", HEX.accent], C.text1);
  T(s, [{ text: "JUNG TAE-YOUNG", options: { bold: true, breakLine: true, charSpacing: 1.5 } }, { text: "2003 — 2026", options: { charSpacing: 1.5 } }],
    { x: cx + cw * 0.11, y: cy + cw * 1.586 - cw * 0.42, w: cw * 0.8, h: cw * 0.3, fontSize: 11, color: C.background1, valign: "bottom" });
  s.addNotes(note());
}

// =====================================================================
// 목차
// =====================================================================
{
  const s = slide(false);
  const pw = 4.35;
  rect(s, { x: 0, y: 0, w: pw, h: SH, fill: { color: C.text1 } });
  T(s, "목차", { x: M, y: 0.84, w: pw - M, h: 0.75, fontSize: 28, bold: true, color: C.background1, valign: "top" });
  card(s, M, 4.1, 1.55, { fill: C.accent1, chip: C.text1 });
  const items = ["리더 및 선정 배경", "대상 리더 간략 소개", "팀플 보고서 작성 방법"];
  const x0 = pw + 0.9, w0 = SW - M - x0, y0 = 1.35, rh = 1.6;
  items.forEach((t, i) => {
    const y = y0 + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, `0${i + 1}`, { x: x0, y, w: 1.4, h: rh, fontSize: 48, bold: true, color: i === 0 ? C.accent1 : HEX.rule, valign: "middle" });
    T(s, t, { x: x0 + 1.6, y, w: w0 - 1.6, h: rh, fontSize: 28, bold: true, valign: "middle" });
  });
  s.addNotes(note());
}

// =====================================================================
// 핵심 질문
// =====================================================================
{
  const s = slide(true);
  darkLabel(s, "저희가 답하려는 질문");
  T(s, "상황이 바뀔 때마다\n자기 행동을 바꾼 리더일까,\n상황 자체를 바꾼 리더일까?", {
    x: M, y: 1.4, w: 10.5, h: 2.6, fontSize: 40, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15,
  });
  const bw = (W - 0.4) / 2, by = 4.75, bh = 1.75;
  [["A", "리더가 바뀌었다면", "House 경로-목표이론"], ["B", "상황을 바꿨다면", "Fiedler 상황 모델"]].forEach(([tag, k, t], i) => {
    const x = M + i * (bw + 0.4);
    rect(s, { x, y: by, w: bw, h: bh, fill: { color: PANEL_DARK } });
    T(s, tag, { x: x + bw - 1.3, y: by + 0.1, w: 1.1, h: 1.2, fontSize: 64, bold: true, color: "3A3A3A", align: "right", valign: "top" });
    T(s, k, { x: x + 0.4, y: by + 0.35, w: bw - 1.6, h: 0.35, fontSize: 15, bold: true, color: C.accent1 });
    T(s, t, { x: x + 0.4, y: by + 0.8, w: bw - 1.6, h: 0.6, fontSize: 26, bold: true, color: C.background1, valign: "middle" });
  });
  s.addNotes(note());
}

section("01", "리더 및 선정 배경", "", note());

// =====================================================================
// History
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "카드대란 한복판에 적자 회사를 맡아 23년째 경영", "출처: 비즈니스포스트, 한경비즈니스");
  const bandY = 2.05, bandH = 2.55;
  rect(s, { x: 0, y: bandY, w: SW, h: bandH, fill: { color: C.background2 } });
  const events = [["2003", "대표 취임"], ["2005", "the Black"], ["2015", "디지털 선언"], ["2018", "첫 희망퇴직"], ["2023", "애플페이"], ["2024–26", "AI 수출"]];
  const n = events.length, colW = W / n, lineY = bandY + 1.25;
  hline(s, M, lineY, W, "C9C9C9", 1);
  events.forEach(([year, desc], i) => {
    const x = M + i * colW, key = i === 0;
    T(s, year, { x, y: lineY - 0.95, w: colW - 0.1, h: 0.7, fontSize: key ? 32 : 26, bold: true, color: key ? C.accent1 : C.text1, valign: "bottom" });
    dot(s, x + (key ? 0.12 : 0.08), lineY, key ? 0.24 : 0.16, key ? C.accent1 : C.text1);
    T(s, desc, { x, y: lineY + 0.3, w: colW - 0.15, h: 0.45, fontSize: 18, valign: "top" });
  });
  [["1   위기와 회생", 0, 1, true], ["2   브랜드 성장", 2, 2, false], ["3   구조조정", 3, 3, false], ["4   디지털 전환", 4, 5, true]].forEach(([label, a, b, focus]) => {
    const x = M + a * colW, w = (b - a + 1) * colW - 0.1;
    rect(s, { x, y: 5.1, w, h: 0.8, fill: { color: focus ? C.text1 : C.background2 } });
    T(s, label, { x: x + 0.2, y: 5.1, w: w - 0.25, h: 0.8, fontSize: 17, bold: true, color: focus ? C.background1 : HEX.seg3, valign: "middle" });
    if (focus) T(s, "집중", { x: x + w - 0.9, y: 5.1, w: 0.7, h: 0.8, fontSize: 14, bold: true, color: C.accent1, align: "right", valign: "middle" });
  });
  s.addNotes(note());
}

// =====================================================================
// 선정 이유
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "왜 정태영인가");
  const lw = 6.4, ph = 6.55 - TOP;
  rect(s, { x: M, y: TOP, w: lw, h: ph, fill: { color: C.text1 } });
  const px = M + 0.5, pw = lw - 1.0;
  T(s, "01", { x: px, y: TOP + 0.45, w: 1, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
  T(s, "성격이 전혀 다른\n네 시기를 한 사람이 이끌었다", { x: px, y: TOP + 1.05, w: pw, h: 1.6, fontSize: 30, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15 });
  ["위기", "성장", "구조조정", "디지털 전환"].forEach((t, i) => {
    const cw = (pw - 0.3) / 4, x = px + i * (cw + 0.1);
    const last = i === 3;
    rect(s, { x, y: TOP + 3.35, w: cw, h: 0.6, fill: { color: last ? HEX.accent : PHASE[i].fill } });
    T(s, t, { x, y: TOP + 3.35, w: cw, h: 0.6, fontSize: 14, bold: true, color: last ? "FFFFFF" : PHASE[i].fg, align: "center", valign: "middle" });
  });
  const rx = M + lw + 0.3, rw = SW - M - rx, bh = (ph - 0.3) / 2;
  [["02", "본인이 직접\n한 말이 많다"], ["03", "성과만큼\n논란도 있다"]].forEach(([n, h], i) => {
    const y = TOP + i * (bh + 0.3);
    rect(s, { x: rx, y, w: rw, h: bh, fill: { color: C.background2 } });
    T(s, n, { x: rx + 0.45, y: y + 0.35, w: 1, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
    T(s, h, { x: rx + 0.45, y: y + 0.8, w: rw - 0.9, h: bh - 1.0, fontSize: 24, bold: true, valign: "top", lineSpacingMultiple: 1.15 });
  });
  s.addNotes(note());
}

section("02", "대상 리더 간략 소개", "", note());

// =====================================================================
// 프로필
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 프로필", "전문경영인이자 오너 일가의 사위", "출처: 비즈니스포스트, DART 반기보고서");
  const cw = 2.6;
  cardStack(s, M + 0.5, TOP, cw, ["BDBDBD", C.text1], C.accent1);
  T(s, [{ text: "정태영", options: { bold: true, fontSize: 24, breakLine: true } }, { text: "1960년생", options: { color: HEX.darkSub } }],
    { x: M + 0.5 + cw * 0.11, y: TOP + cw * 1.586 - cw * 0.42, w: cw * 0.8, h: cw * 0.3, fontSize: 12, color: C.background1, valign: "bottom" });
  const rows = [["학력", "서울대 불문과 · MIT MBA"], ["현직", "현대카드 · 현대커머셜 부회장"], ["가족", "정몽구 명예회장의 사위"]];
  const x0 = M + cw + 1.1, w0 = SW - M - x0, rh = 0.85;
  rows.forEach(([k, v], i) => {
    const y = TOP + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, k, { x: x0, y, w: 1.6, h: rh, fontSize: 15, bold: true, color: C.text2, valign: "middle" });
    T(s, v, { x: x0 + 1.7, y, w: w0 - 1.7, h: rh, fontSize: 21, valign: "middle", bold: i === 2 });
  });
  const ky = TOP + 3 * rh + 0.35;
  rect(s, { x: x0, y: ky, w: w0, h: 6.55 - ky, fill: { color: C.background2 } });
  T(s, [{ text: "23", options: { fontSize: 72, bold: true, color: C.accent1 } }, { text: " 년째 대표", options: { fontSize: 26, bold: true } }],
    { x: x0 + 0.45, y: ky, w: w0 - 0.6, h: 6.55 - ky, valign: "middle" });
  s.addNotes(note());
}

// =====================================================================
// 회사 개요
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 회사 현황", "현대차그룹 계열 카드사", "출처: 현대카드 반기보고서(2026.6 기준), DART");
  const stats = [["2001년", "출범"], ["1,311만 명", "회원"], ["2,116명", "직원"]];
  const gap = 0.3, sw = (W - gap * 2) / 3, sh = 1.7;
  stats.forEach(([n, l], i) => {
    const x = M + i * (sw + gap), hi = i === 1;
    rect(s, { x, y: TOP, w: sw, h: sh, fill: { color: hi ? C.accent1 : C.background2 } });
    T(s, n, { x: x + 0.4, y: TOP + 0.25, w: sw - 0.6, h: 0.85, fontSize: 40, bold: true, color: hi ? C.background1 : C.text1, valign: "bottom" });
    T(s, l, { x: x + 0.4, y: TOP + 1.12, w: sw - 0.6, h: 0.35, fontSize: 16, color: hi ? C.background1 : C.text2 });
  });
  T(s, "주요 사업", { x: M, y: 4.05, w: 3, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
  const biz = [["자체 카드", C.text1, C.accent1], ["PLCC", HEX.seg3, C.text1], ["카드대출", HEX.seg4, C.text1], ["데이터 · AI", C.accent1, C.text1]];
  const bw = W / 4, mcw = 0.75;
  biz.forEach(([t, fill, chip], i) => {
    const x = M + i * bw;
    card(s, x, 4.55, mcw, { fill, chip });
    T(s, t, { x: x + mcw + 0.3, y: 4.55, w: bw - mcw - 0.4, h: mcw * 1.586, fontSize: 21, bold: true, valign: "middle" });
  });
  s.addNotes(note());
}

// =====================================================================
// 재무정보
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 재무정보", "이익은 늘었고, 점유율은 업계 2위", "출처: 현대카드 반기보고서(2026.8), DART · 연결 기준");
  const pw = 5.0, ph = 6.55 - TOP;
  rect(s, { x: M, y: TOP, w: pw, h: ph, fill: { color: C.text1 } });
  const stats = [["4조 78억", "2025 영업수익", false], ["3,503억", "2025 순이익", false], ["19.3%", "이용실적 점유율 · 2위", true]];
  stats.forEach(([num, label, hi], i) => {
    const y = TOP + 0.3 + i * 1.42;
    if (i > 0) hline(s, M + 0.45, y - 0.12, pw - 0.9, HEX.darkRule, 0.75);
    T(s, num, { x: M + 0.45, y, w: pw - 0.9, h: 0.75, fontSize: 38, bold: true, color: hi ? C.accent1 : C.background1, valign: "bottom" });
    T(s, label, { x: M + 0.45, y: y + 0.78, w: pw - 0.7, h: 0.35, fontSize: 15, color: HEX.darkSub, valign: "top" });
  });
  const cx = M + pw + 0.6, cw = SW - M - cx;
  T(s, "영업이익 · 순이익 (억원)", { x: cx, y: TOP, w: cw, h: 0.35, fontSize: 15, bold: true });
  const series = [["2024년", "C4C4C4"], ["2025년", HEX.accent]];
  series.forEach(([name, color], i) => {
    const lx = cx + cw - 2.3 + i * 1.15;
    rect(s, { x: lx, y: TOP + 0.1, w: 0.15, h: 0.15, fill: { color } });
    T(s, name, { x: lx + 0.22, y: TOP + 0.02, w: 0.85, h: 0.3, fontSize: 13, color: HEX.grey, valign: "middle" });
  });
  const groups = [["영업이익", [4061, 4393]], ["순이익", [3164, 3503]]];
  const base = TOP + 4.1, maxH = 3.2, maxV = 4600, bw = 1.0, bg = 0.12, gwid = cw / 2;
  hline(s, cx, base, cw, HEX.rule, 1);
  groups.forEach(([label, vals], g) => {
    const gx = cx + g * gwid + (gwid - (bw * 2 + bg)) / 2;
    vals.forEach((v, i) => {
      const h = (maxH * v) / maxV, x = gx + i * (bw + bg);
      rect(s, { x, y: base - h, w: bw, h, fill: { color: series[i][1] } });
      T(s, v.toLocaleString("en-US"), { x: x - 0.1, y: base - h - 0.34, w: bw + 0.2, h: 0.3, fontSize: 14, bold: i === 1, align: "center", valign: "bottom" });
    });
    T(s, label, { x: cx + g * gwid, y: base + 0.12, w: gwid, h: 0.35, fontSize: 15, align: "center", valign: "top" });
  });
  s.addNotes(note());
}

// =====================================================================
// 주주 구성
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 주주 구성", "정 부회장 개인 지분은 0%", "출처: 현대카드 반기보고서(2026.8), DART");
  const segs = [
    ["현대자동차", 36.96, HEX.ink, "FFFFFF"],
    ["현대커머셜", 34.62, HEX.accent, "FFFFFF"],
    ["대만 푸본", 19.98, HEX.seg3, "FFFFFF"],
    ["기아", 6.48, HEX.seg4, HEX.ink],
    ["기타", 1.96, HEX.rule, HEX.ink],
  ];
  const by = TOP + 0.1, bh = 1.2;
  let x = M;
  segs.forEach(([name, pct, fill, fg]) => {
    const w = W * pct / 100;
    rect(s, { x, y: by, w: w - 0.03, h: bh, fill: { color: fill } });
    if (pct > 15) T(s, [{ text: name, options: { fontSize: 14, breakLine: true } }, { text: `${pct.toFixed(1)}%`, options: { fontSize: 24, bold: true } }],
      { x: x + 0.25, y: by, w: w - 0.3, h: bh, color: fg, valign: "middle" });
    x += w;
  });
  T(s, "기아 6.5% · 기타 2.0%", { x: M, y: by + bh + 0.12, w: W, h: 0.3, fontSize: 13, color: C.text2, align: "right" });
  const py = 4.3, ph = 6.55 - py;
  rect(s, { x: M, y: py, w: W, h: ph, fill: { color: C.background2 } });
  T(s, "영향력의 경로", { x: M + 0.4, y: py + 0.3, w: 3, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
  const fh = 1.0, fw = 2.9, fgap = 1.25, fy = py + 0.8, fx0 = M + (W - (3 * fw + 2 * fgap)) / 2;
  const flow = [["정태영 · 정명이 부부", "FFFFFF", C.text1], ["현대커머셜", C.accent1, C.background1], ["현대카드", C.text1, C.background1]];
  flow.forEach(([t, fill, fg], i) => {
    const fx = fx0 + i * (fw + fgap);
    rect(s, { x: fx, y: fy, w: fw, h: fh, fill: { color: fill } });
    T(s, t, { x: fx, y: fy, w: fw, h: fh, fontSize: 19, bold: true, color: fg, align: "center", valign: "middle" });
    if (i < 2) {
      arrowRight(s, fx + fw + 0.15, fy + fh / 2, fgap - 0.3, HEX.grey);
      T(s, i === 0 ? "대주주" : "34.6%", { x: fx + fw, y: fy + fh / 2 - 0.45, w: fgap, h: 0.3, fontSize: 13, bold: true, color: C.text2, align: "center" });
    }
  });
  s.addNotes(note());
}

section("03", "팀플 보고서 작성 방법", "", note());

// =====================================================================
// 자료 조사
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 자료 조사", "숫자는 공시로, 리더의 생각은 인터뷰로");
  const tiles = [["공시", "DART 반기보고서"], ["회사 자료", "IR · 뉴스룸"], ["언론 · 인터뷰", "기사 · 맥킨지 · SNS"], ["논문", "RISS · DBpia"]];
  const gap = 0.3, tw = (W - gap) / 2, th = (6.55 - TOP - gap) / 2;
  tiles.forEach(([k, v], i) => {
    const x = M + (i % 2) * (tw + gap), y = TOP + Math.floor(i / 2) * (th + gap);
    const dark = i === 0;
    rect(s, { x, y, w: tw, h: th, fill: { color: dark ? C.text1 : C.background2 } });
    T(s, `0${i + 1}`, { x: x + tw - 1.4, y: y + 0.15, w: 1.15, h: 0.9, fontSize: 40, bold: true, color: dark ? "3A3A3A" : HEX.rule, align: "right", valign: "top" });
    T(s, k, { x: x + 0.45, y: y + 0.5, w: tw - 2, h: 0.55, fontSize: 26, bold: true, color: dark ? C.background1 : C.text1 });
    T(s, v, { x: x + 0.45, y: y + 1.15, w: tw - 0.9, h: 0.45, fontSize: 18, color: dark ? HEX.darkSub : C.text2 });
  });
  s.addNotes(note());
}

// =====================================================================
// 분석 대상
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 분석 대상", "23년 중 두 시기만 깊게");
  const periods = [["1", "위기와 회생", "2003–2007", "가장 큰 위기"], ["2", "브랜드 성장", "2008–2017", ""], ["3", "구조조정", "2018–2021", ""], ["4", "디지털 전환", "2022–현재", "가장 최근"]];
  const gap = 0.2, pw = (W - gap * 3) / 4, ph = 3.0;
  periods.forEach(([n, p, yr, why], i) => {
    const x = M + i * (pw + gap), focus = !!why;
    rect(s, { x, y: TOP, w: pw, h: ph, fill: { color: focus ? C.text1 : C.background2 } });
    T(s, n, { x: x + 0.35, y: TOP + 0.3, w: 1, h: 0.7, fontSize: 36, bold: true, color: focus ? C.accent1 : HEX.rule, valign: "top" });
    T(s, [{ text: p, options: { bold: true, breakLine: true } }, { text: yr, options: { fontSize: 14, color: focus ? HEX.darkSub : HEX.seg4 } }],
      { x: x + 0.35, y: TOP + 1.15, w: pw - 0.5, h: 0.85, fontSize: 21, color: focus ? C.background1 : HEX.seg4, valign: "top", paraSpaceAfter: 3 });
    if (focus) {
      rrect(s, { x: x + 0.35, y: TOP + 2.25, w: pw - 0.7, h: 0.45, rectRadius: 0.05, fill: { color: C.accent1 } });
      T(s, why, { x: x + 0.35, y: TOP + 2.25, w: pw - 0.7, h: 0.45, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle" });
    }
  });
  const oy = TOP + ph + 0.6;
  const order = ["상황", "리더가 한 일", "결과", "이론"];
  const ow = (W - 0.5 * 3) / 4;
  order.forEach((t, i) => {
    const x = M + i * (ow + 0.5);
    rrect(s, { x, y: oy, w: ow, h: 0.7, rectRadius: 0.06, fill: { color: i === 1 ? C.accent1 : C.background2 } });
    T(s, t, { x, y: oy, w: ow, h: 0.7, fontSize: 18, bold: true, color: i === 1 ? C.background1 : C.text1, align: "center", valign: "middle" });
    if (i < 3) T(s, "→", { x: x + ow, y: oy, w: 0.5, h: 0.7, fontSize: 18, color: C.text2, align: "center", valign: "middle" });
  });
  s.addNotes(note());
}

// =====================================================================
// 집중 분석 1 · 2
// =====================================================================
// 상황(검정) | 리더가 한 일(3개) | 결과(빨강) + 아래 이론 한 줄
function focusSlide({ tag, title, source, situation, actions, results, theory }) {
  const s = content(`03  팀플 보고서 작성 방법 · ${tag}`, title, source);
  const y0 = TOP, h0 = 3.75, gap = 0.25;
  const lw = 3.4, rw = 3.4, mw = W - lw - rw - gap * 2;
  rect(s, { x: M, y: y0, w: lw, h: h0, fill: { color: C.text1 } });
  T(s, "상황", { x: M + 0.4, y: y0 + 0.35, w: lw - 0.8, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
  T(s, situation[0], { x: M + 0.4, y: y0 + 1.0, w: lw - 0.6, h: 1.1, fontSize: situation[2] || 54, bold: true, color: C.background1, valign: "middle" });
  T(s, situation[1], { x: M + 0.4, y: y0 + 2.2, w: lw - 0.7, h: 0.8, fontSize: 16, color: HEX.darkSub, valign: "top", lineSpacingMultiple: 1.2 });
  const mx = M + lw + gap;
  T(s, "리더가 한 일", { x: mx + 0.1, y: y0 + 0.05, w: mw, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
  const rh = (h0 - 0.45) / 3;
  actions.forEach((t, i) => {
    const y = y0 + 0.45 + i * rh;
    if (i > 0) hline(s, mx + 0.1, y, mw - 0.1);
    T(s, `${i + 1}`, { x: mx + 0.1, y, w: 0.5, h: rh, fontSize: 26, bold: true, color: C.accent1, valign: "middle" });
    T(s, t, { x: mx + 0.7, y, w: mw - 0.75, h: rh, fontSize: 21, bold: true, valign: "middle" });
  });
  const rx = mx + mw + gap;
  rect(s, { x: rx, y: y0, w: rw, h: h0, fill: { color: C.accent1 } });
  T(s, "결과", { x: rx + 0.4, y: y0 + 0.35, w: rw - 0.8, h: 0.3, fontSize: 14, bold: true, color: C.background1 });
  results.forEach(([big, label], i) => {
    const y = y0 + 0.8 + i * 1.45;
    if (i > 0) hline(s, rx + 0.4, y - 0.12, rw - 0.8, "E8836F");
    T(s, big, { x: rx + 0.4, y, w: rw - 0.6, h: 0.8, fontSize: 40, bold: true, color: C.background1, valign: "bottom" });
    T(s, label, { x: rx + 0.4, y: y + 0.82, w: rw - 0.6, h: 0.35, fontSize: 15, color: C.background1, valign: "top" });
  });
  const ty = y0 + h0 + 0.25, th = 6.55 - ty;
  rect(s, { x: M, y: ty, w: W, h: th, fill: { color: C.background2 } });
  T(s, "이론", { x: M + 0.4, y: ty, w: 1.2, h: th, fontSize: 15, bold: true, color: C.accent1, valign: "middle" });
  const tw = (W - 1.8) / 2;
  theory.forEach(([name, d], i) => {
    T(s, [{ text: name, options: { color: C.text2, fontSize: 14 } }, { text: `   ${d}`, options: { bold: true } }],
      { x: M + 1.6 + i * tw, y: ty, w: tw - 0.2, h: th, fontSize: 19, valign: "middle" });
  });
  s.addNotes(note());
  return s;
}

focusSlide({
  tag: "집중 분석 1",
  title: "위기와 회생 · 2003–2007",
  source: "출처: 서울신문(2010), GE 보도자료(2005), 현대카드 보도자료, 한경비즈니스(2025)",
  situation: ["1.8%", "시장점유율\n취임 첫해 적자 6,300억"],
  actions: ["현대카드M에 집중", "GE 제휴 (2005)", "the Black · 디자인"],
  results: [["약 7배", "5년 새 점유율"], ["460만 명", "M 회원 (2007)"]],
  theory: [["House", "지시적 리더십"], ["Fiedler", "GE 제휴로 권한 확보"]],
});

focusSlide({
  tag: "집중 분석 2",
  title: "디지털 전환 · 2022–현재",
  source: "출처: 비즈니스포스트, 머니투데이(2023), 현대카드 보도자료(2024), 헤럴드경제(2026)",
  situation: ["‘전시상황’", "고금리 · 연체 증가\n빅테크 경쟁", 40],
  actions: ["저신용 대출 축소", "애플페이 첫 도입 (2023)", "AI ‘유니버스’ 일본 수출"],
  results: [["3,503억", "2025 순이익"], ["업계 3위", "순이익 기준 첫 3위"]],
  theory: [["House", "성취지향적 리더십"], ["Fiedler", "대출 구조로 위험 관리"]],
});

// =====================================================================
// 두 시기 비교
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 이론과의 연계성", "행동은 달라졌고, 판은 두 번 다 바꿨다", "이론: 리더십 강의자료 4장 · 보고서에서 확인할 가설");
  const c0 = 2.6, c3 = 3.3, cw = (W - c0 - c3) / 2;
  const xs = [M, M + c0, M + c0 + cw, M + c0 + cw * 2];
  ["위기와 회생", "디지털 전환"].forEach((h, j) =>
    T(s, h, { x: xs[1 + j] + 0.25, y: TOP, w: cw - 0.3, h: 0.45, fontSize: 16, bold: true, color: C.text2, valign: "middle" }));
  hline(s, M, TOP + 0.55, W, HEX.ink, 1.25);
  const rows = [["리더 행동", "House", "지시적", "성취지향적", "달라졌다", "스스로 바뀐 리더"], ["판 바꾸기", "Fiedler", "GE 제휴", "대출 구조 재편", "두 번 다", "판을 바꾼 리더"]];
  const rh = 1.55;
  rows.forEach(([k, th, a, b, v1, v2], i) => {
    const y = TOP + 0.55 + i * rh;
    if (i > 0) hline(s, M, y, W);
    T(s, [{ text: k, options: { bold: true, breakLine: true } }, { text: th, options: { color: C.text2, fontSize: 14 } }],
      { x: xs[0], y, w: c0 - 0.2, h: rh, fontSize: 20, valign: "middle", paraSpaceAfter: 3 });
    [a, b].forEach((t, j) => T(s, t, { x: xs[1 + j] + 0.25, y, w: cw - 0.4, h: rh, fontSize: 24, bold: true, valign: "middle" }));
    rect(s, { x: xs[3], y: y + 0.2, w: c3, h: rh - 0.4, fill: { color: i === 0 ? C.background2 : C.text1 } });
    T(s, [{ text: v1, options: { fontSize: 14, breakLine: true } }, { text: `→ ${v2}`, options: { bold: true } }],
      { x: xs[3] + 0.35, y: y + 0.2, w: c3 - 0.5, h: rh - 0.4, fontSize: 19, color: i === 0 ? C.text1 : C.background1, valign: "middle", paraSpaceAfter: 3 });
  });
  hline(s, M, TOP + 0.55 + 2 * rh, W);
  const by = TOP + 0.55 + 2 * rh + 0.4, bh = 6.55 - by;
  rect(s, { x: M, y: by, w: W, h: bh, fill: { color: C.accent1 } });
  T(s, "어느 쪽이 더 컸는지는 보고서에서 판단", { x: M + 0.45, y: by, w: W - 0.9, h: bh, fontSize: 20, bold: true, color: C.background1, valign: "middle" });
  s.addNotes(note());
}

// =====================================================================
// 평가 방향
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 평가 방향", "잘한 점만큼 아쉬운 점도");
  const gap = 0.3, cw = (W - gap) / 2, ph = 3.6;
  const cols = [
    ["성과", "+", false, ["점유율 1.8% → 업계 2위", "위기 두 번 모두 극복", "AI 소프트웨어 수출"]],
    ["한계 · 논란", "−", true, ["애플페이 수수료 논란", "저신용 고객 축소", "리더 한 명에 의존"]],
  ];
  cols.forEach(([h, sign, dark, items], ci) => {
    const x = M + ci * (cw + gap);
    rect(s, { x, y: TOP, w: cw, h: ph, fill: { color: dark ? C.text1 : C.background2 } });
    T(s, sign, { x: x + cw - 1.1, y: TOP + 0.05, w: 0.85, h: 0.9, fontSize: 48, bold: true, color: dark ? C.accent1 : HEX.seg4, align: "right", valign: "top" });
    T(s, h, { x: x + 0.45, y: TOP + 0.35, w: cw - 1.6, h: 0.45, fontSize: 18, bold: true, color: dark ? C.accent1 : C.text1, valign: "middle" });
    items.forEach((t, i) => {
      const y = TOP + 1.05 + i * 0.8;
      T(s, t, { x: x + 0.45, y, w: cw - 0.9, h: 0.7, fontSize: 21, bold: true, color: dark ? C.background1 : C.text1, valign: "middle" });
    });
  });
  const cy = TOP + ph + 0.3, chh = 6.55 - cy;
  rect(s, { x: M, y: cy, w: W, h: chh, fill: { color: C.accent1 } });
  T(s, "결론: 스스로 바뀐 리더인가, 판을 바꾼 리더인가", { x: M + 0.45, y: cy, w: W - 0.9, h: chh, fontSize: 20, bold: true, color: C.background1, valign: "middle" });
  s.addNotes(note());
}

// =====================================================================
// 참고자료
// =====================================================================
{
  const s = content("부록", "참고자료");
  const left = [
    ["공시 · 인터뷰", [
      "현대카드, 「반기보고서」 제32기 2분기, 2026.8.14 제출, DART",
      "McKinsey & Company, After a decade of innovation, Hyundai Card seeks the next horizon (2025.7.23)",
    ]],
    ["인물 · 이력", [
      "한경비즈니스, 2021 파워 금융인 30: 정태영 현대카드 부회장",
      "서울신문, 금융 CEO에게 묻다: 정태영 현대카드 사장 (2010)",
      "비즈니스포스트, Who Is? 정태영 현대카드 대표이사 부회장",
    ]],
    ["실적 · 지분", [
      "딜사이트, 현대카드 지난해 순익 3,503억 (2026.1)",
      "SBS Biz, 현대카드 상반기 순이익 1,852억원 (2026.7)",
      "한국경제, 현대커머셜 현대카드 지분 5% 추가 확보 (2022.10)",
    ]],
  ];
  const right = [
    ["집중 분석 1 · 위기와 회생", [
      "GE, GE소비자금융 현대카드와 전략적 제휴 (2005.8)",
      "현대카드, ‘현대카드M’ 출시 20주년 (2023)",
      "이투데이, 현대카드M 단일 브랜드 최대 회원 (2007)",
      "한경비즈니스, 2025 파워금융인30: 정태영 부회장",
    ]],
    ["집중 분석 2 · 디지털 전환", [
      "비즈니스포스트, 정태영 ‘전시상황’ 관리 경험 빛났다",
      "머니투데이, 애플페이 출시 한 달…현대카드 웃었다 (2023.4)",
      "바이라인네트워크, 애플페이를 둘러싼 쟁점 (2023.10)",
      "현대카드, 日 ‘빅3 카드사’에 AI 플랫폼 수출 (2024.10)",
      "뉴데일리, 1조 투입 ‘데이터 현대카드’ 9년의 결실 (2024.11)",
      "헤럴드경제, 현대카드 순이익 업계 첫 ‘톱3’ 진입 (2026.2)",
      "포인트경제, 저신용자 거르고 우량고객 집중",
    ]],
    ["이론", ["리더십 강의자료 2장 – 6장"]],
  ];
  const colW = (W - 0.8) / 2;
  [left, right].forEach((groups, ci) => {
    const runs = [];
    groups.forEach(([h, items], gi) => {
      runs.push({ text: h, options: { bold: true, color: C.text1, fontSize: 13, breakLine: true, paraSpaceBefore: gi ? 10 : 0 } });
      items.forEach((it) => runs.push({ text: it, options: { color: C.text2, breakLine: true } }));
    });
    runs[runs.length - 1].options.breakLine = false;
    T(s, runs, { x: M + ci * (colW + 0.8), y: TOP - 0.15, w: colW, h: 4.85, fontSize: 11, valign: "top", paraSpaceAfter: 4, lineSpacingMultiple: 1.1 });
  });
  s.addNotes(note());
}

// =====================================================================
// 마무리
// =====================================================================
{
  const s = slide(true);
  T(s, "감사합니다", { x: M, y: 2.55, w: 8, h: 0.9, fontSize: 44, bold: true, color: C.background1, valign: "middle" });
  T(s, "질문 받겠습니다", { x: M, y: 3.5, w: 8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.9, w: 6, h: 0.7, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.75;
  cardStack(s, SW - M - cw, 1.05, cw, ["2E2E2E", "8C8C8C", HEX.accent], C.text1);
  s.addNotes(note());
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
