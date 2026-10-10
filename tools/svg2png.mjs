// usage: node tools/svg2png.mjs in.svg out.png width [bg]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, inp, out, width, bg = 'white'] = process.argv;
const svg = readFileSync(inp, 'utf8'); const [, , vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
const W = Number(width), H = Math.round(W * vh / vw);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
await p.setContent(`<style>html,body{margin:0;background:${bg}}svg{display:block;width:${W}px;height:${H}px}</style>${svg}`);
await p.screenshot({ path: out, omitBackground: bg === 'transparent' }); await b.close();
