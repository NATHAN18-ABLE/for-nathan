/* hero-sequence.js : 영상을 쪼갠 이미지(프레임)를 스크롤에 맞춰 canvas 에 그립니다.
   첫 장을 먼저, 그다음 듬성듬성(8장 간격 → 4장 간격 → 나머지) 받아서 첫 화면이 빨리 뜹니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.createSequence = function (canvas, set, onReady, onFail) {
  const ctx = canvas.getContext("2d");
  const count = set.count;
  const frames = new Array(count);
  let w = 0, h = 0, dpr = 1;
  let progress = 0;
  let lastDrawn = -1;

  const url = (i) => `${set.path}${String(i + 1).padStart(4, "0")}.${set.ext || "webp"}`;

  function load(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames[i] = img; resolve(true); };
      img.onerror = () => resolve(false);
      img.src = url(i);
    });
  }

  /* 받는 순서: 0, 8의 배수, 4의 배수, 2의 배수, 나머지 */
  function order() {
    const seen = new Set([0]);
    const list = [];
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) {
        if (!seen.has(i)) { seen.add(i); list.push(i); }
      }
    }
    return list;
  }

  async function start() {
    const ok = await load(0);
    if (!ok) { onFail && onFail(); return; }
    onReady && onReady();
    draw(true);
    const queue = order();
    const workers = 6;
    let cursor = 0;
    const next = async () => {
      while (cursor < queue.length) {
        const i = queue[cursor++];
        await load(i);
        if (Math.abs(i - target()) < 6) draw(true);
      }
    };
    for (let k = 0; k < workers; k++) next();
  }

  const target = () => Math.round(progress * (count - 1));

  /* 아직 안 받은 프레임이면 가장 가까운 받은 프레임을 씀 */
  function nearest(i) {
    if (frames[i]) return frames[i];
    for (let d = 1; d < count; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(true);
  }

  /* 화면을 꽉 채우도록(cover) 잘라서 그림 */
  function draw(force) {
    const i = target();
    if (!force && i === lastDrawn) return;
    const img = nearest(i);
    if (!img || !w) return;
    lastDrawn = i;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  return {
    start,
    resize,
    render() { draw(false); },
    setProgress(p) { progress = p; },
    setPointer() {},
    animated: false
  };
};
