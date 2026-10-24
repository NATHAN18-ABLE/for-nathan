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
  T(s, "자신을 바꾼 리더인가,\n상황을 바꾼 리더인가", { x: M, y: 2.0, w: 8.4, h: 1.8, fontSize: 44, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.12 });
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
  s.addNotes("안녕하세요, ○조입니다. 저희는 현대카드 정태영 부회장을 대상으로 리더십 사례분석을 진행하려고 합니다. 오늘은 그 계획을 과제 항목 다섯 가지 순서로 말씀드리겠습니다.");
}

// =====================================================================
// 2. 목차
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Content" });
  T(s, "목차", { x: M, y: 0.84, w: 3.5, h: 0.75, fontSize: 28, bold: true, valign: "top" });
  T(s, "발표 20분 · 질의응답 15분", { x: M, y: 1.62, w: 3.5, h: 0.3, fontSize: 13, color: C.text2 });
  const items = [
    ["01", "리더 및 선정 배경", "History · 선정 이유"],
    ["02", "대상 리더 간략 소개", "프로필 · 회사 현황 · 재무 · 주주 구성"],
    ["03", "팀플 보고서 작성 방법", "자료 조사 · 사례분석 프레임워크 · 이론 연계"],
    ["04", "조원 현황 및 역할 배분", "조원별 R&R"],
    ["05", "팀플 추진 일정", "11월 30일 최종 발표까지 주차별 계획"],
  ];
  const x0 = 5.0, w0 = SW - M - x0, y0 = 0.95, rh = 1.08;
  items.forEach(([n, t, d], i) => {
    const y = y0 + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, n, { x: x0, y: y + 0.24, w: 0.8, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
    T(s, t, { x: x0 + 0.85, y: y + 0.2, w: w0 - 0.85, h: 0.45, fontSize: 22, bold: true });
    T(s, d, { x: x0 + 0.85, y: y + 0.64, w: w0 - 0.85, h: 0.3, fontSize: 13, color: C.text2 });
  });
  s.addNotes("발표는 과제에서 요청한 다섯 항목 순서대로 진행합니다. 3번 보고서 작성 방법에서 저희 분석 틀을 가장 자세히 말씀드리겠습니다.");
}

