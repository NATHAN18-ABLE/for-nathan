// 리더십 팀프로젝트 계획 발표: 현대카드 정태영 부회장
// usage: NODE_PATH=./node_modules node deck.js
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const OUT = "leadership-plan.pptx";
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
const C = pres.SchemeColor;

const SW = 13.333, SH = 7.5, M = 0.75, W = SW - M * 2;
const TOP = 1.95; // 본문 시작선

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "Content",
  background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "label", type: "body", x: M, y: 0.5, w: 9, h: 0.3, fontSize: 12, bold: true, color: C.text2, margin: 0, valign: "middle" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.84, w: W, h: 0.75, fontSize: 28, bold: true, color: C.text1, margin: 0, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "source", type: "body", x: M, y: 6.93, w: 10.6, h: 0.28, fontSize: 10, color: C.text2, margin: 0, valign: "middle" }, text: "" } },
  ],
  slideNumber: { x: SW - M - 0.6, y: 6.93, w: 0.6, h: 0.28, fontSize: 10, color: HEX.grey, align: "right", margin: 0 },
});
pres.defineSlideMaster({
  title: "Dark",
  background: { color: HEX.ink },
  objects: [
    { placeholder: { options: { name: "label", type: "body", x: M, y: 0.7, w: 9, h: 0.3, fontSize: 12, bold: true, color: HEX.darkSub, margin: 0, valign: "middle" }, text: "" } },
  ],
});

// ---------- helpers ----------
let oid = 0;
const T = (s, text, o) => s.addText(text, { margin: 0, isTextBox: true, color: C.text1, objectName: `t${++oid}`, ...o });
const rect = (s, o) => s.addShape(pres.shapes.RECTANGLE, { line: { type: "none" }, objectName: `r${++oid}`, ...o });
const rrect = (s, o) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { line: { type: "none" }, objectName: `rr${++oid}`, ...o });
const hline = (s, x, y, w, color = HEX.rule, width = 0.75) => s.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width }, objectName: `l${++oid}` });
const vline = (s, x, y, h, color = HEX.rule, width = 0.75) => s.addShape(pres.shapes.LINE, { x, y, w: 0, h, line: { color, width }, objectName: `l${++oid}` });
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

function content(label, title, source) {
  const s = pres.addSlide({ masterName: "Content" });
  s.addText(label, { placeholder: "label" });
  s.addText(title, { placeholder: "title" });
  if (source) s.addText(source, { placeholder: "source" });
  return s;
}

// =====================================================================
// 1. 표지
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Dark" });
  s.addText("리더십 · 팀프로젝트 계획 발표", { placeholder: "label" });
  T(s, "스스로 바뀐 리더인가,\n판을 바꾼 리더인가", { x: M, y: 2.0, w: 8.4, h: 1.8, fontSize: 44, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.12 });
  T(s, "현대카드 정태영 부회장 사례분석 계획", { x: M, y: 4.0, w: 8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub, breakLine: true } },
    { text: "2026. 10. 26", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.6, w: 6, h: 1.0, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.95;
  card(s, SW - M - cw, (SH - cw * 1.586) / 2, cw, {
    fill: C.accent1, chip: C.text1,
    lines: [{ text: "JUNG TAE-YOUNG", options: { bold: true, breakLine: true, charSpacing: 1.5 } }, { text: "2003 — 2026", options: { charSpacing: 1.5 } }],
  });
  s.addNotes("안녕하세요, ○조입니다. 저희 조는 현대카드 정태영 부회장을 분석 대상으로 정했습니다. 오늘은 보고서를 어떻게 쓸지, 그 계획을 말씀드리겠습니다.");
}

// =====================================================================
// 2. 목차
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Content" });
  T(s, "목차", { x: M, y: 0.84, w: 3.5, h: 0.75, fontSize: 28, bold: true, valign: "top" });
  T(s, "발표 20분 · 질의응답 15분", { x: M, y: 1.62, w: 3.5, h: 0.3, fontSize: 13, color: C.text2 });
  const items = [
    ["01", "리더 및 선정 배경", "어떤 사람인지, 왜 골랐는지"],
    ["02", "대상 리더 간략 소개", "프로필 · 회사 현황 · 재무 · 주주 구성"],
    ["03", "팀플 보고서 작성 방법", "자료 조사 · 사례분석 틀 · 이론 연계 · 평가 방향"],
  ];
  const x0 = 5.0, w0 = SW - M - x0, y0 = 1.25, rh = 1.55;
  items.forEach(([n, t, d], i) => {
    const y = y0 + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, n, { x: x0, y: y + 0.38, w: 0.8, h: 0.45, fontSize: 18, bold: true, color: C.accent1 });
    T(s, t, { x: x0 + 0.9, y: y + 0.32, w: w0 - 0.9, h: 0.55, fontSize: 26, bold: true });
    T(s, d, { x: x0 + 0.9, y: y + 0.9, w: w0 - 0.9, h: 0.35, fontSize: 15, color: C.text2 });
  });
  s.addNotes("순서는 과제에서 주신 항목 그대로입니다. 리더를 왜 골랐는지, 어떤 사람이고 어떤 회사를 이끄는지 먼저 말씀드리고, 마지막에 보고서를 어떤 틀로 쓸지 가장 자세히 설명드리겠습니다.");
}

