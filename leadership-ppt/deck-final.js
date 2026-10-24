// 리더십 팀프로젝트 계획 발표 최종본: Canva · 미리캔버스 호환용
// 차트 · 대각선 · 화살표를 기본 도형으로, 색은 hex로, 폰트는 텍스트마다 직접 지정한다
// usage: NODE_PATH=./node_modules node deck.js
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const OUT = "leadership-plan-final.pptx";
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
  T(s, sub, { x: M, y: 3.95, w: 8, h: 0.4, fontSize: 18, color: HEX.darkSub });
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

// =====================================================================
// 표지
// =====================================================================
{
  const s = slide(true);
  darkLabel(s, "리더십 · 팀프로젝트 계획 발표");
  T(s, "스스로 바뀐 리더인가,\n판을 바꾼 리더인가", { x: M, y: 2.0, w: 8.0, h: 1.8, fontSize: 44, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.12 });
  T(s, "현대카드 정태영 부회장 사례분석 계획", { x: M, y: 4.0, w: 8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub, breakLine: true } },
    { text: "2026. 10. 26", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.6, w: 6, h: 1.0, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.75;
  const cx = SW - M - cw, cy = 1.05;
  cardStack(s, cx, cy, cw, ["2E2E2E", "8C8C8C", HEX.accent], C.text1);
  T(s, [{ text: "JUNG TAE-YOUNG", options: { bold: true, breakLine: true, charSpacing: 1.5 } }, { text: "2003 — 2026", options: { charSpacing: 1.5 } }],
    { x: cx + cw * 0.11, y: cy + cw * 1.586 - cw * 0.42, w: cw * 0.8, h: cw * 0.3, fontSize: 11, color: C.background1, valign: "bottom" });
  s.addNotes("안녕하세요, ○조입니다. 저희 조는 현대카드 정태영 부회장을 분석 대상으로 정했습니다. 오늘은 보고서를 어떻게 쓸지, 그 계획을 말씀드리겠습니다.");
}

// =====================================================================
// 목차
// =====================================================================
{
  const s = slide(false);
  const pw = 4.35;
  rect(s, { x: 0, y: 0, w: pw, h: SH, fill: { color: C.text1 } });
  T(s, "목차", { x: M, y: 0.84, w: pw - M, h: 0.75, fontSize: 28, bold: true, color: C.background1, valign: "top" });
  T(s, "발표 20분 · 질의응답 15분", { x: M, y: 1.62, w: pw - M, h: 0.3, fontSize: 13, color: HEX.darkSub });
  card(s, M, 4.1, 1.55, { fill: C.accent1, chip: C.text1 });
  const items = [
    ["01", "리더 및 선정 배경", "어떤 사람인지, 왜 골랐는지"],
    ["02", "대상 리더 간략 소개", "프로필 · 회사 현황 · 재무 · 주주 구성"],
    ["03", "팀플 보고서 작성 방법", "자료 조사 · 사례분석 틀 · 이론 연계 · 평가 방향"],
  ];
  const x0 = pw + 0.9, w0 = SW - M - x0, y0 = 1.25, rh = 1.6;
  items.forEach(([n, t, d], i) => {
    const y = y0 + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, n, { x: x0, y: y + 0.22, w: 1.4, h: 0.95, fontSize: 48, bold: true, color: i === 0 ? C.accent1 : HEX.rule, valign: "middle" });
    T(s, t, { x: x0 + 1.6, y: y + 0.32, w: w0 - 1.6, h: 0.55, fontSize: 26, bold: true });
    T(s, d, { x: x0 + 1.6, y: y + 0.9, w: w0 - 1.6, h: 0.35, fontSize: 15, color: C.text2 });
  });
  s.addNotes("순서는 과제에서 주신 항목 그대로입니다. 리더를 왜 골랐는지, 어떤 사람이고 어떤 회사를 이끄는지 먼저 말씀드리고, 마지막에 보고서를 어떤 틀로 쓸지 가장 자세히 설명드리겠습니다.");
}