// =====================================================================
// 3. 핵심 분석 질문
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Dark" });
  s.addText("핵심 분석 질문", { placeholder: "label" });
  T(s, "정태영 부회장은 상황이 바뀔 때마다\n자신의 행동을 바꾼 리더인가,\n조직의 상황을 바꾼 리더인가?", {
    x: M, y: 1.55, w: 10.5, h: 2.4, fontSize: 36, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15,
  });
  const bw = (W - 0.6) / 2, by = 4.75;
  [
    ["관점 1 · 리더의 행동", "House 경로-목표이론", "위기와 전환기마다 리더의 행동 유형이 달라졌는가"],
    ["관점 2 · 조직의 상황", "Fiedler 상황 모델", "제휴와 원칙으로 리더에게 유리한 상황을 만들었는가"],
  ].forEach(([k, t, d], i) => {
    const x = M + i * (bw + 0.6);
    hline(s, x, by, bw, HEX.darkRule, 1);
    T(s, k, { x, y: by + 0.25, w: bw, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
    T(s, t, { x, y: by + 0.6, w: bw, h: 0.45, fontSize: 22, bold: true, color: C.background1 });
    T(s, d, { x, y: by + 1.1, w: bw, h: 0.35, fontSize: 15, color: HEX.darkSub });
  });
  s.addNotes("저희 보고서는 이 질문 하나를 중심으로 진행합니다. 리더가 스스로 행동을 바꿨다면 House의 경로-목표이론으로, 리더가 조직의 상황 자체를 바꿨다면 Fiedler의 상황 모델로 설명하고, 두 관점을 비교하려고 합니다.");
}

// =====================================================================
// 4. History 타임라인
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "카드대란 속 적자 회사를 맡아 23년째 이끄는 중",
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

  T(s, "보고서에서 나눠 볼 네 시기", { x: M, y: 5.25, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  [["①  위기와 회생", 0, 1], ["②  브랜드 성장", 2, 2], ["③  구조조정", 3, 3], ["④  디지털 전환", 4, 5]].forEach(([label, a, b]) => {
    const x = M + a * colW, w = (b - a + 1) * colW - 0.12;
    rect(s, { x, y: 5.65, w, h: 0.55, fill: { color: C.background2 } });
    T(s, label, { x: x + 0.18, y: 5.65, w: w - 0.2, h: 0.55, fontSize: 14, bold: true, valign: "middle" });
  });
  s.addNotes("정태영 부회장은 현대차그룹 계열사에서 기획과 해외 사업을 맡다가, 카드대란이 한창이던 2003년 적자 상태의 현대카드를 맡았습니다. 이후 23년 동안 위기, 성장, 구조조정, 디지털 전환이라는 성격이 다른 네 시기를 지나왔고, 아래 회색 띠가 저희가 사례를 나눠 볼 네 시기입니다.");
}

// =====================================================================
// 5. 선정 이유
// =====================================================================
{
  const s = content("01  리더 및 선정 배경", "상황별 리더십을 비교하기에 좋은 대상이라 선정");
  // 가장 중요한 이유 하나를 크게, 나머지 둘은 오른쪽에 작게
  const lw = 6.3;
  T(s, "01", { x: M, y: TOP + 0.1, w: 1, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
  T(s, "성격이 다른 네 국면을\n한 사람이 이끌었다", { x: M, y: TOP + 0.6, w: lw, h: 1.3, fontSize: 30, bold: true, valign: "top", lineSpacingMultiple: 1.12 });
  T(s, "23년 동안 한 리더가 겪은 서로 다른 상황을 비교하면\n상황에 따라 리더십이 어떻게 달라지는지 볼 수 있음", { x: M, y: 3.95, w: lw, h: 0.8, fontSize: 15, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  ["위기", "성장", "구조조정", "디지털 전환"].forEach((t, i) => {
    const cw = (lw - 0.45) / 4, x = M + i * (cw + 0.15);
    rect(s, { x, y: 5.1, w: cw, h: 0.55, fill: { color: C.background2 } });
    T(s, t, { x, y: 5.1, w: cw, h: 0.55, fontSize: 14, bold: true, align: "center", valign: "middle" });
  });
  const rx = M + lw + 0.9, rw = SW - M - rx;
  vline(s, rx - 0.45, TOP + 0.1, 3.55);
  [
    ["02", "리더 본인의 말로 확인할 수 있다", "SNS와 국내외 인터뷰가 많아 기사와\n본인의 설명을 함께 검토할 수 있음"],
    ["03", "성과와 논란이 함께 있다", "업계 2위로 성장했지만 희망퇴직, 애플페이\n수수료 논란도 있어 균형 있는 평가가 가능함"],
  ].forEach(([n, h, b], i) => {
    const y = TOP + 0.1 + i * 1.95;
    if (i > 0) hline(s, rx, y - 0.25, rw);
    T(s, n, { x: rx, y, w: 1, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
    T(s, h, { x: rx, y: y + 0.45, w: rw, h: 0.45, fontSize: 20, bold: true });
    T(s, b, { x: rx, y: y + 0.98, w: rw, h: 0.75, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  });
  s.addNotes("선정 이유는 세 가지입니다. 첫째, 성격이 다른 네 국면을 한 사람이 이끌어 상황별 비교가 가능합니다. 둘째, 본인이 SNS와 인터뷰로 직접 설명한 자료가 많습니다. 셋째, 성과와 논란이 함께 있어 성공 사례로만이 아니라 균형 있게 평가할 수 있습니다.");
}

// =====================================================================
// 6. 프로필
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 프로필", "전문경영인이면서 오너 일가인 독특한 위치",
    "출처: 비즈니스포스트 「Who Is? 정태영」, 현대카드 반기보고서 제32기 임원 현황(DART)");
  const cw = 2.75;
  card(s, M, TOP, cw, {
    fill: C.text1, chip: C.accent1, lineSize: 12,
    lines: [{ text: "정태영", options: { bold: true, fontSize: 24, breakLine: true } }, { text: "Ted Chung · 1960", options: { color: HEX.darkSub } }],
  });
  const rows = [
    ["학력", "서울대 불어불문학과, 미국 MIT 경영대학원 MBA"],
    ["현직", "현대카드 · 현대커머셜 대표이사 부회장"],
    ["재임 기간", "2003년 취임 이후 23년째 (현 임기 2027년 3월까지)"],
    ["그룹과의 관계", "정몽구 현대차그룹 명예회장의 사위"],
    ["별칭", "‘마케팅 천재’, ‘괴짜 경영인’"],
  ];
  const x0 = M + cw + 0.9, w0 = SW - M - x0, rh = 0.86;
  rows.forEach(([k, v], i) => {
    const y = TOP + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, k, { x: x0, y, w: 2.0, h: rh, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
    T(s, v, { x: x0 + 2.1, y, w: w0 - 2.1, h: rh, fontSize: 17, valign: "middle", bold: i === 3 });
  });
  s.addNotes("정태영 부회장은 1960년생으로 서울대 불문과와 MIT 경영대학원을 나왔습니다. 정몽구 명예회장의 사위라는 점에서 전문경영인이면서 동시에 오너 일가라는 독특한 위치에 있고, 이 점은 6장 권력 이론과 연결해 볼 계획입니다.");
}

// =====================================================================
// 7. 회사 개요
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 회사 현황", "현대차그룹 계열의 비상장 카드사, 회원 1,311만 명",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅰ. 회사의 개요, DART · 회원·직원 수는 2026년 6월 말 기준");
  const stats = [
    ["2001년", "현대카드 출범"],
    ["1,311만 명", "신용카드 회원 수"],
    ["2,116명", "직원 수 · 본사 서울 여의도"],
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
  s.addNotes("현대카드는 1984년 설립된 다이너스클럽코리아를 현대차그룹이 인수해 2001년 이름을 바꾼 비상장 카드사입니다. 2026년 6월 기준 회원은 약 1,311만 명입니다. 사업은 자체 카드, 제휴사 이름을 단 PLCC, 카드대출, 그리고 최근 데이터와 AI 사업으로 나뉩니다.");
}

// =====================================================================
// 8. 재무정보
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 재무정보", "영업이익·순이익 모두 늘었고, 이용실적 점유율은 업계 2위",
    "출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅲ-1 요약재무정보, DART · 연결 기준 · 점유율은 금감원 신용카드 이용실적으로 계산");
  const stats = [
    ["4조 78억원", "2025년 영업수익", false],
    ["3,503억원", "2025년 당기순이익 · 전년 대비 +10.7%", false],
    ["19.3%", "2025년 이용실적 점유율 2위 (1위 신한 19.8%)", true],
  ];
  stats.forEach(([num, label, hi], i) => {
    const y = TOP + i * 1.5;
    T(s, num, { x: M, y, w: 4.6, h: 0.75, fontSize: 36, bold: true, color: hi ? C.accent1 : C.text1, valign: "bottom" });
    T(s, label, { x: M, y: y + 0.8, w: 4.6, h: 0.35, fontSize: 14, color: C.text2, valign: "top" });
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
  s.addNotes("2025년 영업수익은 4조 78억 원, 순이익은 3,503억 원으로 전년보다 10.7% 늘었습니다. 신용카드 이용실적 점유율은 19.3%로 신한카드에 이어 업계 2위입니다. 올해 상반기 실적은 기간이 달라 차트와 따로 표시했습니다.");
}

// =====================================================================
// 9. 주주 구성
// =====================================================================
{
  const s = content("02  대상 리더 간략 소개 · 기업 현황", "정 부회장의 직접 지분은 없고, 현대커머셜을 통해 영향력 행사",
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
  // 범례
  const lw = W / 5;
  segs.forEach(([name, pct, fill], i) => {
    const lx = M + i * lw;
    rect(s, { x: lx, y: by + bh + 0.32, w: 0.16, h: 0.16, fill: { color: fill } });
    T(s, [{ text: name, options: { bold: true, breakLine: true } }, { text: `${pct.toFixed(2)}%`, options: { color: C.text2 } }],
      { x: lx + 0.28, y: by + bh + 0.24, w: lw - 0.35, h: 0.65, fontSize: 14, valign: "top", paraSpaceAfter: 2 });
  });
  hline(s, M, 4.45, W);
  // 영향력 경로
  const fy = 4.85, fh = 0.9, fw = 2.3;
  const flow = [["정태영 · 정명이 부부", C.background2, C.text1], ["현대커머셜", C.accent1, C.background1], ["현대카드", C.text1, C.background1]];
  flow.forEach(([t, fill, fg], i) => {
    const fx = M + i * (fw + 1.05);
    rect(s, { x: fx, y: fy, w: fw, h: fh, fill: { color: fill } });
    T(s, t, { x: fx, y: fy, w: fw, h: fh, fontSize: 17, bold: true, color: fg, align: "center", valign: "middle" });
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
  s.addNotes("최대주주는 현대자동차, 2대 주주는 현대커머셜입니다. 정 부회장은 현대카드 지분을 직접 갖고 있지 않지만, 부부가 대주주인 현대커머셜을 통해 간접적으로 영향력을 갖습니다. 지분이 아닌 직위와 관계에서 나오는 권력이라는 점을 6장 권력 이론으로 분석하겠습니다.");
}

// =====================================================================
// 10. 자료 조사 방법
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 자료 조사", "공시로 수치를, 인터뷰로 리더의 생각을 확인");
  const src = [
    ["공시", "금융감독원 DART 사업 · 반기보고서", "재무, 주주, 임원 정보"],
    ["회사 자료", "현대카드 IR 자료, 뉴스룸", "실적 발표, 사업 전략"],
    ["언론 · 인터뷰", "경제지 기사, 맥킨지 인터뷰(2025), 정 부회장 SNS", "리더 본인의 설명"],
    ["논문 · 서적", "RISS · DBpia 현대카드 사례 연구", "선행 분석과 이론 적용 사례"],
  ];
  const lw = 7.0, rh = 1.08;
  src.forEach(([k, v, u], i) => {
    const y = TOP + i * rh;
    if (i > 0) hline(s, M, y, lw);
    T(s, k, { x: M, y, w: 1.8, h: rh, fontSize: 16, bold: true, valign: "middle" });
    T(s, [{ text: v, options: { breakLine: true } }, { text: u, options: { color: C.text2, fontSize: 13 } }],
      { x: M + 1.9, y, w: lw - 1.9, h: rh, fontSize: 15, valign: "middle", paraSpaceAfter: 3 });
  });
  const rx = M + lw + 0.6, rw = SW - M - rx, rh2 = 4.32;
  rect(s, { x: rx, y: TOP, w: rw, h: rh2, fill: { color: C.background2 } });
  T(s, "AI 활용 원칙", { x: rx + 0.4, y: TOP + 0.35, w: rw - 0.8, h: 0.4, fontSize: 18, bold: true });
  const steps = [["자료 요약 · 이론 연결 초안", false], ["예상 질문 정리", false], ["수치 · 인용은 원문 재확인", true]];
  steps.forEach(([t, hi], i) => {
    const y = TOP + 1.05 + i * 0.95;
    T(s, `${i + 1}`, { x: rx + 0.4, y, w: 0.4, h: 0.4, fontSize: 18, bold: true, color: hi ? C.accent1 : C.text2 });
    T(s, t, { x: rx + 0.85, y, w: rw - 1.25, h: 0.7, fontSize: 16, bold: hi, color: hi ? C.accent1 : C.text1, valign: "top" });
  });
  s.addNotes("자료는 네 가지 경로로 모읍니다. 재무와 지분 같은 수치는 DART 공시를 기준으로 하고, 리더의 생각은 인터뷰와 SNS로 확인합니다. AI는 요약과 초안, 예상 질문 정리에 적극 활용하되, 수치와 인용문은 반드시 원문으로 다시 확인하겠습니다.");
}

// =====================================================================
// 11. 사례분석 프레임워크
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 사례분석 프레임워크", "23년을 네 시기로 나누고, 같은 순서로 분석");
  // 분석 순서
  const order = ["상황", "리더의 행동", "성과", "한계"];
  const ow = 1.9;
  T(s, "시기마다", { x: M, y: TOP, w: 1.1, h: 0.45, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
  order.forEach((t, i) => {
    const x = M + 1.15 + i * (ow + 0.45);
    rrect(s, { x, y: TOP, w: ow, h: 0.45, rectRadius: 0.06, fill: { color: i === 1 ? C.accent1 : C.background2 } });
    T(s, t, { x, y: TOP, w: ow, h: 0.45, fontSize: 14, bold: true, color: i === 1 ? C.background1 : C.text1, align: "center", valign: "middle" });
    if (i < 3) T(s, "→", { x: x + ow, y: TOP, w: 0.45, h: 0.45, fontSize: 14, color: C.text2, align: "center", valign: "middle" });
  });
  // 매트릭스
  const periods = [
    ["①  위기와 회생", "2003–2007", "카드대란, 대규모 적자", "현대카드M 출시\n윤리 원칙 수립\nGE와의 제휴"],
    ["②  브랜드 성장", "2008–2017", "흑자 안정, 차별화 경쟁", "문화 마케팅\n자율적 조직문화\n디지털 전환 선언"],
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
  s.addNotes("사례분석은 23년을 네 시기로 나눠 진행합니다. 각 시기마다 상황, 리더의 행동, 성과, 한계를 같은 순서로 보는데, 그중 핵심은 리더의 행동입니다. 예를 들어 위기 시기에는 현대카드M 출시와 윤리 원칙, GE와의 제휴를 분석합니다.");
}

// =====================================================================
// 12. 이론 연계
// =====================================================================
{
  const s = content("03  팀플 보고서 작성 방법 · 이론과의 연계성", "두 이론으로 핵심 질문에 답하고, 네 이론으로 보완",
    "이론 출처: 리더십 강의자료 2장 특성이론, 3장 행동이론과 동기부여, 4장 리더십 상황이론, 5장 갈등관리, 6장 권력·협상");
  const main = [
    ["리더 행동의 변화", "House 경로-목표이론", "4장", "위기 때는 지시적, 전환기에는\n성취지향적 리더십을 보였는가"],
    ["조직 상황의 변화", "Fiedler 상황 모델", "4장", "GE 제휴와 윤리 원칙이\n과업구조 · 직위권력을 바꾸었는가"],
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
    ["특성이론", "2장", "경험에 대한 개방성과 위험 감수 성향이 결정에 드러났나"],
    ["행동이론", "3장", "구조주도(원칙 · 디자인 관리)와 배려가 함께 나타났나"],
    ["갈등관리", "5장", "희망퇴직과 노조 면담에서 어떤 스타일로 대응했나"],
    ["권력 · 협상", "6장", "직위 · 관계에서 나온 권력과 애플페이 협상"],
  ];
  const sy = 4.4, sw = W / 4;
  hline(s, M, sy, W);
  sub.forEach(([t, ch, q], i) => {
    const x = M + i * sw;
    T(s, [{ text: t, options: { bold: true } }, { text: `  ${ch}`, options: { color: C.text2, fontSize: 13 } }],
      { x, y: sy + 0.3, w: sw - 0.3, h: 0.4, fontSize: 17, valign: "middle" });
    T(s, q, { x, y: sy + 0.8, w: sw - 0.35, h: 1.2, fontSize: 14, color: C.text2, valign: "top", lineSpacingMultiple: 1.25 });
  });
  s.addNotes("핵심 질문에는 4장의 두 이론으로 답합니다. 리더의 행동 변화는 House의 경로-목표이론으로, 조직 상황의 변화는 Fiedler의 상황 모델로 봅니다. 여기에 특성이론, 행동이론, 갈등관리, 권력과 협상 이론을 더해 리더의 개인 특성과 영향력의 원천까지 보완하겠습니다.");
}

// =====================================================================
// 13. 조원 R&R
// =====================================================================
{
  const s = content("04  조원 현황 및 역할 배분", "시기를 나눠 맡고, PPT와 발표는 담당자를 정함");
  const roles = ["자료조사", "자료분석", "PPT 작성", "발표"];
  const members = [
    ["조원1", "①  위기와 회생", [1, 1, 0, 2]],
    ["조원2", "②  브랜드 성장", [1, 1, 0, 0]],
    ["조원3", "③  구조조정", [1, 1, 2, 0]],
    ["조원4", "④  디지털 전환", [1, 1, 0, 2]],
  ];
  const c0 = 1.7, c1 = 3.0, rw = (W - c0 - c1) / roles.length, y0 = TOP, hh = 0.55, rh = 0.9;
  T(s, "조원", { x: M, y: y0, w: c0, h: hh, fontSize: 13, bold: true, color: C.text2, valign: "middle" });
  T(s, "담당 시기", { x: M + c0, y: y0, w: c1, h: hh, fontSize: 13, bold: true, color: C.text2, valign: "middle" });
  roles.forEach((r, j) => T(s, r, { x: M + c0 + c1 + j * rw, y: y0, w: rw, h: hh, fontSize: 13, bold: true, color: C.text2, align: "center", valign: "middle" }));
  hline(s, M, y0 + hh, W, HEX.ink, 1.25);
  members.forEach(([n, p, marks], i) => {
    const y = y0 + hh + i * rh;
    if (i > 0) hline(s, M, y, W);
    T(s, n, { x: M, y, w: c0, h: rh, fontSize: 18, bold: true, valign: "middle" });
    T(s, p, { x: M + c0, y, w: c1, h: rh, fontSize: 16, valign: "middle" });
    marks.forEach((m, j) => {
      if (!m) return;
      dot(s, M + c0 + c1 + j * rw + rw / 2, y + rh / 2, m === 2 ? 0.26 : 0.16, m === 2 ? C.accent1 : HEX.seg4);
    });
  });
  const ly = y0 + hh + 4 * rh;
  hline(s, M, ly, W);
  dot(s, M + 0.13, ly + 0.45, 0.26, C.accent1);
  T(s, "담당자", { x: M + 0.4, y: ly + 0.3, w: 1.2, h: 0.3, fontSize: 13, color: C.text2, valign: "middle" });
  dot(s, M + 1.73, ly + 0.45, 0.16, HEX.seg4);
  T(s, "자기 시기 담당", { x: M + 1.95, y: ly + 0.3, w: 2, h: 0.3, fontSize: 13, color: C.text2, valign: "middle" });
  T(s, "발표자 2명 · 자료와 수치 최종 확인은 전원 교차 검토", { x: M + 4.5, y: ly + 0.3, w: W - 4.5, h: 0.3, fontSize: 13, color: C.text2, align: "right", valign: "middle" });
  s.addNotes("네 명이 시기를 하나씩 맡아 자료조사와 분석을 하고, PPT 작성과 발표는 담당자를 따로 정했습니다. 발표자는 두 명이며, 수치와 인용은 서로 교차로 확인하겠습니다.");
}

// =====================================================================
// 14. 추진 일정
// =====================================================================
{
  const s = content("05  팀플 추진 일정", "11월 26일 보고서 제출, 11월 30일 최종 발표");
  const weeks = [["1주", "10.26–11.1"], ["2주", "11.2–11.8"], ["3주", "11.9–11.15"], ["4주", "11.16–11.22"], ["5주", "11.23–11.29"], ["발표", "11.30"]];
  const lw = 3.1, gx = M + lw, gw = (W - lw) / weeks.length, y0 = TOP, hh = 0.6, rh = 0.55;
  weeks.forEach(([w, d], i) => {
    const x = gx + i * gw;
    T(s, [{ text: w, options: { bold: true, breakLine: true } }, { text: d, options: { color: C.text2, fontSize: 12 } }],
      { x: x + 0.1, y: y0, w: gw - 0.1, h: hh, fontSize: 14, valign: "top" });
  });
  hline(s, M, y0 + hh + 0.05, W, HEX.ink, 1.25);
  // [과업, 시작 주(0-index, 소수=요일), 끝 주]
  const tasks = [
    ["계획 발표 · 피드백 반영", 0, 1],
    ["자료 수집", 0, 2],
    ["시기별 사례 분석", 1, 3],
    ["이론 연계 · 평가", 2, 4],
    ["보고서 작성 · 검토", 3, 4 + 4 / 7],
    ["발표 자료 · 리허설", 4, 5.5],
  ];
  const ty = y0 + hh + 0.15;
  for (let i = 1; i < weeks.length; i++) vline(s, gx + i * gw, ty, tasks.length * rh, "ECECEC", 0.75);
  tasks.forEach(([t, a, b], i) => {
    const y = ty + i * rh;
    T(s, t, { x: M, y, w: lw - 0.2, h: rh, fontSize: 15, valign: "middle" });
    rrect(s, { x: gx + a * gw + 0.08, y: y + rh / 2 - 0.12, w: (b - a) * gw - 0.16, h: 0.24, rectRadius: 0.05, fill: { color: i >= 4 ? C.text1 : HEX.seg4 } });
  });
  const ms = [["보고서 제출 11.26", 4 + 4 / 7, 4], ["최종 발표 11.30", 5.5, 5]];
  ms.forEach(([t, at, row]) => {
    const cx = gx + at * gw, cy = ty + row * rh + rh / 2;
    s.addShape(pres.shapes.DIAMOND, { x: cx - 0.15, y: cy - 0.15, w: 0.3, h: 0.3, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `ms-${row}` });
  });
  const ny = ty + tasks.length * rh + 0.15;
  hline(s, M, ny, W);
  s.addShape(pres.shapes.DIAMOND, { x: M, y: ny + 0.3, w: 0.24, h: 0.24, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "ms-legend" });
  T(s, "11.26(목) 최종보고서 제출   ·   11.30(월) 최종 발표", { x: M + 0.4, y: ny + 0.25, w: 7, h: 0.34, fontSize: 14, bold: true, valign: "middle" });
  T(s, "매주 1회 정기 회의로 진행 상황 점검", { x: M + 7, y: ny + 0.25, w: W - 7 - 0.8, h: 0.34, fontSize: 13, color: C.text2, align: "right", valign: "middle" });
  s.addNotes("오늘 계획 발표 이후 피드백을 반영해 바로 자료 수집을 시작합니다. 2주차부터 시기별 분석, 3주차부터 이론 연계를 진행하고, 11월 26일 최종보고서를 제출한 뒤 11월 30일에 최종 발표를 하겠습니다.");
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
}

// =====================================================================
// 16. 마무리
// =====================================================================
{
  const s = pres.addSlide({ masterName: "Dark" });
  T(s, "감사합니다", { x: M, y: 2.55, w: 8, h: 0.9, fontSize: 44, bold: true, color: C.background1, valign: "middle" });
  T(s, "질의응답", { x: M, y: 3.5, w: 8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.9, w: 6, h: 0.7, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.95;
  card(s, SW - M - cw, (SH - cw * 1.586) / 2, cw, { fill: "262626", chip: C.accent1 });
  s.addNotes("이상으로 발표를 마치겠습니다. 질문 주시면 답변드리겠습니다.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