// =====================================================================
// 3. 핵심 분석 질문
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Dark" });
  s.addText("저희가 답하려는 질문", { placeholder: "label" });
  T(s, "정태영 부회장은 상황이 바뀔 때마다\n자기 행동을 바꾼 리더일까,\n아니면 상황 자체를 바꾼 리더일까?", {
    x: M, y: 1.55, w: 10.5, h: 2.4, fontSize: 36, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15,
  });
  const bw = (W - 0.6) / 2, by = 4.75;
  [
    ["리더가 바뀌었다면", "House 경로-목표이론", "위기 때와 전환기에 리더 행동이 어떻게 달랐는지 본다"],
    ["상황을 바꿨다면", "Fiedler 상황 모델", "제휴와 원칙으로 일하기 좋은 판을 만들었는지 본다"],
  ].forEach(([k, t, d], i) => {
    const x = M + i * (bw + 0.6);
    hline(s, x, by, bw, HEX.darkRule, 1);
    T(s, k, { x, y: by + 0.25, w: bw, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
    T(s, t, { x, y: by + 0.6, w: bw, h: 0.45, fontSize: 22, bold: true, color: C.background1 });
    T(s, d, { x, y: by + 1.1, w: bw, h: 0.35, fontSize: 15, color: HEX.darkSub });
  });
  s.addNotes("보고서 전체를 이 질문 하나로 끌고 가려고 합니다. 정 부회장이 상황에 맞춰 자기 행동을 바꿨다면 House의 경로-목표이론으로 설명이 되고, 반대로 제휴나 원칙 같은 걸로 상황 자체를 바꿨다면 Fiedler의 상황 모델로 설명이 됩니다. 두 이론 중 어느 쪽이 더 잘 맞는지 비교하는 게 보고서의 목표입니다.");
}

// =====================================================================
// 4. History 타임라인
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "카드대란 한복판에 적자 회사를 맡아 23년째 경영",
    "출처: 비즈니스포스트 「Who Is? 정태영」, 한경비즈니스 「2021 파워 금융인 30」, 프라임경제 「CEO리포트」");
  T(s, [
    { text: "이전 경력   ", options: { bold: true } },
    { text: "1987–2002  현대종합상사 · 현대정공(미주·멕시코 법인장) · 현대모비스 · 기아", options: { color: C.text2 } },
  ], { x: M, y: TOP, w: W, h: 0.35, fontSize: 14, valign: "middle" });

  const events = [
    ["2003", "대표이사 취임\n첫해 6천억대 적자\n현대카드M 출시"],
    ["2005", "초청제 프리미엄\n‘the Black’ 출시\n문화 마케팅 시작"],
    ["2015", "부회장 승진\n‘디지털 현대카드’\n선언"],
    ["2018", "수수료 인하로\n실적 악화\n창사 첫 희망퇴직"],
    ["2023", "애플페이\n국내 첫 도입\n‘전시체제’ 선언"],
    ["2024–26", "AI 플랫폼\n‘유니버스’를\n일본에 수출"],
  ];
  const n = events.length, colW = W / n, lineY = 3.45;
  hline(s, M, lineY, W, HEX.rule, 1);
  events.forEach(([year, desc], i) => {
    const x = M + i * colW, key = i === 0;
    T(s, year, { x, y: lineY - 0.85, w: colW - 0.15, h: 0.55, fontSize: key ? 24 : 20, bold: true, color: key ? C.accent1 : C.text1, valign: "bottom" });
    dot(s, x + (key ? 0.1 : 0.065), lineY, key ? 0.2 : 0.13, key ? C.accent1 : C.text1);
    T(s, desc, { x, y: lineY + 0.25, w: colW - 0.15, h: 1.1, fontSize: 14, valign: "top", lineSpacingMultiple: 1.15 });
  });

  T(s, "분석은 네 시기로 나눠서", { x: M, y: 5.25, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  [["①  위기와 회생", 0, 1], ["②  브랜드 성장", 2, 2], ["③  구조조정", 3, 3], ["④  디지털 전환", 4, 5]].forEach(([label, a, b]) => {
    const x = M + a * colW, w = (b - a + 1) * colW - 0.12;
    rect(s, { x, y: 5.65, w, h: 0.55, fill: { color: C.background2 } });
    T(s, label, { x: x + 0.18, y: 5.65, w: w - 0.2, h: 0.55, fontSize: 14, bold: true, valign: "middle" });
  });
  s.addNotes("정 부회장은 현대차그룹 계열사에서 기획과 해외 사업을 하다가, 카드대란이 한창이던 2003년에 적자 상태인 현대카드를 맡았습니다. 첫해에만 6천억 원대 적자가 났는데, 현대카드M을 내놓으면서 반전의 계기를 만들었습니다. 그 뒤로 프리미엄 카드와 문화 마케팅, 디지털 선언, 희망퇴직, 애플페이, AI 수출까지 이어집니다. 아래 회색 띠처럼 저희는 이 23년을 네 시기로 나눠서 분석할 계획입니다.");
}

// =====================================================================
// 5. 선정 이유
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "상황에 따라 리더십이 어떻게 달라지는지 보기 좋은 사례");
  const lw = 6.3;
  T(s, "01", { x: M, y: TOP + 0.1, w: 1, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
  T(s, "성격이 전혀 다른 네 시기를\n한 사람이 이끌었다", { x: M, y: TOP + 0.6, w: lw, h: 1.3, fontSize: 30, bold: true, valign: "top", lineSpacingMultiple: 1.12 });
  T(s, "위기부터 디지털 전환까지 한 CEO가 다 겪었기 때문에\n시기별로 리더십을 나란히 놓고 비교할 수 있다", { x: M, y: 3.95, w: lw, h: 0.8, fontSize: 15, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  ["위기", "성장", "구조조정", "디지털 전환"].forEach((t, i) => {
    const cw = (lw - 0.45) / 4, x = M + i * (cw + 0.15);
    rect(s, { x, y: 5.1, w: cw, h: 0.55, fill: { color: C.background2 } });
    T(s, t, { x, y: 5.1, w: cw, h: 0.55, fontSize: 14, bold: true, align: "center", valign: "middle" });
  });
  const rx = M + lw + 0.9, rw = SW - M - rx;
  vline(s, rx - 0.45, TOP + 0.1, 3.55);
  [
    ["02", "본인이 직접 한 말이 많다", "SNS와 인터뷰가 많아서 기사 내용과\n본인 설명을 서로 맞춰 볼 수 있다"],
    ["03", "성과만큼 논란도 있다", "업계 2위까지 키웠지만 희망퇴직, 애플페이\n수수료 논란도 있어 한쪽으로 치우치지 않는다"],
  ].forEach(([n, h, b], i) => {
    const y = TOP + 0.1 + i * 1.95;
    if (i > 0) hline(s, rx, y - 0.25, rw);
    T(s, n, { x: rx, y, w: 1, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
    T(s, h, { x: rx, y: y + 0.45, w: rw, h: 0.45, fontSize: 20, bold: true });
    T(s, b, { x: rx, y: y + 0.98, w: rw, h: 0.75, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  });
  s.addNotes("정 부회장을 고른 이유는 세 가지입니다. 가장 큰 이유는 성격이 전혀 다른 네 시기를 한 사람이 이끌었다는 점입니다. 리더가 같으니까 상황만 바뀌었을 때 리더십이 어떻게 달라지는지 비교하기 좋습니다. 또 본인이 SNS나 인터뷰로 직접 설명한 자료가 많고, 성과만큼 논란도 있어서 칭찬만 하는 보고서가 되지 않을 거라고 봤습니다.");
}

// =====================================================================
// 6. 프로필
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 프로필", "전문경영인이자 오너 일가의 사위",
    "출처: 비즈니스포스트 「Who Is? 정태영」, 현대카드 반기보고서 제32기 임원 현황(DART)");
  const cw = 2.75;
  card(s, M, TOP, cw, {
    fill: C.text1, chip: C.accent1, lineSize: 12,
    lines: [{ text: "정태영", options: { bold: true, fontSize: 24, breakLine: true } }, { text: "Ted Chung · 1960", options: { color: HEX.darkSub } }],
  });
  const rows = [
    ["학력", "서울대 불어불문학과, 미국 MIT 경영대학원 MBA"],
    ["현직", "현대카드 · 현대커머셜 대표이사 부회장"],
    ["재임 기간", "2003년 취임, 23년째 (임기 2027년 3월까지)"],
    ["그룹과의 관계", "정몽구 현대차그룹 명예회장의 사위"],
    ["별명", "‘마케팅 천재’, ‘괴짜 경영인’"],
  ];
  const x0 = M + cw + 0.9, w0 = SW - M - x0, rh = 0.86;
  rows.forEach(([k, v], i) => {
    const y = TOP + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, k, { x: x0, y, w: 2.0, h: rh, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
    T(s, v, { x: x0 + 2.1, y, w: w0 - 2.1, h: rh, fontSize: 17, valign: "middle", bold: i === 3 });
  });
  s.addNotes("정 부회장은 1960년생이고, 서울대 불문과를 나와 MIT에서 MBA를 했습니다. 여기서 눈여겨볼 건 정몽구 명예회장의 사위라는 점입니다. 월급 받는 전문경영인이면서 동시에 오너 일가이기도 해서, 이 사람의 영향력이 어디서 나오는지는 6장 권력 부분에서 따로 보려고 합니다.");
}

// =====================================================================
// 7. 회사 개요
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 회사 현황", "현대차그룹 계열 카드사, 회원 1,311만 명",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅰ. 회사의 개요, DART · 회원·직원 수는 2026년 6월 말 기준");
  const stats = [
    ["2001년", "현대카드 출범"],
    ["1,311만 명", "신용카드 회원"],
    ["2,116명", "직원 · 본사 서울 여의도"],
  ];
  const sw = W / 3;
  stats.forEach(([n, l], i) => {
    const x = M + i * sw;
    T(s, n, { x, y: TOP, w: sw - 0.3, h: 0.75, fontSize: 36, bold: true, color: i === 1 ? C.accent1 : C.text1, valign: "bottom" });
    T(s, l, { x, y: TOP + 0.82, w: sw - 0.3, h: 0.35, fontSize: 14, color: C.text2 });
  });
  hline(s, M, 3.75, W);
  T(s, "주요 사업", { x: M, y: 4.0, w: 3, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  const biz = [
    ["자체 브랜드 카드", "현대카드M → 알파벳카드\nthe Black · the Purple"],
    ["PLCC", "2015년 국내 첫 도입\n코스트코 · 대한항공 등"],
    ["카드대출", "카드론, 현금서비스"],
    ["데이터 · AI", "AI 플랫폼 ‘유니버스’\n일본 카드사에 수출"],
  ];
  const bw = W / 4;
  biz.forEach(([t, d], i) => {
    const x = M + i * bw;
    T(s, t, { x, y: 4.45, w: bw - 0.3, h: 0.4, fontSize: 18, bold: true });
    T(s, d, { x, y: 4.95, w: bw - 0.3, h: 1.0, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.2 });
  });
  s.addNotes("현대카드는 다이너스클럽코리아를 현대차그룹이 인수해서 2001년에 이름을 바꾼 회사입니다. 상장은 안 되어 있고, 올해 6월 기준 회원이 1,311만 명 정도 됩니다. 사업은 크게 네 가지인데, 자체 카드, 코스트코나 대한항공처럼 제휴사 이름을 단 PLCC, 카드대출, 그리고 최근에 키우고 있는 데이터와 AI 사업입니다.");
}

// =====================================================================
// 8. 재무정보
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 재무정보", "이익은 늘었고, 이용실적 점유율은 업계 2위",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅲ-1 요약재무정보, DART · 연결 기준 · 점유율은 금감원 신용카드 이용실적으로 계산");
  const stats = [
    ["4조 78억원", "2025년 영업수익", false],
    ["3,503억원", "2025년 당기순이익 · 1년 전보다 10.7% 증가", false],
    ["19.3%", "2025년 이용실적 점유율 2위 (1위 신한 19.8%)", true],
  ];
  stats.forEach(([num, label, hi], i) => {
    const y = TOP + i * 1.5;
    T(s, num, { x: M, y, w: 4.6, h: 0.75, fontSize: 36, bold: true, color: hi ? C.accent1 : C.text1, valign: "bottom" });
    T(s, label, { x: M, y: y + 0.8, w: 4.8, h: 0.35, fontSize: 14, color: C.text2, valign: "top" });
  });
  const cx = 6.0, cw = SW - M - cx;
  T(s, "영업이익 · 당기순이익 (억원)", { x: cx, y: TOP, w: cw, h: 0.35, fontSize: 14, bold: true });
  s.addChart(pres.charts.BAR, [
    { name: "2024년", labels: ["영업이익", "당기순이익"], values: [4061, 3164] },
    { name: "2025년", labels: ["영업이익", "당기순이익"], values: [4393, 3503] },
  ], {
    x: cx, y: TOP + 0.4, w: cw, h: 3.05, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
    chartColors: ["C4C4C4", HEX.accent],
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0", dataLabelFontSize: 12, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
    showLegend: true, legendPos: "t", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.grey,
    catAxisLabelFontSize: 13, catAxisLabelFontFace: "+mn-lt", catAxisLabelColor: HEX.ink, catAxisLineShow: true, catAxisLineColor: HEX.rule,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, valAxisMinVal: 0, valAxisMaxVal: 5200,
    objectName: "chart-profit",
  });
  rect(s, { x: cx, y: 5.65, w: cw, h: 0.9, fill: { color: C.background2 } });
  T(s, [
    { text: "2026년 상반기", options: { bold: true, breakLine: true } },
    { text: "영업수익 2조 3,372억 · 영업이익 2,495억 · 순이익 1,852억", options: { color: C.text2 } },
  ], { x: cx + 0.25, y: 5.65, w: cw - 0.4, h: 0.9, fontSize: 14, valign: "middle", paraSpaceAfter: 2 });
  s.addNotes("작년 영업수익은 4조 78억 원이고, 순이익은 3,503억 원으로 1년 전보다 10.7% 늘었습니다. 카드 이용실적 점유율은 19.3%로, 신한카드 바로 다음인 업계 2위입니다. 2003년에 적자 회사였다는 걸 생각하면 꽤 큰 변화입니다. 올해 상반기 숫자는 기간이 달라서 아래에 따로 적었습니다.");
}

// =====================================================================
// 9. 주주 구성
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
  const by = TOP + 0.1, bh = 0.95;
  let x = M;
  segs.forEach(([name, pct, fill, fg]) => {
    const w = W * pct / 100;
    rect(s, { x, y: by, w: w - 0.03, h: bh, fill: { color: fill } });
    if (pct > 15) T(s, `${pct.toFixed(2)}%`, { x: x + 0.2, y: by, w: w - 0.3, h: bh, fontSize: 20, bold: true, color: fg, valign: "middle" });
    x += w;
  });
  const lw = W / 5;
  segs.forEach(([name, pct, fill], i) => {
    const lx = M + i * lw;
    rect(s, { x: lx, y: by + bh + 0.32, w: 0.16, h: 0.16, fill: { color: fill } });
    T(s, [{ text: name, options: { bold: true, breakLine: true } }, { text: `${pct.toFixed(2)}%`, options: { color: C.text2 } }],
      { x: lx + 0.28, y: by + bh + 0.24, w: lw - 0.35, h: 0.65, fontSize: 14, valign: "top", paraSpaceAfter: 2 });
  });
  hline(s, M, 4.45, W);
  const fy = 4.85, fh = 0.9, fw = 2.3;
  const flow = [["정태영 · 정명이 부부", C.background2, C.text1], ["현대커머셜", C.accent1, C.background1], ["현대카드", C.text1, C.background1]];
  flow.forEach(([t, fill, fg], i) => {
    const fx = M + i * (fw + 1.05);
    rect(s, { x: fx, y: fy, w: fw, h: fh, fill: { color: fill } });
    T(s, t, { x: fx, y: fy, w: fw, h: fh, fontSize: 16, bold: true, color: fg, align: "center", valign: "middle" });
    if (i < 2) {
      s.addShape(pres.shapes.LINE, { x: fx + fw + 0.15, y: fy + fh / 2, w: 0.75, h: 0, line: { color: HEX.grey, width: 1.25, endArrowType: "triangle" }, objectName: `arrow${i}` });
      T(s, i === 0 ? "대주주" : "34.62%", { x: fx + fw, y: fy + fh / 2 - 0.42, w: 1.05, h: 0.3, fontSize: 12, color: C.text2, align: "center" });
    }
  });
  const nx = M + 3 * fw + 2 * 1.05 + 0.6;
  T(s, [
    { text: "현대차그룹 계열 합계", options: { color: C.text2, breakLine: true } },
    { text: "78.06%", options: { bold: true, fontSize: 24 } },
  ], { x: nx, y: fy - 0.05, w: SW - M - nx, h: 1.0, fontSize: 14, valign: "middle" });
  s.addNotes("주주를 보면 현대자동차가 1대 주주, 현대커머셜이 2대 주주입니다. 재미있는 건 정 부회장 본인은 현대카드 주식이 한 주도 없다는 점입니다. 대신 부부가 대주주인 현대커머셜이 현대카드 지분의 34.62%를 갖고 있어서, 간접적으로 영향력을 가집니다. 지분보다는 직위와 관계에서 나오는 힘이라서, 이 부분도 권력 이론으로 연결해 볼 생각입니다.");
}

// =====================================================================
// 10. 자료 조사 방법
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 자료 조사", "숫자는 공시로, 리더의 생각은 인터뷰로 확인");
  const head = ["자료", "어디서 찾나", "무엇을 확인하나"];
  const cols = [M, M + 2.3, M + 7.2], widths = [2.1, 4.7, W - 6.45];
  head.forEach((h, j) => T(s, h, { x: cols[j], y: TOP, w: widths[j], h: 0.45, fontSize: 13, bold: true, color: C.text2, valign: "middle" }));
  hline(s, M, TOP + 0.5, W, HEX.ink, 1.25);
  const rows = [
    ["공시", "금융감독원 DART\n사업보고서 · 반기보고서", "매출과 이익, 주주 구성,\n임원 현황"],
    ["회사 자료", "현대카드 IR 자료,\n현대카드 · 현대커머셜 뉴스룸", "사업 전략, 시기별 주요 발표"],
    ["언론 · 인터뷰", "경제지 기사, 맥킨지 인터뷰(2025),\n정 부회장 SNS", "리더 본인이 설명한\n판단 이유와 경영 방침"],
    ["논문 · 서적", "RISS · DBpia의\n현대카드 사례 연구", "앞선 연구가 쓴 분석 틀,\n이론 적용 방식"],
  ];
  const rh = 1.05;
  rows.forEach((r, i) => {
    const y = TOP + 0.5 + i * rh;
    if (i > 0) hline(s, M, y, W);
    r.forEach((c, j) => T(s, c, {
      x: cols[j], y, w: widths[j], h: rh, valign: "middle", lineSpacingMultiple: 1.15,
      fontSize: j === 0 ? 17 : 15, bold: j === 0, color: j === 2 ? C.text2 : C.text1,
    }));
  });
  hline(s, M, TOP + 0.5 + 4 * rh, W);
  s.addNotes("자료는 네 군데서 모읍니다. 매출이나 지분 같은 숫자는 DART 공시를 기준으로 하고, 회사가 직접 낸 IR 자료와 뉴스룸으로 시기별 발표를 확인합니다. 리더가 왜 그런 결정을 했는지는 인터뷰와 본인 SNS에서 찾고, 논문은 앞선 연구가 현대카드를 어떤 틀로 분석했는지 참고하려고 합니다.");
}

// =====================================================================
// 11. 사례분석 프레임워크
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
    ["①  위기와 회생", "2003–2007", "카드대란, 대규모 적자", "현대카드M 출시\n윤리 원칙 수립\nGE와의 제휴"],
    ["②  브랜드 성장", "2008–2017", "흑자 안정, 차별화 경쟁", "문화 마케팅\n자율적인 조직문화\n디지털 전환 선언"],
    ["③  구조조정", "2018–2021", "수수료 인하, 실적 악화", "창사 첫 희망퇴직\n코스트코 제휴\n데이터 투자"],
    ["④  디지털 전환", "2022–현재", "고금리, 빅테크와의 경쟁", "리스크 관리 강화\n애플페이 도입\nAI 플랫폼 수출"],
  ];
  const lx = M, lw = 1.5, gx = M + lw, gw = (W - lw) / 4, y0 = 2.85;
  hline(s, M, y0, W, HEX.ink, 1.25);
  T(s, "시기", { x: lx, y: y0 + 0.12, w: lw, h: 0.75, fontSize: 13, bold: true, color: C.text2, valign: "top" });
  T(s, "상황", { x: lx, y: y0 + 1.0, w: lw, h: 0.6, fontSize: 13, bold: true, color: C.text2, valign: "middle" });
  T(s, "분석할 사례", { x: lx, y: y0 + 1.75, w: lw, h: 1.2, fontSize: 13, bold: true, color: C.text2, valign: "top" });
  hline(s, M, y0 + 0.95, W);
  hline(s, M, y0 + 1.65, W);
  periods.forEach(([p, yr, sit, cases], i) => {
    const x = gx + i * gw + 0.15;
    T(s, [{ text: p, options: { bold: true, breakLine: true } }, { text: yr, options: { color: C.text2, fontSize: 13 } }],
      { x, y: y0 + 0.12, w: gw - 0.25, h: 0.75, fontSize: 16, valign: "top", paraSpaceAfter: 2 });
    T(s, sit, { x, y: y0 + 1.0, w: gw - 0.25, h: 0.6, fontSize: 14, valign: "middle" });
    T(s, cases, { x, y: y0 + 1.8, w: gw - 0.25, h: 1.3, fontSize: 14, valign: "top", lineSpacingMultiple: 1.25 });
  });
  hline(s, M, 6.15, W);
  s.addNotes("보고서 본론은 이 표대로 갑니다. 네 시기마다 어떤 상황이었는지, 리더가 뭘 했는지, 결과가 어땠는지, 아쉬운 점은 뭐였는지를 같은 순서로 봅니다. 순서를 똑같이 맞춰야 시기끼리 비교가 되기 때문입니다. 그중에서도 가운데 빨간색, 리더의 행동이 저희 질문과 바로 이어지는 부분이라 가장 자세히 다룰 예정입니다.");
}

