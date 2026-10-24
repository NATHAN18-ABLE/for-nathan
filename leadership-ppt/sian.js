// 시안: 같은 레이아웃을 강조색 두 가지(A 딥블루 / B 버밀리언)로 만들어 비교한다.
// usage: NODE_PATH=./node_modules node sian.js A|B
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const VARIANTS = {
  A: { name: "Ink Blue", accent: "24479A", coverDark: false },
  B: { name: "Ink Vermilion", accent: "D8452B", coverDark: true },
};
const v = VARIANTS[process.argv[2] || "A"];

const HEX = { ink: "141414", grey: "6E6E6E", mute: "9A9A9A", rule: "D6D6D6", tint: "F3F3F3", accent: v.accent };
const THEME = {
  name: `Leadership ${v.name}`,
  headFontFace: "Pretendard",
  bodyFontFace: "Pretendard",
  colors: {
    dk1: HEX.ink, lt1: "FFFFFF", dk2: HEX.grey, lt2: HEX.tint,
    accent1: HEX.accent, accent2: "B9B9B9", accent3: "4A4A4A", accent4: "8C8C8C", accent5: "D6D6D6", accent6: "2E2E2E",
    hlink: HEX.accent, folHlink: HEX.grey,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "리더십 팀프로젝트 계획서: 현대카드 정태영 부회장";
const C = pres.SchemeColor;

const M = 0.75; // 좌우 여백
const W = 13.333 - M * 2;

pres.defineSlideMaster({
  title: "Content",
  background: { color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "label", type: "body", x: M, y: 0.5, w: 8, h: 0.3, fontSize: 11, bold: true, color: C.text2, margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.82, w: W, h: 0.8, fontSize: 28, bold: true, color: C.text1, margin: 0, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "source", type: "body", x: M, y: 6.92, w: 10, h: 0.3, fontSize: 10, color: C.text2, margin: 0, valign: "middle" }, text: "" } },
  ],
  slideNumber: { x: 12.08, y: 6.92, w: 0.5, h: 0.3, fontSize: 10, color: HEX.grey, align: "right", margin: 0 },
});
pres.defineSlideMaster({ title: "Cover", background: { color: v.coverDark ? HEX.ink : "FFFFFF" }, objects: [] });

// ---------- 1. 표지 ----------
{
  const s = pres.addSlide({ masterName: "Cover" });
  const fg = v.coverDark ? C.background1 : C.text1;
  const sub = v.coverDark ? "A8A8A8" : HEX.grey;
  s.addText("리더십 · 팀프로젝트 계획 발표", { x: M, y: 0.7, w: 7, h: 0.3, fontSize: 12, bold: true, color: sub, margin: 0, isTextBox: true, objectName: "kicker" });
  s.addText("자신을 바꾼 리더인가,\n상황을 바꾼 리더인가", {
    x: M, y: 2.0, w: 8.2, h: 1.8, fontSize: 44, bold: true, color: fg, margin: 0, valign: "top", lineSpacingMultiple: 1.12, isTextBox: true, objectName: "cover-title",
  });
  s.addText("현대카드 정태영 부회장 사례분석 계획", { x: M, y: 4.0, w: 8, h: 0.45, fontSize: 20, color: sub, margin: 0, isTextBox: true, objectName: "cover-sub" });
  s.addText(
    [
      { text: "○조", options: { bold: true, color: fg, breakLine: true } },
      { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: sub, breakLine: true } },
      { text: "2026. 10. 26", options: { color: sub } },
    ],
    { x: M, y: 5.6, w: 6, h: 1.0, fontSize: 13, margin: 0, valign: "bottom", paraSpaceAfter: 3, isTextBox: true, objectName: "cover-meta" }
  );
  // 모티프: 세로형 카드 (ID-1 비율 1:1.586)
  const cw = 2.95, ch = cw * 1.586, cx = 13.333 - M - cw, cy = (7.5 - ch) / 2;
  const cardFill = v.coverDark ? C.accent1 : C.text1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.14, fill: { color: cardFill }, line: { type: "none" }, objectName: "card" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + 0.32, y: cy + 0.42, w: 0.5, h: 0.4, rectRadius: 0.06, fill: { color: v.coverDark ? C.text1 : C.accent1 }, line: { type: "none" }, objectName: "card-chip" });
  s.addText(
    [
      { text: "JUNG TAE-YOUNG", options: { bold: true, breakLine: true } },
      { text: "2003 — 2026", options: {} },
    ],
    { x: cx + 0.32, y: cy + ch - 1.0, w: cw - 0.6, h: 0.65, fontSize: 11, color: C.background1, margin: 0, charSpacing: 1.5, valign: "bottom", isTextBox: true, objectName: "card-text" }
  );
}

