// 리더십 팀프로젝트 최종 발표: 2023–2026 정태영 부회장 (Canva · 미리캔버스 호환)
// 차트 · 대각선 · 화살표를 기본 도형으로, 색은 hex로, 폰트는 텍스트마다 직접 지정한다
// usage: NODE_PATH=./node_modules node deck.js
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const OUT = "leadership-final.pptx";
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
// 현대카드 세로형 카드: 칩은 위, 흰색 로고는 아래 (logo: true)
const LOGO_W = "photos/out/H_logo_white.png", LOGO_RATIO = 165 / 750;
function cardLogo(s, x, y, w, h) {
  const lw = w * 0.66;
  if (require("fs").existsSync(LOGO_W)) s.addImage({ path: LOGO_W, x: x + w * 0.11, y: y + h - w * 0.11 - lw * LOGO_RATIO, w: lw, h: lw * LOGO_RATIO, objectName: `logo${++oid}` });
}
function card(s, x, y, w, { fill, chip, lines = [], lineSize = 11, logo = false }) {
  const h = w * 1.586;
  rrect(s, { x, y, w, h, rectRadius: Math.min(0.14, w * 0.05), fill: { color: fill } });
  rrect(s, { x: x + w * 0.11, y: y + w * 0.14, w: w * 0.17, h: w * 0.135, rectRadius: w * 0.02, fill: { color: chip } });
  if (logo) cardLogo(s, x, y, w, h);
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
    const opts = { fill: f, chip: i === n - 1 ? chip : f, logo: i === n - 1 };
    card(s, x - k * dx, y + k * dy, w, opts);
  });
}