// =====================================================================
// 핵심 질문
// =====================================================================
{
  const s = slide(true);
  darkLabel(s, "저희가 답하려는 질문");
  T(s, "정태영 부회장은 상황이 바뀔 때마다\n자기 행동을 바꾼 리더일까,\n아니면 상황 자체를 바꾼 리더일까?", {
    x: M, y: 1.4, w: 10.5, h: 2.4, fontSize: 36, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15,
  });
  const bw = (W - 0.4) / 2, by = 4.45, bh = 2.1;
  [
    ["A", "리더가 바뀌었다면", "House 경로-목표이론", "위기 때와 전환기에 리더 행동이\n어떻게 달랐는지 본다"],
    ["B", "상황을 바꿨다면", "Fiedler 상황 모델", "제휴와 원칙으로 일하기 좋은\n판을 만들었는지 본다"],
  ].forEach(([tag, k, t, d], i) => {
    const x = M + i * (bw + 0.4);
    rect(s, { x, y: by, w: bw, h: bh, fill: { color: PANEL_DARK } });
    T(s, tag, { x: x + bw - 1.3, y: by + 0.1, w: 1.1, h: 1.2, fontSize: 64, bold: true, color: "3A3A3A", align: "right", valign: "top" });
    T(s, k, { x: x + 0.4, y: by + 0.35, w: bw - 1.6, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
    T(s, t, { x: x + 0.4, y: by + 0.7, w: bw - 1.6, h: 0.45, fontSize: 24, bold: true, color: C.background1 });
    T(s, d, { x: x + 0.4, y: by + 1.25, w: bw - 0.8, h: 0.7, fontSize: 15, color: HEX.darkSub, valign: "top", lineSpacingMultiple: 1.2 });
  });
  s.addNotes("보고서 전체를 이 질문 하나로 끌고 가려고 합니다. 정 부회장이 상황에 맞춰 자기 행동을 바꿨다면 House의 경로-목표이론으로 설명이 되고, 반대로 제휴나 원칙 같은 걸로 상황 자체를 바꿨다면 Fiedler의 상황 모델로 설명이 됩니다. 두 이론 중 어느 쪽이 더 잘 맞는지 비교하는 게 보고서의 목표입니다.");
}

// =====================================================================
// 섹션 01
// =====================================================================
section("01", "리더 및 선정 배경", "History · 선정 이유", "먼저 정태영 부회장이 어떤 사람인지, 그리고 저희가 왜 이 사람을 골랐는지 말씀드리겠습니다.");

// =====================================================================
// History
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "카드대란 한복판에 적자 회사를 맡아 23년째 경영",
    "출처: 비즈니스포스트 「Who Is? 정태영」, 한경비즈니스 「2021 파워 금융인 30」, 프라임경제 「CEO리포트」");
  T(s, [
    { text: "이전 경력   ", options: { bold: true } },
    { text: "1987–2002  현대종합상사 · 현대정공(미주·멕시코 법인장) · 현대모비스 · 기아", options: { color: C.text2 } },
  ], { x: M, y: TOP - 0.05, w: W, h: 0.35, fontSize: 14, valign: "middle" });

  // 타임라인 띠 (좌우 끝까지)
  const bandY = 2.55, bandH = 2.55;
  rect(s, { x: 0, y: bandY, w: SW, h: bandH, fill: { color: C.background2 } });
  const events = [
    ["2003", "대표이사 취임\n첫해 6천억대 적자\n현대카드M 출시"],
    ["2005", "초청제 프리미엄\n‘the Black’ 출시\n문화 마케팅 시작"],
    ["2015", "부회장 승진\n‘디지털 현대카드’\n선언"],
    ["2018", "수수료 인하로\n실적 악화\n창사 첫 희망퇴직"],
    ["2023", "애플페이\n국내 첫 도입\n‘전시체제’ 선언"],
    ["2024–26", "AI 플랫폼\n‘유니버스’를\n일본에 수출"],
  ];
  const n = events.length, colW = W / n, lineY = bandY + 1.05;
  hline(s, M, lineY, W, "C9C9C9", 1);
  events.forEach(([year, desc], i) => {
    const x = M + i * colW, key = i === 0;
    T(s, year, { x, y: lineY - 0.85, w: colW - 0.1, h: 0.6, fontSize: key ? 28 : 22, bold: true, color: key ? C.accent1 : C.text1, valign: "bottom" });
    dot(s, x + (key ? 0.11 : 0.07), lineY, key ? 0.22 : 0.14, key ? C.accent1 : C.text1);
    T(s, desc, { x, y: lineY + 0.25, w: colW - 0.15, h: 1.1, fontSize: 14, valign: "top", lineSpacingMultiple: 1.15 });
  });

  T(s, "분석은 네 시기로 나눠서", { x: M, y: 5.35, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  [["1   위기와 회생", 0, 1], ["2   브랜드 성장", 2, 2], ["3   구조조정", 3, 3], ["4   디지털 전환", 4, 5]].forEach(([label, a, b], i) => {
    const x = M + a * colW, w = (b - a + 1) * colW - 0.1;
    rect(s, { x, y: 5.72, w, h: 0.6, fill: { color: PHASE[i].fill } });
    T(s, label, { x: x + 0.18, y: 5.72, w: w - 0.2, h: 0.6, fontSize: 14, bold: true, color: PHASE[i].fg, valign: "middle" });
  });
  s.addNotes("정 부회장은 현대차그룹 계열사에서 기획과 해외 사업을 하다가, 카드대란이 한창이던 2003년에 적자 상태인 현대카드를 맡았습니다. 첫해에만 6천억 원대 적자가 났는데, 현대카드M을 내놓으면서 반전의 계기를 만들었습니다. 그 뒤로 프리미엄 카드와 문화 마케팅, 디지털 선언, 희망퇴직, 애플페이, AI 수출까지 이어집니다. 아래 띠처럼 저희는 이 23년을 네 시기로 나눠서 분석할 계획입니다.");
}

// =====================================================================
// 선정 이유
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "상황에 따라 리더십이 어떻게 달라지는지 보기 좋은 사례");
  const lw = 6.4, ph = 6.55 - TOP;
  rect(s, { x: M, y: TOP, w: lw, h: ph, fill: { color: C.text1 } });
  const px = M + 0.5, pw = lw - 1.0;
  T(s, "01", { x: px, y: TOP + 0.4, w: 1, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
  T(s, "성격이 전혀 다른 네 시기를\n한 사람이 이끌었다", { x: px, y: TOP + 0.95, w: pw, h: 1.3, fontSize: 28, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.12 });
  T(s, "위기부터 디지털 전환까지 한 CEO가 다 겪었기\n때문에 시기별로 나란히 놓고 비교할 수 있다", { x: px, y: TOP + 2.35, w: pw, h: 0.8, fontSize: 15, color: HEX.darkSub, valign: "top", lineSpacingMultiple: 1.25 });
  ["위기", "성장", "구조조정", "디지털 전환"].forEach((t, i) => {
    const cw = (pw - 0.3) / 4, x = px + i * (cw + 0.1);
    rect(s, { x, y: TOP + 3.55, w: cw, h: 0.55, fill: { color: PHASE[i].fill === HEX.ink ? HEX.accent : PHASE[i].fill } });
    T(s, t, { x, y: TOP + 3.55, w: cw, h: 0.55, fontSize: 13, bold: true, color: PHASE[i].fill === HEX.ink ? "FFFFFF" : PHASE[i].fg, align: "center", valign: "middle" });
  });
  const rx = M + lw + 0.6, rw = SW - M - rx;
  [
    ["02", "본인이 직접 한 말이 많다", "SNS와 인터뷰가 많아서 기사 내용과\n본인 설명을 서로 맞춰 볼 수 있다"],
    ["03", "성과만큼 논란도 있다", "업계 2위까지 키웠지만 희망퇴직, 애플페이\n수수료 논란도 있어 한쪽으로 치우치지 않는다"],
  ].forEach(([n, h, b], i) => {
    const y = TOP + i * (ph / 2 + 0.05), bh = ph / 2 - 0.05;
    rect(s, { x: rx, y, w: rw, h: bh, fill: { color: C.background2 } });
    T(s, n, { x: rx + 0.4, y: y + 0.3, w: 1, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
    T(s, h, { x: rx + 0.4, y: y + 0.75, w: rw - 0.8, h: 0.45, fontSize: 20, bold: true });
    T(s, b, { x: rx + 0.4, y: y + 1.28, w: rw - 0.6, h: 0.75, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  });
  s.addNotes("정 부회장을 고른 이유는 세 가지입니다. 가장 큰 이유는 성격이 전혀 다른 네 시기를 한 사람이 이끌었다는 점입니다. 리더가 같으니까 상황만 바뀌었을 때 리더십이 어떻게 달라지는지 비교하기 좋습니다. 또 본인이 SNS나 인터뷰로 직접 설명한 자료가 많고, 성과만큼 논란도 있어서 칭찬만 하는 보고서가 되지 않을 거라고 봤습니다.");
}

// =====================================================================
// 섹션 02
// =====================================================================
section("02", "대상 리더 간략 소개", "프로필 · 회사 현황 · 재무 · 주주 구성", "다음은 정 부회장 개인과 현대카드라는 회사를 간단히 소개하겠습니다.");

// =====================================================================
// 프로필
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 프로필", "전문경영인이자 오너 일가의 사위",
    "출처: 비즈니스포스트 「Who Is? 정태영」, 현대카드 반기보고서 제32기 임원 현황(DART)");
  // 왼쪽: 카드 + 재임 연수
  const cw = 2.6;
  cardStack(s, M + 0.5, TOP, cw, ["BDBDBD", C.text1], C.accent1);
  T(s, [{ text: "정태영", options: { bold: true, fontSize: 24, breakLine: true } }, { text: "Ted Chung · 1960", options: { color: HEX.darkSub } }],
    { x: M + 0.5 + cw * 0.11, y: TOP + cw * 1.586 - cw * 0.42, w: cw * 0.8, h: cw * 0.3, fontSize: 12, color: C.background1, valign: "bottom" });
  // 오른쪽: 정보표 + 큰 숫자
  const rows = [
    ["학력", "서울대 불어불문학과, 미국 MIT 경영대학원 MBA"],
    ["현직", "현대카드 · 현대커머셜 대표이사 부회장"],
    ["그룹과의 관계", "정몽구 현대차그룹 명예회장의 사위"],
    ["별명", "‘마케팅 천재’, ‘괴짜 경영인’"],
  ];
  const x0 = M + cw + 1.1, w0 = SW - M - x0, rh = 0.72;
  rows.forEach(([k, v], i) => {
    const y = TOP + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, k, { x: x0, y, w: 2.0, h: rh, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
    T(s, v, { x: x0 + 2.1, y, w: w0 - 2.1, h: rh, fontSize: 17, valign: "middle", bold: i === 2 });
  });
  const ky = TOP + 4 * rh + 0.3;
  rect(s, { x: x0, y: ky, w: w0, h: 6.55 - ky, fill: { color: C.background2 } });
  T(s, [{ text: "23", options: { fontSize: 60, bold: true, color: C.accent1 } }, { text: " 년째", options: { fontSize: 22, bold: true } }],
    { x: x0 + 0.4, y: ky, w: 3.6, h: 6.55 - ky, valign: "middle" });
  T(s, "2003년 대표이사 취임\n현 임기 2027년 3월까지", { x: x0 + 4.0, y: ky, w: w0 - 4.3, h: 6.55 - ky, fontSize: 15, color: C.text2, valign: "middle", lineSpacingMultiple: 1.25 });
  s.addNotes("정 부회장은 1960년생이고, 서울대 불문과를 나와 MIT에서 MBA를 했습니다. 여기서 눈여겨볼 건 정몽구 명예회장의 사위라는 점입니다. 월급 받는 전문경영인이면서 동시에 오너 일가이기도 해서, 이 사람의 영향력이 어디서 나오는지는 6장 권력 부분에서 따로 보려고 합니다. 그리고 2003년부터 23년째 대표를 맡고 있습니다.");
}

// =====================================================================
// 회사 개요
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 회사 현황", "현대차그룹 계열 카드사, 회원 1,311만 명",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅰ. 회사의 개요, DART · 회원·직원 수는 2026년 6월 말 기준");
  const stats = [
    ["2001년", "현대카드 출범"],
    ["1,311만 명", "신용카드 회원"],
    ["2,116명", "직원 · 본사 서울 여의도"],
  ];
  const gap = 0.3, sw = (W - gap * 2) / 3, sh = 1.55;
  stats.forEach(([n, l], i) => {
    const x = M + i * (sw + gap), hi = i === 1;
    rect(s, { x, y: TOP, w: sw, h: sh, fill: { color: hi ? C.accent1 : C.background2 } });
    T(s, n, { x: x + 0.35, y: TOP + 0.2, w: sw - 0.6, h: 0.8, fontSize: 36, bold: true, color: hi ? C.background1 : C.text1, valign: "bottom" });
    T(s, l, { x: x + 0.35, y: TOP + 1.02, w: sw - 0.6, h: 0.35, fontSize: 14, color: hi ? C.background1 : C.text2 });
  });
  T(s, "주요 사업", { x: M, y: 3.85, w: 3, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  const biz = [
    ["자체 카드", "알파벳카드\nthe Black · the Purple", C.text1, C.accent1],
    ["PLCC", "2015년 국내 첫 도입\n코스트코 · 대한항공", HEX.seg3, C.text1],
    ["카드대출", "카드론, 현금서비스", HEX.seg4, C.text1],
    ["데이터 · AI", "AI 플랫폼 ‘유니버스’\n일본에 수출", C.accent1, C.text1],
  ];
  const bw = W / 4, mcw = 0.62;
  biz.forEach(([t, d, fill, chip], i) => {
    const x = M + i * bw;
    card(s, x, 4.25, mcw, { fill, chip });
    T(s, t, { x: x + mcw + 0.3, y: 4.25, w: bw - mcw - 0.45, h: 0.45, fontSize: 17, bold: true, valign: "top" });
    T(s, d, { x: x + mcw + 0.3, y: 4.75, w: bw - mcw - 0.4, h: 0.9, fontSize: 13, color: C.text2, valign: "top", lineSpacingMultiple: 1.2 });
  });
  s.addNotes("현대카드는 다이너스클럽코리아를 현대차그룹이 인수해서 2001년에 이름을 바꾼 회사입니다. 상장은 안 되어 있고, 올해 6월 기준 회원이 1,311만 명 정도 됩니다. 사업은 크게 네 가지인데, 자체 카드, 코스트코나 대한항공처럼 제휴사 이름을 단 PLCC, 카드대출, 그리고 최근에 키우고 있는 데이터와 AI 사업입니다.");
}

// =====================================================================
// 재무정보
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 재무정보", "이익은 늘었고, 이용실적 점유율은 업계 2위",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅲ-1 요약재무정보, DART · 연결 기준 · 점유율은 금감원 신용카드 이용실적으로 계산");
  const pw = 5.0, ph = 6.55 - TOP;
  rect(s, { x: M, y: TOP, w: pw, h: ph, fill: { color: C.text1 } });
  const stats = [
    ["4조 78억원", "2025년 영업수익", false],
    ["3,503억원", "2025년 당기순이익 · 1년 전보다 10.7% 증가", false],
    ["19.3%", "2025년 이용실적 점유율 2위 (1위 신한 19.8%)", true],
  ];
  stats.forEach(([num, label, hi], i) => {
    const y = TOP + 0.3 + i * 1.42;
    if (i > 0) hline(s, M + 0.45, y - 0.12, pw - 0.9, HEX.darkRule, 0.75);
    T(s, num, { x: M + 0.45, y, w: pw - 0.9, h: 0.72, fontSize: 34, bold: true, color: hi ? C.accent1 : C.background1, valign: "bottom" });
    T(s, label, { x: M + 0.45, y: y + 0.76, w: pw - 0.7, h: 0.35, fontSize: 13, color: HEX.darkSub, valign: "top" });
  });
  const cx = M + pw + 0.6, cw = SW - M - cx;
  T(s, "영업이익 · 당기순이익 (억원)", { x: cx, y: TOP, w: cw, h: 0.35, fontSize: 14, bold: true });
  // 막대 차트를 도형으로: 어느 편집기에서 열어도 모양이 같고, 막대 높이만 늘리면 수정된다
  const series = [["2024년", "C4C4C4"], ["2025년", HEX.accent]];
  series.forEach(([name, color], i) => {
    const lx = cx + cw - 2.3 + i * 1.15;
    rect(s, { x: lx, y: TOP + 0.1, w: 0.15, h: 0.15, fill: { color } });
    T(s, name, { x: lx + 0.22, y: TOP + 0.02, w: 0.85, h: 0.3, fontSize: 12, color: HEX.grey, valign: "middle" });
  });
  const groups = [["영업이익", [4061, 4393]], ["당기순이익", [3164, 3503]]];
  const base = TOP + 3.15, maxH = 2.45, maxV = 4600, bw = 0.95, bg = 0.12, gwid = cw / 2;
  hline(s, cx, base, cw, HEX.rule, 1);
  groups.forEach(([label, vals], g) => {
    const gx = cx + g * gwid + (gwid - (bw * 2 + bg)) / 2;
    vals.forEach((v, i) => {
      const h = (maxH * v) / maxV, x = gx + i * (bw + bg);
      rect(s, { x, y: base - h, w: bw, h, fill: { color: series[i][1] } });
      T(s, v.toLocaleString("en-US"), { x: x - 0.1, y: base - h - 0.32, w: bw + 0.2, h: 0.28, fontSize: 12, align: "center", valign: "bottom" });
    });
    T(s, label, { x: cx + g * gwid, y: base + 0.1, w: gwid, h: 0.3, fontSize: 13, align: "center", valign: "top" });
  });
  rect(s, { x: cx, y: 5.65, w: cw, h: 0.9, fill: { color: C.background2 } });
  T(s, [
    { text: "2026년 상반기", options: { bold: true, breakLine: true } },
    { text: "영업수익 2조 3,372억 · 영업이익 2,495억 · 순이익 1,852억", options: { color: C.text2 } },
  ], { x: cx + 0.25, y: 5.65, w: cw - 0.4, h: 0.9, fontSize: 14, valign: "middle", paraSpaceAfter: 2 });
  s.addNotes("작년 영업수익은 4조 78억 원이고, 순이익은 3,503억 원으로 1년 전보다 10.7% 늘었습니다. 카드 이용실적 점유율은 19.3%로, 신한카드 바로 다음인 업계 2위입니다. 2003년에 적자 회사였다는 걸 생각하면 꽤 큰 변화입니다. 올해 상반기 숫자는 기간이 달라서 아래에 따로 적었습니다.");
}

// =====================================================================
// 주주 구성
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 기업 현황", "정 부회장 개인 지분은 0%, 영향력은 현대커머셜에서",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) 주주에 관한 사항, DART · 한국경제 「현대커머셜, 현대카드 지분 5% 추가 확보」(2022.10)");
  const segs = [
    ["현대자동차", 36.96, HEX.ink, "FFFFFF"],
    ["현대커머셜", 34.62, HEX.accent, "FFFFFF"],
    ["대만 푸본금융그룹", 19.98, HEX.seg3, "FFFFFF"],
    ["기아", 6.48, HEX.seg4, HEX.ink],
    ["소액주주", 1.96, HEX.rule, HEX.ink],
  ];
  const by = TOP + 0.1, bh = 1.1;
  let x = M;
  segs.forEach(([name, pct, fill, fg]) => {
    const w = W * pct / 100;
    rect(s, { x, y: by, w: w - 0.03, h: bh, fill: { color: fill } });
    if (pct > 15) T(s, `${pct.toFixed(2)}%`, { x: x + 0.25, y: by, w: w - 0.3, h: bh, fontSize: 24, bold: true, color: fg, valign: "middle" });
    x += w;
  });
  const lw = W / 5;
  segs.forEach(([name, pct, fill], i) => {
    const lx = M + i * lw;
    rect(s, { x: lx, y: by + bh + 0.3, w: 0.16, h: 0.16, fill: { color: fill } });
    T(s, [{ text: name, options: { bold: true, breakLine: true } }, { text: `${pct.toFixed(2)}%`, options: { color: C.text2 } }],
      { x: lx + 0.28, y: by + bh + 0.22, w: lw - 0.35, h: 0.65, fontSize: 14, valign: "top", paraSpaceAfter: 2 });
  });
  // 영향력 경로: 회색 판 위에
  const py = 4.55, ph = 6.55 - py;
  rect(s, { x: M, y: py, w: W, h: ph, fill: { color: C.background2 } });
  const fy = py + 0.5, fh = 1.0, fw = 2.2, fgap = 0.95;
  const flow = [["정태영 · 정명이 부부", "FFFFFF", C.text1], ["현대커머셜", C.accent1, C.background1], ["현대카드", C.text1, C.background1]];
  flow.forEach(([t, fill, fg], i) => {
    const fx = M + 0.4 + i * (fw + fgap);
    rect(s, { x: fx, y: fy, w: fw, h: fh, fill: { color: fill } });
    T(s, t, { x: fx, y: fy, w: fw, h: fh, fontSize: 16, bold: true, color: fg, align: "center", valign: "middle" });
    if (i < 2) {
      arrowRight(s, fx + fw + 0.12, fy + fh / 2, fgap - 0.24, HEX.grey);
      T(s, i === 0 ? "대주주" : "34.62%", { x: fx + fw, y: fy + fh / 2 - 0.42, w: fgap, h: 0.3, fontSize: 12, color: C.text2, align: "center" });
    }
  });
  const nx = M + 0.4 + 3 * fw + 2 * fgap + 0.5;
  T(s, [
    { text: "현대차그룹 계열 합계", options: { color: C.text2, breakLine: true } },
    { text: "78.06%", options: { bold: true, fontSize: 26 } },
  ], { x: nx, y: fy - 0.05, w: SW - M - nx - 0.2, h: 1.1, fontSize: 14, valign: "middle" });
  s.addNotes("주주를 보면 현대자동차가 1대 주주, 현대커머셜이 2대 주주입니다. 재미있는 건 정 부회장 본인은 현대카드 주식이 한 주도 없다는 점입니다. 대신 부부가 대주주인 현대커머셜이 현대카드 지분의 34.62%를 갖고 있어서, 간접적으로 영향력을 가집니다. 지분보다는 직위와 관계에서 나오는 힘이라서, 이 부분도 권력 이론으로 연결해 볼 생각입니다.");
}

// =====================================================================
// 섹션 03
// =====================================================================
section("03", "팀플 보고서 작성 방법", "자료 조사 · 사례분석 틀 · 이론 연계 · 평가 방향", "이제 보고서를 어떻게 쓸지 말씀드리겠습니다. 오늘 발표에서 가장 중요한 부분입니다.");

// =====================================================================
// 자료 조사
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 자료 조사", "숫자는 공시로, 리더의 생각은 인터뷰로 확인");
  const tiles = [
    ["공시", "금융감독원 DART 사업 · 반기보고서", "매출과 이익, 주주 구성, 임원 현황"],
    ["회사 자료", "현대카드 IR 자료, 뉴스룸", "사업 전략, 시기별 주요 발표"],
    ["언론 · 인터뷰", "경제지 기사, 맥킨지 인터뷰(2025), 정 부회장 SNS", "리더 본인이 설명한 판단 이유와 경영 방침"],
    ["논문 · 서적", "RISS · DBpia의 현대카드 사례 연구", "앞선 연구가 쓴 분석 틀, 이론 적용 방식"],
  ];
  const gap = 0.3, tw = (W - gap) / 2, th = (6.55 - TOP - gap) / 2;
  tiles.forEach(([k, where, what], i) => {
    const x = M + (i % 2) * (tw + gap), y = TOP + Math.floor(i / 2) * (th + gap);
    const dark = i === 0;
    rect(s, { x, y, w: tw, h: th, fill: { color: dark ? C.text1 : C.background2 } });
    T(s, `0${i + 1}`, { x: x + tw - 1.4, y: y + 0.15, w: 1.15, h: 0.9, fontSize: 40, bold: true, color: dark ? "3A3A3A" : HEX.rule, align: "right", valign: "top" });
    T(s, k, { x: x + 0.4, y: y + 0.35, w: tw - 2, h: 0.45, fontSize: 20, bold: true, color: dark ? C.background1 : C.text1 });
    T(s, [{ text: where, options: { breakLine: true } }, { text: what, options: { color: dark ? HEX.darkSub : C.text2, fontSize: 14 } }],
      { x: x + 0.4, y: y + 0.95, w: tw - 0.8, h: th - 1.15, fontSize: 15, color: dark ? C.background1 : C.text1, valign: "top", paraSpaceAfter: 6, lineSpacingMultiple: 1.15 });
  });
  s.addNotes("자료는 네 군데서 모읍니다. 매출이나 지분 같은 숫자는 DART 공시를 기준으로 하고, 회사가 직접 낸 IR 자료와 뉴스룸으로 시기별 발표를 확인합니다. 리더가 왜 그런 결정을 했는지는 인터뷰와 본인 SNS에서 찾고, 논문은 앞선 연구가 현대카드를 어떤 틀로 분석했는지 참고하려고 합니다.");
}