// ---------- 2. History 타임라인 ----------
{
  const s = pres.addSlide({ masterName: "Content" });
  s.addText("01  리더 및 선정 배경", { placeholder: "label" });
  s.addText("카드대란 속 적자 회사를 맡아 23년째 이끄는 중", { placeholder: "title" });
  s.addText("출처: 비즈니스포스트 「Who Is? 정태영」, 한경비즈니스 「2021 파워 금융인 30」, 현대카드 뉴스룸", { placeholder: "source" });

  const events = [
    ["2003", "대표이사 취임\n첫해 6천억대 적자\n현대카드M 출시"],
    ["2005", "초청제 프리미엄\n‘the Black’ 출시\n문화 마케팅 시작"],
    ["2015", "부회장 승진\n‘디지털 현대카드’\n선언"],
    ["2018", "수수료 인하로\n실적 악화\n창사 첫 희망퇴직"],
    ["2023", "애플페이\n국내 첫 도입\n‘전시체제’ 선언"],
    ["2024–26", "AI 플랫폼\n‘유니버스’를\n일본에 수출"],
  ];
  const n = events.length, colW = W / n, lineY = 3.25;
  s.addText([
    { text: "이전 경력  ", options: { bold: true, color: C.text1 } },
    { text: "1987–2002  현대종합상사 · 현대정공(미주·멕시코 법인장) · 현대모비스 · 기아", options: { color: C.text2 } },
  ], { x: M, y: 1.75, w: W, h: 0.35, fontSize: 14, margin: 0, valign: "middle", isTextBox: true, objectName: "prior-career" });
  s.addShape(pres.shapes.LINE, { x: M, y: lineY, w: W, h: 0, line: { color: HEX.rule, width: 1 }, objectName: "timeline-axis" });
  events.forEach(([year, desc], i) => {
    const x = M + i * colW;
    const key = year === "2003";
    s.addText(year, { x, y: 2.4, w: colW - 0.15, h: 0.55, fontSize: key ? 24 : 20, bold: true, color: key ? C.accent1 : C.text1, margin: 0, valign: "bottom", isTextBox: true, objectName: `tl-year-${i}` });
    const d = key ? 0.2 : 0.13;
    s.addShape(pres.shapes.OVAL, { x: x, y: lineY - d / 2, w: d, h: d, fill: { color: key ? C.accent1 : C.text1 }, line: { type: "none" }, objectName: `tl-dot-${i}` });
    s.addText(desc, { x, y: 3.5, w: colW - 0.15, h: 1.1, fontSize: 14, color: C.text1, margin: 0, valign: "top", lineSpacingMultiple: 1.15, isTextBox: true, objectName: `tl-desc-${i}` });
  });

  // 네 시기 구분: 이후 사례분석 프레임워크와 이어지는 띠
  const phases = [
    ["①  위기와 회생", 0, 1],
    ["②  브랜드 성장", 2, 2],
    ["③  구조조정", 3, 3],
    ["④  디지털 전환", 4, 5],
  ];
  s.addText("보고서에서 나눠 볼 네 시기", { x: M, y: 4.95, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true, objectName: "phase-label" });
  phases.forEach(([label, a, b], i) => {
    const x = M + a * colW, w = (b - a + 1) * colW - 0.12;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 5.35, w, h: 0.55, fill: { color: C.background2 }, line: { type: "none" }, objectName: `phase-${i}` });
    s.addText(label, { x: x + 0.18, y: 5.35, w: w - 0.2, h: 0.55, fontSize: 13, bold: true, color: C.text1, margin: 0, valign: "middle", isTextBox: true, objectName: `phase-text-${i}` });
  });
  s.addNotes("정태영 부회장의 이력을 연도순으로 정리했습니다. 아래 회색 띠는 저희가 사례를 나눠 볼 네 시기입니다.");
}

