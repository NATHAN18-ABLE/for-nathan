// Natural Earth(공개 도메인) 1:50m 육지 → 등장방형 1비트 마스크 (720×360)
// 사용: node gen-land.mjs <land-50m.json> <topojson-client dir> <out.bin>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const [, , src, clientDir, out] = process.argv;
const require = createRequire(import.meta.url);
const topojson = require(clientDir);
const topo = JSON.parse(readFileSync(src, 'utf8'));
const land = topojson.feature(topo, topo.objects.land);
const W = 720, H = 360;
const edges = [];
for (const f of land.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i], [x1, y1] = ring[i + 1];
      if (Math.abs(x1 - x0) > 180) continue; // 날짜변경선을 가로지르는 가짜 변
      edges.push([(x0 + 180) / 360 * W, (90 - y0) / 180 * H, (x1 + 180) / 360 * W, (90 - y1) / 180 * H]);
    }
  }
}
const bits = new Uint8Array(W * H / 8);
for (let y = 0; y < H; y++) {
  const sy = y + 0.5, xs = [];
  for (const [x0, y0, x1, y1] of edges) {
    if ((y0 <= sy) !== (y1 <= sy)) xs.push(x0 + (sy - y0) / (y1 - y0) * (x1 - x0));
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x < Math.min(W, xs[k + 1] - 0.5); x++) {
      const i = y * W + x; bits[i >> 3] |= 1 << (i & 7);
    }
  }
}
writeFileSync(out, bits);
let n = 0; for (const b of bits) for (let k = 0; k < 8; k++) n += (b >> k) & 1;
console.log('land fraction', (n / (W * H)).toFixed(3));
