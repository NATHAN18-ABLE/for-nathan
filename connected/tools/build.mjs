// src/template.html + assets → 단일 파일 index.html (file:// 에서도 폰트·데이터가 그대로 동작하도록 인라인)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (f) => readFileSync(join(root, 'assets', f)).toString('base64');
const assets = {
  cinzel600: b64('cinzel-latin-600-normal.woff2'),
  cormorantItalic: b64('cormorant-garamond-latin-500-italic.woff2'),
  cormorant: b64('cormorant-garamond-latin-500-normal.woff2'),
  jetbrains: b64('jetbrains-mono-latin-400-normal.woff2'),
  land: b64('land-720x360.bin'),
};
const html = readFileSync(join(root, 'src', 'template.html'), 'utf8')
  .replace('<!--ASSETS-->', `<script>window.ASSETS = ${JSON.stringify(assets)};</script>`);
writeFileSync(join(root, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0), 'KB');