// =====================================================================
// 사례분석 프레임워크
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 사례분석 프레임워크", "23년을 네 시기로 나누고, 시기마다 같은 순서로 분석");
  const order = ["상황", "리더의 행동", "성과", "한계"];
  const ow = 1.9;
  T(s, "시기마다", { x: M, y: TOP, w: 1.1, h: 0.45, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
  order.forEach((t, i) => {
    const x = M + 1.15 + i * (ow + 0.45);
    rrect(s, { x, y: TOP, w: ow, h: 0.45, rectRadius: 0.06, fill: { color: i === 1 ? C.accent1 : C.background2 } });
    T(s, t, { x, y: TOP, w: ow, h: 0.45, fontSize: 14, bold: true, color: i === 1 ? C.background1 : C.text1, align: "center", valign: "middle" });
    if (i < 3) T(s, "→", { x: x + ow, y: TOP, w: 0.45, h: 0.45, fontSize: 14, color: C.text2, align: "center", valign: "middle" });
  });
  const periods = [
    ["1   위기와 회생", "2003–2007", "카드대란, 대규모 적자", "현대카드M 출시\n윤리 원칙 수립\nGE와의 제휴"],
    ["2   브랜드 성장", "2008–2017", "흑자 안정, 차별화 경쟁", "문화 마케팅\n자율적인 조직문화\n디지털 전환 선언"],
    ["3   구조조정", "2018–2021", "수수료 인하, 실적 악화", "창사 첫 희망퇴직\n코스트코 제휴\n데이터 투자"],
    ["4   디지털 전환", "2022–현재", "고금리, 빅테크와의 경쟁", "리스크 관리 강화\n애플페이 도입\nAI 플랫폼 수출"],
  ];
  const lw = 1.45, gx = M + lw, gap = 0.12, gw = (W - lw - gap * 3) / 4, y0 = 2.75, hh = 0.95;
  T(s, "상황", { x: M, y: y0 + hh + 0.1, w: lw, h: 0.65, fontSize: 13, bold: true, color: C.text2, valign: "middle" });
  T(s, "분석할 사례", { x: M, y: y0 + hh + 0.95, w: lw, h: 0.4, fontSize: 13, bold: true, color: C.text2, valign: "top" });
  periods.forEach(([p, yr, sit, cases], i) => {
    const x = gx + i * (gw + gap);
    rect(s, { x, y: y0, w: gw, h: hh, fill: { color: PHASE[i].fill } });
    T(s, [{ text: p, options: { bold: true, breakLine: true } }, { text: yr, options: { fontSize: 13 } }],
      { x: x + 0.2, y: y0, w: gw - 0.3, h: hh, fontSize: 16, color: PHASE[i].fg, valign: "middle", paraSpaceAfter: 2 });
    rect(s, { x, y: y0 + hh, w: gw, h: 2.75, fill: { color: "FAFAFA" } });
    T(s, sit, { x: x + 0.2, y: y0 + hh + 0.1, w: gw - 0.3, h: 0.65, fontSize: 14, bold: true, valign: "middle" });
    hline(s, x + 0.2, y0 + hh + 0.82, gw - 0.4);
    T(s, cases, { x: x + 0.2, y: y0 + hh + 0.98, w: gw - 0.3, h: 1.5, fontSize: 14, valign: "top", lineSpacingMultiple: 1.3 });
  });
  s.addNotes("보고서 본론은 이 표대로 갑니다. 네 시기마다 어떤 상황이었는지, 리더가 뭘 했는지, 결과가 어땠는지, 아쉬운 점은 뭐였는지를 같은 순서로 봅니다. 순서를 똑같이 맞춰야 시기끼리 비교가 되기 때문입니다. 그중에서도 빨간색, 리더의 행동이 저희 질문과 바로 이어지는 부분이라 가장 자세히 다룰 예정입니다.");
}

// =====================================================================
// 이론 연계
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 이론과의 연계성", "4장의 두 이론이 중심, 나머지 네 이론은 보조",
    "이론 출처: 리더십 강의자료 2장 특성이론, 3장 행동이론과 동기부여, 4장 리더십 상황이론, 5장 갈등관리, 6장 권력·협상");
  const main = [
    ["A", "리더 행동의 변화", "House 경로-목표이론", "위기 때는 지시적, 전환기에는\n성취지향적 리더십을 보였을까"],
    ["B", "조직 상황의 변화", "Fiedler 상황 모델", "GE 제휴와 윤리 원칙이\n과업구조와 직위권력을 바꿨을까"],
  ];
  const gap = 0.3, bw = (W - gap) / 2, bh = 2.2;
  main.forEach(([tag, k, t, q], i) => {
    const x = M + i * (bw + gap);
    rect(s, { x, y: TOP, w: bw, h: bh, fill: { color: C.text1 } });
    T(s, tag, { x: x + bw - 1.3, y: TOP + 0.1, w: 1.1, h: 1.2, fontSize: 64, bold: true, color: "3A3A3A", align: "right", valign: "top" });
    T(s, [{ text: k, options: {} }, { text: "  ·  4장", options: { color: HEX.darkSub } }], { x: x + 0.4, y: TOP + 0.35, w: bw - 1.6, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
    T(s, t, { x: x + 0.4, y: TOP + 0.72, w: bw - 1.6, h: 0.5, fontSize: 24, bold: true, color: C.background1, valign: "middle" });
    T(s, q, { x: x + 0.4, y: TOP + 1.35, w: bw - 0.8, h: 0.75, fontSize: 15, color: HEX.darkSub, valign: "top", lineSpacingMultiple: 1.2 });
  });
  const sub = [
    ["특성이론", "2장", "개방성과 위험 감수 성향이 결정에 드러났나"],
    ["행동이론", "3장", "구조주도(원칙 · 디자인)와 배려가 함께 보였나"],
    ["갈등관리", "5장", "희망퇴직과 노조 면담 때 어떤 방식으로 대응했나"],
    ["권력 · 협상", "6장", "직위와 관계에서 나온 힘, 애플페이 협상"],
  ];
  const sy = TOP + bh + 0.3, sh = 6.55 - sy, sgap = 0.3, sw = (W - sgap * 3) / 4;
  sub.forEach(([t, ch, q], i) => {
    const x = M + i * (sw + sgap);
    rect(s, { x, y: sy, w: sw, h: sh, fill: { color: C.background2 } });
    T(s, [{ text: t, options: { bold: true } }, { text: `  ${ch}`, options: { color: C.text2, fontSize: 13 } }],
      { x: x + 0.3, y: sy + 0.3, w: sw - 0.5, h: 0.4, fontSize: 17, valign: "middle" });
    T(s, q, { x: x + 0.3, y: sy + 0.85, w: sw - 0.45, h: 0.9, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  });
  s.addNotes("이론은 수업 4장에서 배운 두 가지가 중심입니다. 리더의 행동이 바뀌었는지는 House의 경로-목표이론으로, 상황이 바뀌었는지는 Fiedler의 상황 모델로 봅니다. 여기에 2장 특성이론, 3장 행동이론, 5장 갈등관리, 6장 권력과 협상을 보조로 써서, 리더 개인의 성향이나 영향력이 어디서 나오는지도 함께 보겠습니다.");
}

// =====================================================================
// 시기별 예상: 리더 행동 유형 변화 도식
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 시기별 예상", "리더 행동은 지시적에서 시작해 성취지향적으로 갈 것",
    "리더 행동 유형: House 경로-목표이론 · 상황변수: Fiedler의 리더-부하 관계, 과업구조, 직위권력 · 보고서에서 맞는지 확인할 가설");
  const levels = ["성취지향적", "참여적 · 후원적", "지시적"];
  const ax = M + 2.3, aw = SW - M - ax, ay = TOP + 0.15, lh = 0.82;
  T(s, "예상 리더 행동", { x: M, y: ay - 0.05, w: 2.2, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  levels.forEach((l, j) => {
    const y = ay + 0.45 + j * lh;
    hline(s, ax, y, aw, j === 2 ? "C9C9C9" : "E6E6E6", 0.75);
    T(s, l, { x: M, y: y - 0.2, w: 2.1, h: 0.4, fontSize: 14, bold: true, color: C.text1, valign: "middle" });
  });
  const cw = aw / 4;
  const path = [2, 1, 2, 0]; // 각 시기의 예상 수준
  const pts = path.map((lv, i) => [ax + cw * i + cw / 2, ay + 0.45 + lv * lh]);
  for (let i = 0; i < 3; i++) seg(s, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], HEX.ink, 2);
  pts.forEach(([px, py], i) => dot(s, px, py, i === 3 ? 0.34 : 0.26, i === 3 ? C.accent1 : C.text1));
  // 아래: 시기별 상황 변화
  const ry = ay + 0.45 + 2 * lh + 0.55;
  const rows = [
    ["1   위기와 회생", "윤리 원칙 · GE 제휴", "일의 기준이 분명해지고\n리더 권한이 커짐"],
    ["2   브랜드 성장", "흑자 안정", "리더와 직원의 관계가\n좋아짐"],
    ["3   구조조정", "수수료 인하", "실적이 나빠져 리더에게\n불리한 상황"],
    ["4   디지털 전환", "빅테크 경쟁 · 고금리", "해 본 적 없는 새로운\n과업이 늘어남"],
  ];
  T(s, "상황 변화", { x: M, y: ry + 0.2, w: 2.1, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  rows.forEach(([p, c1, c2], i) => {
    const x = ax + i * cw + 0.06, w = cw - 0.12;
    rect(s, { x, y: ry, w, h: 0.5, fill: { color: PHASE[i].fill } });
    T(s, p, { x: x + 0.15, y: ry, w: w - 0.2, h: 0.5, fontSize: 14, bold: true, color: PHASE[i].fg, valign: "middle" });
    T(s, [{ text: c1, options: { bold: true, breakLine: true } }, { text: c2, options: { color: C.text2, fontSize: 13 } }],
      { x: x + 0.15, y: ry + 0.6, w: w - 0.2, h: 1.05, fontSize: 14, valign: "top", paraSpaceAfter: 3 });
  });
  s.addNotes("자료를 찾아보면서 미리 세워 본 가설입니다. 선을 따라가 보시면, 위기 때는 리더가 직접 방향을 정하는 지시적 리더십, 흑자가 난 뒤에는 직원에게 맡기는 참여적이고 후원적인 모습, 구조조정 때는 다시 지시적으로 돌아가고, 디지털 전환기에는 높은 목표를 던지는 성취지향적 리더십이 보일 거라고 예상합니다. 아래는 같은 시기에 상황이 어떻게 바뀌었는지를 Fiedler의 상황변수로 본 것입니다. 이 가설이 맞는지는 보고서에서 자료로 확인하겠습니다.");
}

// =====================================================================
// 평가 방향
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 평가 방향", "잘한 점만큼 아쉬운 점도 같이 평가",
    "출처: 더팩트 「애플페이 도입과 정태영 전략」(2023.3), 한국경제 「현대카드 200여명 희망퇴직」(2019.1), 현대카드 뉴스룸 「금융업계 최초 AI 소프트웨어 수출」");
  const gap = 0.3, cw = (W - gap) / 2, ph = 3.55;
  const cols = [
    ["성과", "+", false, [
      ["업계 하위권에서 이용실적 2위로", "2025년 신용카드 이용실적 점유율 19.3%"],
      ["디자인과 문화로 브랜드 차별화", "the Black, 슈퍼콘서트, 라이브러리"],
      ["금융권 첫 AI 소프트웨어 수출", "AI 플랫폼 ‘유니버스’, 일본 카드사"],
    ]],
    ["한계 · 논란", "−", true, [
      ["창사 첫 희망퇴직", "2018년 수수료 인하 뒤 실적 악화"],
      ["애플페이 수수료 부담 논란", "2023년 국내 첫 도입 당시"],
      ["리더 한 사람에게 기대는 구조", "오너 일가 출신, 23년 장기 재임"],
    ]],
  ];
  cols.forEach(([h, sign, dark, items], ci) => {
    const x = M + ci * (cw + gap);
    rect(s, { x, y: TOP, w: cw, h: ph, fill: { color: dark ? C.text1 : C.background2 } });
    T(s, sign, { x: x + cw - 1.1, y: TOP + 0.05, w: 0.85, h: 0.9, fontSize: 48, bold: true, color: dark ? C.accent1 : HEX.seg4, align: "right", valign: "top" });
    T(s, h, { x: x + 0.4, y: TOP + 0.3, w: cw - 1.6, h: 0.45, fontSize: 18, bold: true, color: dark ? C.accent1 : C.text1, valign: "middle" });
    items.forEach(([t, d], i) => {
      const y = TOP + 0.95 + i * 0.85;
      T(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { color: dark ? HEX.darkSub : C.text2, fontSize: 14 } }],
        { x: x + 0.4, y, w: cw - 0.8, h: 0.8, fontSize: 17, color: dark ? C.background1 : C.text1, valign: "middle", paraSpaceAfter: 3 });
    });
  });
  const cy = TOP + ph + 0.3, chh = 6.55 - cy;
  rect(s, { x: M, y: cy, w: W, h: chh, fill: { color: C.accent1 } });
  T(s, [
    { text: "결론에서는  ", options: { bold: true } },
    { text: "두 관점 중 어느 쪽이 정태영의 23년을 더 잘 설명하는지 판단", options: {} },
  ], { x: M + 0.4, y: cy, w: W - 0.8, h: chh, fontSize: 17, color: C.background1, valign: "middle" });
  s.addNotes("평가할 때는 잘한 점만 늘어놓지 않으려고 합니다. 점유율 2위, 브랜드 차별화, AI 수출 같은 성과가 있지만, 창사 첫 희망퇴직이나 애플페이 수수료 논란, 그리고 리더 한 사람에게 너무 기대는 구조라는 지적도 있습니다. 이걸 다 놓고 결론에서는 처음 질문으로 돌아가, 스스로 바뀐 리더였는지 판을 바꾼 리더였는지 저희 판단을 내리겠습니다.");
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
    ["시기별 사례", [
      "프라임경제, CEO리포트: ‘현대카드스러움’을 만들다",
      "포브스코리아, 성공요인? 윤리경영이 답이다",
      "한국경제, 카드업계 구조조정 칼바람…현대카드 200여명 희망퇴직 (2019.1)",
      "더팩트, ‘나홀로 성장’ 이끈 정태영",
      "더팩트, 애플페이 도입과 정태영 전략 (2023.3)",
      "한경비즈니스, 2024 올해의 CEO: 유니버스 일본 수출",
      "딜사이트, 정태영도 직접 실습…현대카드 AI 내재화 (2026.6)",
      "현대카드 뉴스룸, 현대카드, 금융업계 최초 AI 소프트웨어 수출",
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
    T(s, runs, { x: M + ci * (colW + 0.8), y: TOP - 0.1, w: colW, h: 4.75, fontSize: 12, valign: "top", paraSpaceAfter: 4, lineSpacingMultiple: 1.1 });
  });
  s.addNotes("참고한 자료입니다. 따로 설명하지 않고 넘어가셔도 됩니다.");
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
  s.addNotes("이상으로 저희 조의 계획 발표를 마치겠습니다. 질문 주시면 답변드리겠습니다.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