// ---------- 3. 재무정보 ----------
{
  const s = pres.addSlide({ masterName: "Content" });
  s.addText("02  대상 리더 소개 · 재무정보", { placeholder: "label" });
  s.addText("영업이익·순이익 모두 늘었고, 이용실적 점유율은 업계 2위", { placeholder: "title" });
  s.addText("출처: 현대카드 반기보고서 제32기(2026.8.14 제출) Ⅲ-1 요약재무정보, DART · 연결 기준 · 점유율은 금감원 신용카드 이용실적 기준", { placeholder: "source" });

  const stats = [
    ["4조 78억원", "2025년 영업수익", false],
    ["3,503억원", "2025년 당기순이익 · 전년 대비 +10.7%", false],
    ["19.3%", "2025년 이용실적 점유율 · 2위 (1위 신한 19.8%)", true],
  ];
  stats.forEach(([num, label, hi], i) => {
    const y = 2.05 + i * 1.5;
    s.addText(num, { x: M, y, w: 4.6, h: 0.75, fontSize: 36, bold: true, color: hi ? C.accent1 : C.text1, margin: 0, valign: "bottom", isTextBox: true, objectName: `stat-num-${i}` });
    s.addText(label, { x: M, y: y + 0.8, w: 4.6, h: 0.35, fontSize: 13, color: C.text2, margin: 0, valign: "top", isTextBox: true, objectName: `stat-label-${i}` });
  });

  const cx = 6.0, cw = 13.333 - M - cx;
  s.addText("영업이익 · 당기순이익 (억원)", { x: cx, y: 2.05, w: cw, h: 0.35, fontSize: 13, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: "chart-title" });
  s.addChart(
    pres.charts.BAR,
    [
      { name: "2024년", labels: ["영업이익", "당기순이익"], values: [4061, 3164] },
      { name: "2025년", labels: ["영업이익", "당기순이익"], values: [4393, 3503] },
    ],
    {
      x: cx, y: 2.45, w: cw, h: 3.0, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
      chartColors: ["C4C4C4", HEX.accent],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0", dataLabelFontSize: 12, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
      showLegend: true, legendPos: "t", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.grey,
      catAxisLabelFontSize: 13, catAxisLabelFontFace: "+mn-lt", catAxisLabelColor: HEX.ink, catAxisLineShow: true, catAxisLineColor: HEX.rule,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, valAxisMinVal: 0, valAxisMaxVal: 5200,
      objectName: "chart-profit",
    }
  );
  // 2026 상반기는 기간이 달라 차트에 섞지 않고 한 줄로 따로 둔다
  s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 5.65, w: cw, h: 0.9, fill: { color: C.background2 }, line: { type: "none" }, objectName: "h1-box" });
  s.addText(
    [
      { text: "2026년 상반기", options: { bold: true, color: C.text1, breakLine: true } },
      { text: "영업수익 2조 3,372억 · 영업이익 2,495억 · 순이익 1,852억", options: { color: C.text2 } },
    ],
    { x: cx + 0.25, y: 5.65, w: cw - 0.4, h: 0.9, fontSize: 13, paraSpaceAfter: 2, margin: 0, valign: "middle", isTextBox: true, objectName: "h1-text" }
  );
}

(async () => {
  const out = `sian-${process.argv[2] || "A"}.pptx`;
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
})();