// =====================================================================
// 12. 이론 연계
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 이론과의 연계성", "4장의 두 이론이 중심, 나머지 네 이론은 보조",
    "이론 출처: 리더십 강의자료 2장 특성이론, 3장 행동이론과 동기부여, 4장 리더십 상황이론, 5장 갈등관리, 6장 권력·협상");
  const main = [
    ["리더 행동의 변화", "House 경로-목표이론", "4장", "위기 때는 지시적, 전환기에는\n성취지향적 리더십을 보였을까"],
    ["조직 상황의 변화", "Fiedler 상황 모델", "4장", "GE 제휴와 윤리 원칙이\n과업구조와 직위권력을 바꿨을까"],
  ];
  const gap = 0.5, bw = (W - gap) / 2, bh = 2.05;
  main.forEach(([k, t, ch, q], i) => {
    const x = M + i * (bw + gap);
    rect(s, { x, y: TOP, w: bw, h: bh, fill: { color: C.background2 } });
    T(s, k, { x: x + 0.4, y: TOP + 0.3, w: bw - 0.8, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
    T(s, [{ text: t, options: { bold: true } }, { text: `   ${ch}`, options: { color: C.text2, fontSize: 14 } }],
      { x: x + 0.4, y: TOP + 0.65, w: bw - 0.8, h: 0.45, fontSize: 22, valign: "middle" });
    T(s, q, { x: x + 0.4, y: TOP + 1.2, w: bw - 0.8, h: 0.75, fontSize: 15, valign: "top", lineSpacingMultiple: 1.2 });
  });
  const sub = [
    ["특성이론", "2장", "개방성과 위험 감수 성향이\n결정에 드러났나"],
    ["행동이론", "3장", "구조주도(원칙 · 디자인)와\n배려가 함께 보였나"],
    ["갈등관리", "5장", "희망퇴직과 노조 면담 때\n어떤 방식으로 대응했나"],
    ["권력 · 협상", "6장", "직위와 관계에서 나온 힘,\n애플페이 협상"],
  ];
  const sy = 4.4, sw = W / 4;
  hline(s, M, sy, W);
  sub.forEach(([t, ch, q], i) => {
    const x = M + i * sw;
    T(s, [{ text: t, options: { bold: true } }, { text: `  ${ch}`, options: { color: C.text2, fontSize: 13 } }],
      { x, y: sy + 0.3, w: sw - 0.3, h: 0.4, fontSize: 17, valign: "middle" });
    T(s, q, { x, y: sy + 0.8, w: sw - 0.35, h: 1.2, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  });
  s.addNotes("이론은 수업 4장에서 배운 두 가지가 중심입니다. 리더의 행동이 바뀌었는지는 House의 경로-목표이론으로, 상황이 바뀌었는지는 Fiedler의 상황 모델로 봅니다. 여기에 2장 특성이론, 3장 행동이론, 5장 갈등관리, 6장 권력과 협상을 보조로 써서, 리더 개인의 성향이나 영향력이 어디서 나오는지도 함께 보겠습니다.");
}

// =====================================================================
// 13. 시기별 예상
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 시기별 예상", "시기마다 이런 모습이 나올 것으로 예상",
    "리더 행동 유형: House 경로-목표이론의 지시적 · 후원적 · 참여적 · 성취지향적 리더십 · 상황변수: Fiedler의 리더-부하 관계 · 과업구조 · 직위권력");
  T(s, "보고서에서 맞는지 확인할 가설", { x: SW - M - 5, y: 0.5, w: 5, h: 0.3, fontSize: 12, bold: true, color: C.accent1, align: "right", valign: "middle" });
  const cols = [M, M + 2.75, M + 7.45], widths = [2.55, 4.5, W - 6.7];
  ["시기", "리더 행동  ·  경로-목표이론", "상황 변화  ·  Fiedler 상황 모델"].forEach((h, j) =>
    T(s, h, { x: cols[j], y: TOP, w: widths[j], h: 0.45, fontSize: 13, bold: true, color: C.text2, valign: "middle" }));
  hline(s, M, TOP + 0.5, W, HEX.ink, 1.25);
  const rows = [
    ["①  위기와 회생", "지시적", "목표와 방법을 리더가 직접 정해 줌", "윤리 원칙 · GE 제휴", "일의 기준이 분명해지고 리더 권한이 커짐"],
    ["②  브랜드 성장", "참여적 · 후원적", "직원 자율에 맡기고 아이디어를 받음", "흑자 안정", "리더와 직원의 관계가 좋아짐"],
    ["③  구조조정", "다시 지시적", "희망퇴직 같은 어려운 결정을 직접 주도", "수수료 인하 · 실적 악화", "리더에게 불리한 상황으로 바뀜"],
    ["④  디지털 전환", "성취지향적", "AI 수출처럼 높은 목표를 제시", "빅테크 경쟁 · 고금리", "해 본 적 없는 새로운 과업이 늘어남"],
  ];
  const rh = 1.0;
  rows.forEach(([p, b1, b2, c1, c2], i) => {
    const y = TOP + 0.5 + i * rh;
    if (i > 0) hline(s, M, y, W);
    T(s, p, { x: cols[0], y, w: widths[0], h: rh, fontSize: 16, bold: true, valign: "middle" });
    T(s, [{ text: b1, options: { bold: true, breakLine: true } }, { text: b2, options: { color: C.text2, fontSize: 14 } }],
      { x: cols[1], y, w: widths[1], h: rh, fontSize: 17, valign: "middle", paraSpaceAfter: 3 });
    T(s, [{ text: c1, options: { bold: true, breakLine: true } }, { text: c2, options: { color: C.text2, fontSize: 14 } }],
      { x: cols[2], y, w: widths[2], h: rh, fontSize: 17, valign: "middle", paraSpaceAfter: 3 });
  });
  hline(s, M, TOP + 0.5 + 4 * rh, W);
  s.addNotes("자료를 찾아보면서 미리 세워 본 가설입니다. 위기 때는 리더가 직접 방향을 정하는 지시적 리더십이, 흑자가 난 뒤에는 직원에게 맡기는 참여적이고 후원적인 모습이 나왔을 것 같습니다. 구조조정 때는 다시 지시적으로 돌아가고, 디지털 전환기에는 높은 목표를 던지는 성취지향적 리더십이 보일 거라고 예상합니다. 오른쪽은 같은 시기에 상황이 어떻게 바뀌었는지를 Fiedler의 상황변수로 본 것입니다. 이 가설이 맞는지는 보고서에서 자료로 확인하겠습니다.");
}

// =====================================================================
// 14. 평가 방향
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 평가 방향", "잘한 점만큼 아쉬운 점도 같이 평가",
    "출처: 더팩트 「애플페이 도입과 정태영 전략」(2023.3), 한국경제 「현대카드 200여명 희망퇴직」(2019.1), 현대카드 뉴스룸 「금융업계 최초 AI 소프트웨어 수출」");
  const gap = 0.6, cw = (W - gap) / 2;
  const cols = [
    ["성과", C.text1, [
      ["업계 하위권에서 이용실적 2위로", "2025년 신용카드 이용실적 점유율 19.3%"],
      ["디자인과 문화로 브랜드 차별화", "the Black, 슈퍼콘서트, 라이브러리"],
      ["금융권 첫 AI 소프트웨어 수출", "AI 플랫폼 ‘유니버스’, 일본 카드사"],
    ]],
    ["한계 · 논란", C.accent1, [
      ["창사 첫 희망퇴직", "2018년 수수료 인하 뒤 실적 악화"],
      ["애플페이 수수료 부담 논란", "2023년 국내 첫 도입 당시"],
      ["리더 한 사람에게 기대는 구조", "오너 일가 출신, 23년 장기 재임"],
    ]],
  ];
  cols.forEach(([h, hc, items], ci) => {
    const x = M + ci * (cw + gap);
    T(s, h, { x, y: TOP, w: cw, h: 0.45, fontSize: 18, bold: true, color: hc, valign: "middle" });
    hline(s, x, TOP + 0.55, cw, HEX.ink, 1.25);
    items.forEach(([t, d], i) => {
      const y = TOP + 0.55 + i * 0.95;
      if (i > 0) hline(s, x, y, cw);
      T(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { color: C.text2, fontSize: 14 } }],
        { x, y, w: cw, h: 0.95, fontSize: 17, valign: "middle", paraSpaceAfter: 3 });
    });
  });
  rect(s, { x: M, y: 5.6, w: W, h: 0.85, fill: { color: C.background2 } });
  T(s, [
    { text: "결론에서는  ", options: { bold: true } },
    { text: "두 관점 중 어느 쪽이 정태영의 23년을 더 잘 설명하는지 판단", options: {} },
  ], { x: M + 0.35, y: 5.6, w: W - 0.7, h: 0.85, fontSize: 16, valign: "middle" });
  s.addNotes("평가할 때는 잘한 점만 늘어놓지 않으려고 합니다. 점유율 2위, 브랜드 차별화, AI 수출 같은 성과가 있지만, 창사 첫 희망퇴직이나 애플페이 수수료 논란, 그리고 리더 한 사람에게 너무 기대는 구조라는 지적도 있습니다. 이걸 다 놓고 결론에서는 처음 질문으로 돌아가, 스스로 바뀐 리더였는지 판을 바꾼 리더였는지 저희 판단을 내리겠습니다.");
}

// =====================================================================
// 15. 참고자료
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
    ["이론", [
      "리더십 강의자료 2장 – 6장",
    ]],
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
// 16. 마무리
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Dark" });
  T(s, "감사합니다", { x: M, y: 2.55, w: 8, h: 0.9, fontSize: 44, bold: true, color: C.background1, valign: "middle" });
  T(s, "질문 받겠습니다", { x: M, y: 3.5, w: 8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.9, w: 6, h: 0.7, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.95;
  card(s, SW - M - cw, (SH - cw * 1.586) / 2, cw, { fill: "262626", chip: C.accent1 });
  s.addNotes("이상으로 저희 조의 계획 발표를 마치겠습니다. 질문 주시면 답변드리겠습니다.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
