// Builds the single-file app from src/.
//   dist/boardroom.html  page fragment for publishing as a claude.ai artifact
//   index.html           full document to open locally in a browser
// Run: node boardroom/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, "src", p));

const font = (file, family) =>
  `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${src("fonts/" + file).toString("base64")}) format("woff2");font-display:block;}`;

const fonts = [font("Galmuri11.woff2", "Galmuri11"), font("Galmuri11-Bold.woff2", "Galmuri11 Bold"), font("Galmuri7.woff2", "Galmuri7")].join("\n");
const css = src("app.css").toString();
const html = src("app.html").toString();
const js = ["data.js", "art.js", "app.js", "office.js", "talk.js", "career.js", "work.js"].map((f) => src(f).toString()).join("\n");

const head = `<title>작전 회의실</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="원준 님의 취업을 돕는 AI 팀이 픽셀아트 사무실에서 일하고, 1:1로 대화하고, 소집하면 회의하는 커리어 본부">
<style>
/* Galmuri11 and Galmuri7 by Lee Minseo, SIL Open Font License 1.1 (src/fonts/Galmuri-OFL.txt) */
${fonts}
${css}
</style>`;

const body = `${html}
<script>
"use strict";
${js}
</script>`;

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "boardroom.html"), `${head}\n${body}\n`);

writeFileSync(
  join(root, "index.html"),
  `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="theme-color" content="#0a0f1f">
<meta name="color-scheme" content="dark">
${head}
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
</head>
<body>
${body}
</body>
</html>
`,
);
console.log("built dist/boardroom.html and index.html");
