// Frame-accurate renderer: loads an HTML comp exposing window.renderFrame(f) and window.COMP={w,h,fps,frames},
// screenshots every frame to PNG, then encodes with ffmpeg.
// usage: node motion/render.mjs <comp.html> <out.mp4> [startFrame] [endFrame]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // resolved via NODE_PATH (preinstalled)
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const [,, compPath, outPath, s, e] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.resolve(compPath));
await page.evaluate(() => document.fonts.ready);
const comp = await page.evaluate(() => window.COMP);
await page.setViewportSize({ width: comp.w, height: comp.h });
const start = Number(s ?? 0), end = Number(e ?? comp.frames);
const dir = outPath.replace(/\.mp4$/, '_frames');
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const t0 = Date.now();
for (let f = start; f < end; f++) {
  await page.evaluate(f => window.renderFrame(f), f);
  await page.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.png`, clip: { x: 0, y: 0, width: comp.w, height: comp.h } });
}
await browser.close();
const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(comp.fps), '-start_number', String(start),
  '-i', `${dir}/%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', outPath], { stdio: 'inherit' });
const log = `${new Date().toISOString()} render ${compPath} -> ${outPath} frames ${start}-${end} ${comp.w}x${comp.h}@${comp.fps} in ${((Date.now()-t0)/1000).toFixed(1)}s ffmpeg=${ff.status}\n`;
appendFileSync('proof/render_log.txt', log); process.stdout.write(log);