function section(num, title, sub, note) {
  const s = slide(true);
  T(s, num, { x: M, y: 1.35, w: 4, h: 1.5, fontSize: 96, bold: true, color: C.accent1, valign: "bottom" });
  T(s, title, { x: M, y: 3.05, w: 8, h: 0.8, fontSize: 40, bold: true, color: C.background1, valign: "top" });
  if (sub) T(s, sub, { x: M, y: 3.95, w: 8, h: 0.4, fontSize: 18, color: HEX.darkSub });
  cardStack(s, SW - M - 1.9, 3.2, 1.9, ["2E2E2E", "4A4A4A", HEX.accent], "D6D6D6");
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

pres.title = "알려진 위기, 먼저 움직인 리더: 현대카드 정태영 부회장의 AI 전환 리더십";
pres.subject = "리더십 팀프로젝트 최종 발표";

// ---------- 사진 ----------
const fs = require("fs");
const PH = "photos/out/";
// 사진이 아직 없으면 회색 자리표시로 그린다 (나중에 파일만 넣고 다시 빌드)
function photo(s, name, x, y, w, h, credit) {
  const f = [".png", ".jpg"].map((e) => PH + name + e).find((p) => fs.existsSync(p));
  if (f) s.addImage({ path: f, x, y, w, h, objectName: `img-${name}` });
  else {
    rect(s, { x, y, w, h, fill: { color: "E4E4E4" } });
    T(s, "사진 자리", { x, y, w, h, fontSize: 12, color: HEX.seg3, align: "center", valign: "middle" });
  }
  if (credit) T(s, credit, { x, y: y + h + 0.06, w, h: 0.22, fontSize: 9, color: HEX.seg3, valign: "top" });
}

// =====================================================================
// 1. 표지
// =====================================================================
{
  const s = slide(true);
  darkLabel(s, "리더십 · 팀프로젝트 최종 발표");
  T(s, "알려진 위기,\n먼저 움직인 리더", { x: M, y: 1.9, w: 7.6, h: 2.0, fontSize: 50, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.08 });
  T(s, "현대카드 정태영 부회장의 AI 전환 리더십 · 2023–2026", { x: M, y: 4.15, w: 7.8, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub, breakLine: true } },
    { text: "2026. 11. 30", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.6, w: 6, h: 1.0, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  const cw = 2.75, ch = cw * 1.586, cx = SW - M - cw, cy = (SH - ch) / 2 - 0.15;
  const k = 0.17 * cw;
  card(s, cx - 2 * k, cy + 2 * 0.13 * cw, cw, { fill: "2E2E2E", chip: "2E2E2E" });
  card(s, cx - k, cy + 0.13 * cw, cw, { fill: HEX.accent, chip: HEX.accent });
  photo(s, "A_card", cx, cy, cw, ch);
  cardLogo(s, cx, cy, cw, ch);
  s.addNotes("안녕하세요, ○조입니다. 저희는 현대카드 정태영 부회장이 2023년부터 지금까지, 고금리 위기 속에서 카드사를 AI 회사로 바꾸고 있는 과정을 수업에서 배운 리더십 이론으로 분석했습니다.");
}

// =====================================================================
// 2. 목차
// =====================================================================
{
  const s = slide(false);
  const pw = 4.35;
  rect(s, { x: 0, y: 0, w: pw, h: SH, fill: { color: C.text1 } });
  T(s, "목차", { x: M, y: 0.84, w: pw - M, h: 0.75, fontSize: 28, bold: true, color: C.background1, valign: "top" });
  card(s, M, 4.1, 1.55, { fill: C.accent1, chip: "D6D6D6", logo: true });
  const items = [["리더와 분석 범위", ""], ["개인 리더십", "2장 · 4장"], ["리더십 스킬", "6장"], ["조직 리더십", "9장"], ["결론", ""]];
  const x0 = pw + 0.9, w0 = SW - M - x0, y0 = 0.75, rh = 1.2;
  items.forEach(([t, ch], i) => {
    const y = y0 + i * rh;
    if (i > 0) hline(s, x0, y, w0);
    T(s, `0${i + 1}`, { x: x0, y, w: 1.3, h: rh, fontSize: 40, bold: true, color: i >= 1 && i <= 3 ? C.accent1 : HEX.rule, valign: "middle" });
    T(s, [{ text: t, options: { bold: true } }, { text: ch ? `   ${ch}` : "", options: { fontSize: 15, color: C.text2 } }],
      { x: x0 + 1.5, y, w: w0 - 1.5, h: rh, fontSize: 26, valign: "middle" });
  });
  s.addNotes("발표는 리더와 분석 범위를 먼저 소개하고, 수업의 순서대로 개인 리더십, 리더십 스킬, 조직 리더십을 차례로 본 다음 결론으로 마치겠습니다.");
}

// =====================================================================
// 3. 핵심 질문
// =====================================================================
{
  const s = slide(true);
  darkLabel(s, "저희가 답하려는 질문");
  T(s, "고금리 위기 속에서\n카드사를 AI 회사로 바꾸는 힘은\n어디서 나오는가?", {
    x: M, y: 1.35, w: 11, h: 2.6, fontSize: 40, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15,
  });
  const gap = 0.3, bw = (W - gap * 2) / 3, by = 4.6, bh = 1.9;
  [["사람", "개인 리더십", "특성 · 상황이론"], ["힘", "리더십 스킬", "권력 · 영향력"], ["조직", "조직 리더십", "위기 · 변화관리"]].forEach(([k, p, t], i) => {
    const x = M + i * (bw + gap);
    rect(s, { x, y: by, w: bw, h: bh, fill: { color: PANEL_DARK } });
    T(s, k, { x: x + 0.4, y: by + 0.3, w: bw - 0.8, h: 0.75, fontSize: 36, bold: true, color: C.accent1, valign: "middle" });
    T(s, [{ text: p, options: { bold: true, breakLine: true } }, { text: t, options: { color: HEX.darkSub, fontSize: 15 } }],
      { x: x + 0.4, y: by + 1.05, w: bw - 0.8, h: 0.7, fontSize: 20, color: C.background1, valign: "top", paraSpaceAfter: 3 });
  });
  s.addNotes("저희가 답하려는 질문은 이것입니다. 고금리라는 위기 속에서 카드사를 AI 회사로 바꾸는 힘은 어디서 나오는가. 이 질문을 수업의 구성 그대로 세 단계로 나눠 봤습니다. 리더라는 사람 자체, 리더가 가진 힘, 그리고 조직을 움직이는 방식입니다.");
}

section("01", "리더와 분석 범위", "프로필 · 2023–2026 타임라인", "먼저 정태영 부회장과 저희가 분석한 기간을 간단히 소개하겠습니다.");

// =====================================================================
// 5. 리더 · 회사 요약
// =====================================================================
{
  const s = content("01  리더와 분석 범위", "23년째 현대카드를 이끄는 정태영 부회장", "출처: DART 반기보고서(2026.8) · 사진: 현대카드");
  const cw = 2.8, ch = cw * 1.586;
  photo(s, "A_card", M, TOP, cw, ch);
  const x0 = M + cw + 0.8, w0 = SW - M - x0;
  T(s, [{ text: "정태영", options: { bold: true, fontSize: 34 } }, { text: "   1960년생", options: { fontSize: 16, color: C.text2 } }], { x: x0, y: TOP, w: w0 - 2.4, h: 0.7, valign: "middle" });
  photo(s, "H_logo", SW - M - 2.2, TOP + 0.11, 2.2, 2.2 * 165 / 750);
  const rows = [["현직", "현대카드 · 현대커머셜 대표이사 부회장"], ["재임", "2003년부터 23년째"], ["가족", "정몽구 현대차그룹 명예회장의 사위"]];
  rows.forEach(([k, v], i) => {
    const y = TOP + 0.85 + i * 0.62;
    hline(s, x0, y, w0);
    T(s, k, { x: x0, y, w: 1.2, h: 0.62, fontSize: 14, bold: true, color: C.text2, valign: "middle" });
    T(s, v, { x: x0 + 1.3, y, w: w0 - 1.3, h: 0.62, fontSize: 18, valign: "middle" });
  });
  const sy = TOP + 0.85 + 3 * 0.62 + 0.35, sh = TOP + ch - sy, gap = 0.25, sw = (w0 - gap * 2) / 3;
  [["1,311만", "회원"], ["3,503억", "2025 순이익"], ["2위", "이용실적 점유율"]].forEach(([n, l], i) => {
    const x = x0 + i * (sw + gap), hi = i === 2;
    rect(s, { x, y: sy, w: sw, h: sh, fill: { color: hi ? C.accent1 : C.background2 } });
    T(s, n, { x: x + 0.3, y: sy + 0.12, w: sw - 0.5, h: 0.7, fontSize: 32, bold: true, color: hi ? C.background1 : C.text1, valign: "bottom" });
    T(s, l, { x: x + 0.3, y: sy + 0.88, w: sw - 0.5, h: 0.35, fontSize: 14, color: hi ? C.background1 : C.text2, valign: "top" });
  });
  s.addNotes("정태영 부회장은 2003년부터 23년째 현대카드를 이끌고 있고, 정몽구 현대차그룹 명예회장의 사위입니다. 현대카드는 회원이 1,311만 명, 작년 순이익이 3,503억 원이고, 신용카드 이용실적 점유율은 업계 2위입니다.");
}

// =====================================================================
// 6. 분석 범위 타임라인
// =====================================================================
{
  const s = content("01  리더와 분석 범위", "2023–2026, 위기에서 AI 전환까지", "사진: 현대카드, 언론 보도");
  const ev = [
    ["2023.1", "‘알려진 위기’ 신년사", null, "‘알려진\n위기’"],
    ["2023.3", "애플페이 국내 첫 도입", "B_tile"],
    ["2024.10", "AI ‘유니버스’ 일본 수출", "C_tile"],
    ["2026.2~", "리더 260여 명 LLM 실습", "D_tile"],
    ["2026.4", "서울대 강연", "E_tile"],
    ["2026.9", "알리바바 · 유니트리 방문", null, "중국\n테크 현장"],
  ];
  const gap = 0.15, tw = (W - gap * 5) / 6, th = 2.3, ty = TOP;
  const lineY = ty + th + 0.55;
  hline(s, M, lineY, W, "C9C9C9", 1);
  ev.forEach(([d, t, img, label], i) => {
    const x = M + i * (tw + gap);
    if (img) photo(s, img, x, ty, tw, th);
    else {
      rect(s, { x, y: ty, w: tw, h: th, fill: { color: C.text1 } });
      T(s, label, { x: x + 0.2, y: ty, w: tw - 0.3, h: th, fontSize: 24, bold: true, color: C.background1, valign: "middle", lineSpacingMultiple: 1.1 });
    }
    dot(s, x + 0.08, lineY, i === 0 ? 0.2 : 0.14, i === 0 ? C.accent1 : C.text1);
    T(s, d, { x, y: lineY + 0.22, w: tw, h: 0.4, fontSize: 18, bold: true, color: i === 0 ? C.accent1 : C.text1 });
    T(s, t, { x, y: lineY + 0.65, w: tw - 0.05, h: 0.75, fontSize: 14, valign: "top", lineSpacingMultiple: 1.15 });
  });
  s.addNotes("분석 기간은 2023년부터 올해까지입니다. 2023년 신년사에서 금융위기를 '알려진 위기'라고 진단했고, 같은 해 3월 애플페이를 국내에서 처음 도입했습니다. 2024년 10월에는 AI 플랫폼 '유니버스'를 일본 3대 카드사에 수출했고, 올해는 리더 260여 명과 함께 LLM 실습을 하고, 서울대에서 강연하고, 중국 알리바바와 유니트리를 직접 찾아갔습니다. 고금리라는 어려운 환경과 AI 전환이 겹친 시기이고, 리더의 행동을 보여 주는 자료가 많아서 이 기간을 골랐습니다.");
}

section("02", "개인 리더십", "2장 특성이론 · 4장 상황이론", "첫 번째로, 리더라는 사람 자체를 2장 특성이론과 4장 상황이론으로 보겠습니다.");

// =====================================================================
// 8. 특성이론
// =====================================================================
{
  const s = content("02  개인 리더십 · 특성이론 (2장)", "남들이 미룬 선택을 먼저 하는 리더",
    "출처: 강의자료 2장 · 언론 보도 4건 (참고자료)");
  const pw = 3.4, ph = 6.55 - TOP;
  photo(s, "B_panel", M, TOP, pw, ph);
  const x0 = M + pw + 0.35, w0 = SW - M - x0, gap = 0.25, bw = (w0 - gap) / 2, bh = 3.0;
  [
    ["내재적 통제위치", "위험이 커도 혁신을 고르는 CEO", ["경쟁사가 미룬 애플페이 첫 도입", "AI 예산 1조 원 이상"]],
    ["경험에 대한 개방성", "호기심 · 상상력 · 창의성", ["60대 중반에 중국 테크 기업 방문", "알리바바 · 유니트리"]],
  ].forEach(([t, d, ev], i) => {
    const x = x0 + i * (bw + gap);
    rect(s, { x, y: TOP, w: bw, h: bh, fill: { color: i === 0 ? C.text1 : C.background2 } });
    const fg = i === 0 ? C.background1 : C.text1, sub = i === 0 ? HEX.darkSub : C.text2;
    T(s, t, { x: x + 0.35, y: TOP + 0.3, w: bw - 0.6, h: 0.5, fontSize: 22, bold: true, color: fg });
    T(s, d, { x: x + 0.35, y: TOP + 0.85, w: bw - 0.6, h: 0.35, fontSize: 14, color: sub });
    ev.forEach((e, j) => T(s, e, { x: x + 0.35, y: TOP + 1.55 + j * 0.6, w: bw - 0.6, h: 0.5, fontSize: 17, bold: true, color: fg, valign: "middle" }));
  });
  const ly = TOP + bh + 0.3, lh = 6.55 - ly;
  rect(s, { x: x0, y: ly, w: w0, h: lh, fill: { color: C.accent1 } });
  T(s, [
    { text: "한계  ", options: { bold: true } },
    { text: "애플페이 다음 달 신규 회원 감소 → 상황이론으로 보완", options: {} },
  ], { x: x0 + 0.35, y: ly, w: w0 - 0.6, h: lh, fontSize: 16, color: C.background1, valign: "middle" });
  s.addNotes("2장 특성이론에서 보면, 정 부회장은 내재적 통제위치를 가진 리더에 가깝습니다. 강의에서 최고경영자가 내재론자일수록 위험도가 높고 혁신적인 전략을 고른다고 배웠는데, 다른 카드사들이 0.15%로 알려진 수수료 부담 때문에 미루던 애플페이를 국내에서 처음 들여왔고, AI에 1조 원 이상을 투자했습니다. 또 60대 중반의 나이에 중국 알리바바와 유니트리를 직접 찾아가 공부한 건 Big Five의 경험에 대한 개방성, 즉 호기심을 보여 줍니다. 다만 특성이론은 상황을 고려하지 않는다는 한계가 있습니다. 실제로 애플페이 도입 다음 달에는 신규 회원과 이용금액이 줄었다는 보도도 있어서, 위험을 감수한다고 늘 좋은 결과가 나오는 건 아닙니다. 그래서 상황이론으로 함께 보겠습니다.");
}

// =====================================================================
// 9. House 경로-목표이론
// =====================================================================
{
  const s = content("02  개인 리더십 · House 경로-목표이론 (4장)", "낯선 AI 업무에는 높은 목표를", "출처: 강의자료 4장 · 헤럴드경제(2025.9) · 사진: 현대카드");
  const pw = 5.4, ph = 6.55 - TOP;
  photo(s, "D_panel", M, TOP, pw, ph);
  const x0 = M + pw + 0.45, w0 = SW - M - x0;
  const steps = [
    ["상황 · 과업", "LLM · 데이터 설계", "애매하고 반복되지 않는 일", false],
    ["리더 행동", "성취지향적 리더십", "목표: 2027년 LLM이 재무제표까지 작성", true],
    ["효과", "자신감 · 동기 상승", "", false],
  ];
  const sh = 1.2, sg = 0.42;
  steps.forEach(([k, t, d, hi], i) => {
    const y = TOP + i * (sh + sg);
    rect(s, { x: x0, y, w: w0, h: sh, fill: { color: hi ? C.accent1 : C.background2 } });
    T(s, k, { x: x0 + 0.35, y: y + 0.12, w: w0 - 0.6, h: 0.3, fontSize: 13, bold: true, color: hi ? C.background1 : C.text2 });
    T(s, [{ text: t, options: { bold: true, breakLine: !!d } }, ...(d ? [{ text: d, options: { fontSize: 15 } }] : [])],
      { x: x0 + 0.35, y: y + 0.42, w: w0 - 0.6, h: sh - 0.5, fontSize: 21, color: hi ? C.background1 : C.text1, valign: "top", paraSpaceAfter: 2 });
    if (i < 2) T(s, "↓", { x: x0, y: y + sh, w: w0, h: sg, fontSize: 18, bold: true, color: C.text2, align: "center", valign: "middle" });
  });
  s.addNotes("4장 House의 경로-목표이론으로 보면, AI 전환기에 직원들은 LLM 활용이나 데이터 설계처럼 해 본 적 없는 일을 맡게 됐습니다. 강의에서 애매하고 반복적이지 않은 과업을 하는 부하에게는 성취지향적 리더십이 자신감과 동기를 높인다고 배웠는데, 정 부회장은 2027년부터 LLM이 사업계획과 재무제표까지 만드는 수준을 목표로 제시했습니다. House의 처방과 맞는 행동입니다. 참고로 House의 상황요인은 시장 환경이 아니라 부하의 특성과 작업 환경이기 때문에, 2023년 고금리 대응은 뒤에서 9장 위기관리로 따로 보겠습니다.");
}

// =====================================================================
// 10. Fiedler 상황 모델
// =====================================================================
{
  const s = content("02  개인 리더십 · Fiedler 상황 모델 (4장)", "어느 경우든 과업지향 리더가 맞는 상황", "출처: 강의자료 4장 · LPC는 측정 불가, 행동으로 추정");
  const vars = [["리더-부하 관계", "?", "공개 자료로 판단 불가"], ["과업구조", "낮음", "AI 전환 = 비구조적 과업"], ["직위권력", "강함", "23년째 대표 · 오너 일가"]];
  const gap = 0.3, vw = (W - gap * 2) / 3, vh = 1.75;
  vars.forEach(([k, v, d], i) => {
    const x = M + i * (vw + gap);
    rect(s, { x, y: TOP, w: vw, h: vh, fill: { color: i === 0 ? "FFFFFF" : C.background2 }, line: i === 0 ? { color: HEX.rule, width: 1, dashType: "dash" } : { type: "none" } });
    T(s, k, { x: x + 0.35, y: TOP + 0.25, w: vw - 0.6, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
    T(s, v, { x: x + 0.35, y: TOP + 0.6, w: vw - 0.6, h: 0.65, fontSize: 32, bold: true, color: i === 0 ? HEX.seg3 : C.text1, valign: "middle" });
    T(s, d, { x: x + 0.35, y: TOP + 1.25, w: vw - 0.6, h: 0.35, fontSize: 14, color: C.text2 });
  });
  // 8가지 상황
  const oy = TOP + vh + 0.55, ow = W / 8, oh = 1.0;
  T(s, "상황적 호의성 8가지 (상황 1 = 가장 유리)", { x: M, y: oy - 0.38, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.text2 });
  ["1", "2", "3", "4", "5", "6", "7", "8"].forEach((r, i) => {
    const x = M + i * ow, task = i <= 2 || i >= 6, hit = i === 2 || i === 6;
    rect(s, { x: x + 0.03, y: oy, w: ow - 0.06, h: oh, fill: { color: hit ? C.accent1 : task ? HEX.seg4 : "F3F3F3" } });
    T(s, r, { x: x + 0.03, y: oy, w: ow - 0.06, h: oh, fontSize: 30, bold: true, color: hit ? C.background1 : task ? C.text1 : HEX.seg3, align: "center", valign: "middle" });
  });
  T(s, "과업지향", { x: M, y: oy + oh + 0.1, w: ow * 3, h: 0.3, fontSize: 13, bold: true, align: "center" });
  T(s, "관계지향", { x: M + ow * 3, y: oy + oh + 0.1, w: ow * 3, h: 0.3, fontSize: 13, bold: true, color: HEX.seg3, align: "center" });
  T(s, "과업지향", { x: M + ow * 6, y: oy + oh + 0.1, w: ow * 2, h: 0.3, fontSize: 13, bold: true, align: "center" });
  T(s, [{ text: "관계가 좋으면 상황 3, 나쁘면 상황 7  →  ", options: { color: C.text2 } }, { text: "둘 다 과업지향 리더가 적합", options: { bold: true, color: C.accent1 } }],
    { x: M, y: 6.1, w: W, h: 0.4, fontSize: 17, valign: "middle" });
  s.addNotes("4장 Fiedler 모델로 보면, 상황의 호의성은 리더-부하 관계, 과업구조, 직위권력으로 정해집니다. 직위권력은 23년째 대표이고 오너 일가라서 강합니다. 과업구조는 AI 전환 업무가 아직 목표와 절차가 정해지지 않은 일이라서 낮습니다. 리더-부하 관계는 공개 자료로는 판단할 수 없습니다. 그런데 관계가 좋으면 상황 3, 나쁘면 상황 7인데, 두 경우 모두 과업지향 리더가 적합합니다. 목표와 예산, 일정 중심인 정 부회장의 행동은 과업지향에 가까워서 상황과 맞습니다. 다만 LPC 점수는 잴 수 없어서 리더 스타일은 행동으로 추정했다는 한계가 있습니다.");
}

section("03", "리더십 스킬", "6장 권력 · 영향력 전술", "두 번째로, 리더가 가진 힘을 6장 권력과 영향력 전술로 보겠습니다.");

// =====================================================================
// 12. 권력과 영향력 전술
// =====================================================================
{
  const s = content("03  리더십 스킬 · 권력과 영향력 전술 (6장)", "자리에서 나온 힘, 사람에게서 나온 힘",
    "출처: 강의자료 6장 · 언론 보도 (참고자료) · 사진: 언론 보도, 정 부회장 인스타그램");
  const pw = 4.0, ph = 6.55 - TOP, gh = pw * 295 / 880;
  photo(s, "E_panel", M, TOP, pw, ph - gh - 0.21);
  photo(s, "G_header", M, TOP + ph - gh, pw, gh);
  const x0 = M + pw + 0.35, w0 = SW - M - x0, gap = 0.2, tw = (w0 - gap) / 2, th = (ph - 0.45 - gap) / 2;
  T(s, "직위 권력", { x: x0, y: TOP, w: tw, h: 0.35, fontSize: 13, bold: true, color: C.text2 });
  T(s, "개인적 권력", { x: x0 + tw + gap, y: TOP, w: tw, h: 0.35, fontSize: 13, bold: true, color: C.text2 });
  const tiles = [
    [0, 0, "합법적 권력", "합법적 수단", "23년째 대표이사"],
    [1, 0, "전문적 권력", "합리적 설득", "서울대 강연\n“진짜 승부수는 데이터 설계”"],
    [0, 1, "관계적 권력", "제휴", "그룹 오너 일가의 사위"],
    [1, 1, "준거적 권력", "영감적 호소", "SNS 팔로워 6.5만\n“AI가 성공 엔진”"],
  ];
  tiles.forEach(([c, r, p, tac, ev]) => {
    const x = x0 + c * (tw + gap), y = TOP + 0.45 + r * (th + gap), dark = c === 1;
    rect(s, { x, y, w: tw, h: th, fill: { color: dark ? C.text1 : C.background2 } });
    T(s, p, { x: x + 0.3, y: y + 0.25, w: tw - 0.5, h: 0.45, fontSize: 20, bold: true, color: dark ? C.background1 : C.text1 });
    rrect(s, { x: x + 0.3, y: y + 0.8, w: 1.6, h: 0.38, rectRadius: 0.05, fill: { color: C.accent1 } });
    T(s, tac, { x: x + 0.3, y: y + 0.8, w: 1.6, h: 0.38, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle" });
    T(s, ev, { x: x + 0.3, y: y + 1.28, w: tw - 0.4, h: 0.62, fontSize: 14, color: dark ? C.background1 : C.text1, valign: "middle", lineSpacingMultiple: 1.1 });
  });
  s.addNotes("6장에서 권력은 직위권력과 개인적 권력으로 나뉘고, 유형마다 쓰는 전술이 다르다고 배웠습니다. 정 부회장은 23년째 대표이사라는 합법적 권력을 갖고 있고, 그룹 오너 일가의 사위라는 관계적 권력도 있습니다. 실제로 2023년 불황에도 장기 투자와 고객 혜택을 유지하자, 업계에서는 단기 성과에 얽매이지 않는 점이 부럽다는 평가가 나왔습니다. 개인적 권력도 씁니다. 사진처럼 올해 서울대 강연에서 자체 LLM보다 데이터 설계가 더 중요하다는 논리를 직접 설명했는데, 전문적 권력을 바탕으로 한 합리적 설득입니다. 또 아래 화면처럼 인스타그램 팔로워가 6만 5천 명에 이를 만큼 영향력이 크고, '마케팅 천재'라는 명성까지 있습니다. 이걸 바탕으로 '브랜드가 아니라 AI가 성공 엔진'이라는 비전을 던지는 건 준거적 권력을 통한 영감적 호소입니다.");
}

section("04", "조직 리더십", "9장 위기관리 · 변화관리", "세 번째로, 조직을 어떻게 움직였는지를 9장 위기관리와 변화관리로 보겠습니다.");

// =====================================================================
// 14. 위기관리 2023
// =====================================================================
{
  const s = content("04  조직 리더십 · 위기관리 리더십 (9장)", "2023년 고금리, 위기를 미리 읽다",
    "출처: 강의자료 9장 · 언론 보도 (참고자료)");
  const y0 = TOP, h0 = 3.75, gap = 0.25, lw = 3.4, rw = 3.4, mw = W - lw - rw - gap * 2;
  rect(s, { x: M, y: y0, w: lw, h: h0, fill: { color: C.text1 } });
  T(s, "2023 신년사", { x: M + 0.4, y: y0 + 0.35, w: lw - 0.8, h: 0.3, fontSize: 14, bold: true, color: C.accent1 });
  T(s, "‘알려진\n위기’", { x: M + 0.4, y: y0 + 0.9, w: lw - 0.6, h: 1.8, fontSize: 44, bold: true, color: C.background1, valign: "middle", lineSpacingMultiple: 1.05 });
  T(s, "위기 뒤에는 기회", { x: M + 0.4, y: y0 + 2.85, w: lw - 0.7, h: 0.4, fontSize: 16, color: HEX.darkSub });
  const mx = M + lw + gap;
  T(s, "위기 상황에서 리더의 역할", { x: mx + 0.1, y: y0 + 0.05, w: mw, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
  const roles = [["위기 인식 · 신속 판단", "2022년부터 포트폴리오 조정"], ["명확한 커뮤니케이션", "신년사로 위기 진단"], ["자원의 전략적 배분", "외형 경쟁↓, 장기 투자 유지"]];
  const rh = (h0 - 0.45) / 3;
  roles.forEach(([k, v], i) => {
    const y = y0 + 0.45 + i * rh;
    if (i > 0) hline(s, mx + 0.1, y, mw - 0.1);
    T(s, [{ text: k, options: { fontSize: 13, color: C.text2, breakLine: true } }, { text: v, options: { bold: true } }],
      { x: mx + 0.1, y, w: mw - 0.1, h: rh, fontSize: 19, valign: "middle", paraSpaceAfter: 2 });
  });
  const rx = mx + mw + gap;
  rect(s, { x: rx, y: y0, w: rw, h: h0, fill: { color: C.accent1 } });
  T(s, "결과", { x: rx + 0.4, y: y0 + 0.35, w: rw - 0.8, h: 0.3, fontSize: 14, bold: true, color: C.background1 });
  [["2,257억", "2023 3분기 누적 순이익 (+8.6%)"], ["유일", "순이익이 늘어난 카드사"]].forEach(([b, l], i) => {
    const y = y0 + 0.8 + i * 1.45;
    if (i > 0) hline(s, rx + 0.4, y - 0.12, rw - 0.8, "E8836F");
    T(s, b, { x: rx + 0.4, y, w: rw - 0.6, h: 0.8, fontSize: 40, bold: true, color: C.background1, valign: "bottom" });
    T(s, l, { x: rx + 0.4, y: y + 0.82, w: rw - 0.6, h: 0.35, fontSize: 14, color: C.background1, valign: "top" });
  });
  const ty = y0 + h0 + 0.25, th = 6.55 - ty;
  rect(s, { x: M, y: ty, w: W, h: th, fill: { color: C.background2 } });
  T(s, [{ text: "쟁점  ", options: { bold: true, color: C.accent1 } }, { text: "‘알려진 위기’ → 대응보다 ", options: {} }, { text: "사전 예방적 리더십", options: { bold: true } }],
    { x: M + 0.4, y: ty, w: W - 0.8, h: th, fontSize: 17, valign: "middle" });
  s.addNotes("2023년 고금리 상황은 9장 위기관리로 봤습니다. 정 부회장은 2022년부터 미리 자산 포트폴리오를 조정했습니다. 금리가 오르고 경제가 불안할 때 외형 경쟁은 무모하다는 판단이었습니다. 2023년 신년사에서는 이번 금융위기를 '알려진 위기'라고 진단하고, 위기 뒤에는 기회가 온다고 강조했습니다. 그러면서도 장기 성장 투자와 고객 혜택은 유지했습니다. 강의의 위기 상황에서 리더의 역할 중 위기 인식과 신속한 판단, 명확한 커뮤니케이션, 자원의 전략적 배분에 해당합니다. 결과적으로 대부분 카드사가 역성장한 2023년에 3분기 누적 순이익 2,257억 원으로 8.6% 늘었고, 순이익이 늘어난 카드사는 현대카드뿐이었습니다. 다만 쟁점이 하나 있습니다. 강의에서 위기는 미리 예측하기 어려운 사건이라고 했는데, 정 부회장 스스로 '알려진 위기'라고 했습니다. 그래서 이 사례는 위기 대응보다는 9장에서 말하는 사전 예방적 리더십에 더 가깝다고 봤습니다.");
}

// =====================================================================
// 15. Kotter 8단계
// =====================================================================
{
  const s = content("04  조직 리더십 · 변화관리 Kotter 8단계 (9장)", "AI 전환은 6단계까지, 문화 정착은 아직",
    "출처: 강의자료 9장 · 언론 보도 (참고자료)");
  const steps = [
    ["긴급성 창출", "“디지털화는 선택이 아니었다”", 2],
    ["변화연합 구성", "리더 260여 명 LLM 실습", 2],
    ["비전과 전략", "AI = 성공의 엔진, 데이터에 5,000억", 2],
    ["비전 커뮤니케이션", "신년사 · SNS · 직접 실습", 2],
    ["역량 강화 · 장애 제거", "AWS AI 인프라, 코딩 에이전트", 2],
    ["단기성과 창출", "유니버스 일본 수출 (2024.10)", 2],
    ["성과 기반 확산", "연 2곳 추가 수출 목표", 1],
    ["변화의 정착", "인사 · 보상 반영 근거 없음", 0],
  ];
  const gap = 0.2, tw = (W - gap * 3) / 4, th = 1.95;
  steps.forEach(([t, ev, st], i) => {
    const c = i % 4, r = Math.floor(i / 4), x = M + c * (tw + gap), y = TOP + r * (th + gap);
    const done = st === 2, prog = st === 1;
    rect(s, { x, y, w: tw, h: th, fill: { color: done ? C.text1 : prog ? C.background2 : "FFFFFF" }, line: st === 0 ? { color: HEX.accent, width: 1.5, dashType: "dash" } : { type: "none" } });
    T(s, `${i + 1}`, { x: x + 0.3, y: y + 0.2, w: 0.6, h: 0.5, fontSize: 24, bold: true, color: done ? C.accent1 : prog ? C.text1 : HEX.accent });
    T(s, done ? "충족" : prog ? "진행 중" : "확인 필요", { x: x + tw - 1.4, y: y + 0.25, w: 1.15, h: 0.3, fontSize: 12, bold: true, color: done ? HEX.darkSub : prog ? C.text2 : HEX.accent, align: "right" });
    T(s, t, { x: x + 0.3, y: y + 0.75, w: tw - 0.5, h: 0.4, fontSize: 18, bold: true, color: done ? C.background1 : C.text1 });
    T(s, ev, { x: x + 0.3, y: y + 1.2, w: tw - 0.45, h: 0.6, fontSize: 13, color: done ? HEX.darkSub : C.text2, valign: "top", lineSpacingMultiple: 1.15 });
  });
  s.addNotes("AI 전환은 9장 Kotter의 8단계 변화관리 모델로 정리했습니다. 단순한 카드사로는 살아남기 어렵다는 판단으로 긴급성을 만들었고, 의사결정권자인 팀장 이상 리더 260여 명부터 LLM 실습을 하게 해서 변화연합을 만들었습니다. 'AI가 성공의 엔진'이라는 비전과, AI 예산 1조 원 중 약 5,000억 원을 데이터 설계에 쓰는 전략을 세웠고, 신년사와 SNS, 그리고 본인이 직접 노트북으로 실습하는 모습으로 비전을 전달했습니다. 강의에서 최고경영진은 부하에게 보기 원하는 변화를 자신이 먼저 체화해야 한다고 했는데, 바로 이 모습입니다. AWS 기반 AI 인프라와 코딩 에이전트로 장애를 없앴고, 2024년 유니버스 일본 수출이라는 단기성과도 냈습니다. 7단계 확산은 연 2곳 추가 수출을 목표로 진행 중입니다. 하지만 8단계, 변화를 인사평가나 보상에 반영했다는 근거는 아직 찾지 못했습니다. 그래서 변화가 문화로 정착했다고 보기는 이릅니다.");
}

// =====================================================================
// 16. 결론
// =====================================================================
{
  const s = content("05  결론", "위기를 먼저 읽고, 먼저 움직인 리더");
  const cols = [
    ["사람", "위험을 먼저 택하고\n높은 목표를 던짐", "특성 · House · Fiedler"],
    ["힘", "자리의 힘 위에\n전문성 · 비전을 더함", "6장 권력"],
    ["조직", "위기를 미리 읽고\n변화를 직접 시범", "9장 위기 · 변화"],
  ];
  const gap = 0.3, cw = (W - gap * 2) / 3, ch = 2.2;
  cols.forEach(([k, t, th], i) => {
    const x = M + i * (cw + gap);
    rect(s, { x, y: TOP, w: cw, h: ch, fill: { color: C.text1 } });
    T(s, k, { x: x + 0.35, y: TOP + 0.3, w: cw - 0.6, h: 0.5, fontSize: 26, bold: true, color: C.accent1 });
    T(s, t, { x: x + 0.35, y: TOP + 0.95, w: cw - 0.6, h: 0.95, fontSize: 19, bold: true, color: C.background1, valign: "top", lineSpacingMultiple: 1.15 });
  });
  const ry = TOP + ch + 0.35;
  T(s, "남은 과제", { x: M, y: ry, w: 3, h: 0.35, fontSize: 14, bold: true, color: C.accent1 });
  const rw = (W - gap * 2) / 3;
  [["변화의 문화 정착", "Kotter 8단계 미확인"], ["위험 감수의 대가", "애플페이 효과 한계"], ["리더 한 명에 기대는 구조", "23년 장기 재임"]].forEach(([t, d], i) => {
    const x = M + i * (rw + gap);
    rect(s, { x, y: ry + 0.45, w: rw, h: 1.3, fill: { color: C.background2 } });
    T(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.text2 } }],
      { x: x + 0.35, y: ry + 0.45, w: rw - 0.6, h: 1.3, fontSize: 19, valign: "middle", paraSpaceAfter: 4 });
  });
  s.addNotes("처음 질문으로 돌아가면, 카드사를 AI 회사로 바꾸는 힘은 세 군데서 나왔습니다. 사람으로서는 위험을 먼저 택하고 낯선 일에 높은 목표를 던지는 리더였고, 힘으로 보면 대표이사라는 자리의 힘 위에 전문성과 비전이라는 개인적 권력을 더했습니다. 조직 차원에서는 위기를 미리 읽고 대비했고, AI 전환은 리더가 직접 시범을 보이며 이끌었습니다. 다만 남은 과제도 있습니다. 변화가 인사와 보상까지 반영돼 문화로 정착했는지는 아직 확인되지 않았고, 애플페이처럼 위험을 감수한 선택이 늘 좋은 결과로 이어지지는 않았습니다. 또 23년째 한 사람에게 기대는 구조라는 점도 앞으로 지켜봐야 할 부분입니다.");
}

// =====================================================================
// 17. 참고자료
// =====================================================================
{
  const s = content("부록", "참고자료");
  const left = [
    ["이론", ["리더십 강의자료 2장 특성이론, 4장 리더십 상황이론, 6장 권력·정치·네트워크·협상, 9장 변화관리·위기관리 리더십"]],
    ["공시 · 회사", [
      "현대카드, 「반기보고서」 제32기, 2026.8.14 제출, DART",
      "현대카드, 日 ‘빅3 카드사’에 AI 플랫폼 수출 (2024.10.17)",
    ]],
    ["개인 리더십", [
      "다음/뉴스, 애플페이 확산 또 제동…신한·국민 연내 도입 ‘안갯속’ (2026.7.3)",
      "딜사이트, 현대카드 애플페이 약발 벌써 끝? (2023.5.25)",
      "헤럴드경제, 정태영 “유니버스 추가 수출로 궤도 안착 자신” (2025.9.22)",
      "한국경제, 정태영 알리바바·유니트리 방문 (2026.9.29)",
      "한경비즈니스, 2025 파워금융인30: 정태영 (2025.4)",
    ]],
  ];
  const right = [
    ["리더십 스킬", [
      "딜사이트, 불황 속 장기 투자·고객 혜택 유지 (2023.11.27)",
      "헤럴드경제, “AI 시대 진짜 승부수는 데이터 설계” (2026.4.8)",
    ]],
    ["조직 리더십", [
      "인더뉴스, 정태영 2023 신년사 (2023.1.4)",
      "딜사이트, 선제적 포트폴리오 조정 (2023.12.28)",
      "CEO스코어데일리, 카드사 순이익 고금리 장기화 (2023.12)",
      "한경비즈니스, 카드 부문 올해의 CEO (2024.12)",
      "헤럴드경제, 리더그룹 LLM 실습 교육 (2026.3.8)",
      "헤럴드경제, “AI 시대 데이터 설계가 승부처” (2026.4.8)",
      "한국경제, 정태영 LLM 교육 참여 (2026.8.20)",
      "디지털데일리, 현대카드 AWS AI 서비스 (2026.5)",
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
    T(s, runs, { x: M + ci * (colW + 0.8), y: TOP - 0.15, w: colW, h: 4.85, fontSize: 11, valign: "top", paraSpaceAfter: 4, lineSpacingMultiple: 1.1 });
  });
  s.addNotes("참고한 자료입니다. 따로 설명하지 않고 넘어가셔도 됩니다.");
}

// =====================================================================
// 18. 마무리
// =====================================================================
{
  const s = slide(true);
  T(s, "감사합니다", { x: M, y: 2.55, w: 5.5, h: 0.9, fontSize: 44, bold: true, color: C.background1, valign: "middle" });
  T(s, "질문 받겠습니다", { x: M, y: 3.5, w: 5.5, h: 0.45, fontSize: 20, color: HEX.darkSub });
  T(s, [
    { text: "○조", options: { bold: true, color: C.background1, breakLine: true } },
    { text: "조원1 · 조원2 · 조원3 · 조원4", options: { color: HEX.darkSub } },
  ], { x: M, y: 5.9, w: 6, h: 0.7, fontSize: 13, valign: "bottom", paraSpaceAfter: 3 });
  photo(s, "I_close", SW - 6.6, 0, 6.6, SH);
  s.addNotes("이상으로 발표를 마치겠습니다. 질문 주시면 답변드리겠습니다.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
