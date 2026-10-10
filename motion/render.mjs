// Frame-accurate renderer: serves the repo over a local HTTP server (ES modules need http, not file://),
// loads an HTML comp exposing window.COMP={w,h,fps,frames} and window.renderFrame(f) (may be async),
// screenshots every frame to PNG, then encodes with ffmpeg.
// usage: node motion/render.mjs <comp.html> <out.mp4> [startFrame] [endFrame] [--every N]  (--every: preview stills only)
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright'); // resolved via NODE_PATH (preinstalled)

const args = process.argv.slice(2);
const framesIdx = args.indexOf('--frames'); const only = framesIdx >= 0 ? args.splice(framesIdx, 2)[1].split(',').map(Number) : null;
const everyIdx = args.indexOf('--every'); const every = everyIdx >= 0 ? Number(args.splice(everyIdx, 2)[1]) : 1;
const [compPath, outPath, s, e] = args;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webp': 'image/webp' };
const root = process.cwd();
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !existsSync(p)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }).end(readFileSync(p));
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', err => console.error('pageerror:', err.message));
await page.goto(`http://127.0.0.1:${server.address().port}/${compPath}`);
await page.waitForFunction(() => window.COMP && window.renderFrame && (window.ready ?? true), null, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const comp = await page.evaluate(() => window.COMP);
await page.setViewportSize({ width: comp.w, height: comp.h });
const start = Number(s ?? 0), end = Number(e ?? comp.frames);
const dir = outPath.replace(/\.mp4$/, '_frames');
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const t0 = Date.now();
const list = only ?? Array.from({ length: Math.ceil((end - start) / every) }, (_, i) => start + i * every);
for (const f of list) {
  await page.evaluate(f => window.renderFrame(f), f);
  await page.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.png`, clip: { x: 0, y: 0, width: comp.w, height: comp.h } });
}
await browser.close(); server.close();
let ff = { status: 'skipped (preview stills)' };
if (every === 1 && !only) ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(comp.fps), '-start_number', String(start),
  '-i', `${dir}/%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', outPath], { stdio: 'inherit' });
const log = `${new Date().toISOString()} render ${compPath} -> ${outPath} frames ${start}-${end} step ${every} ${comp.w}x${comp.h}@${comp.fps} in ${((Date.now() - t0) / 1000).toFixed(1)}s ffmpeg=${ff.status}\n`;
appendFileSync('proof/render_log.txt', log); process.stdout.write(log);
