/* ink-smoke.js : 히어로 영상이 없을 때 쓰는 임시 화면.
   먹이 물에 번지듯 퍼지는 연기 + 빛을 받을 때만 반짝이는 금박 조각.
   스크롤 진행률(0~1)에 따라 연기가 피어오르고 흩어집니다. */
window.SITE = window.SITE || {};
SITE.fx = SITE.fx || {};

SITE.fx.createInkSmoke = function (canvas) {
  const ctx = canvas.getContext("2d");
  const low = document.createElement("canvas");   // 저해상도로 그려서 부드럽게 확대
  const lctx = low.getContext("2d");
  const SCALE = 0.5;

  /* 같은 화면이 매번 나오도록 고정된 난수 */
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const plumes = Array.from({ length: 22 }, (_, i) => ({
    x: 0.12 + rand() * 0.76,
    y: 0.6 + rand() * 0.5,
    r: 0.08 + rand() * 0.16,
    rise: 0.45 + rand() * 0.6,
    drift: (rand() - 0.5) * 0.6,
    phase: rand() * Math.PI * 2,
    speed: 0.05 + rand() * 0.08,
    tone: i % 6 === 0 ? 0.13 : 0.05 + rand() * 0.06
  }));

  const flakes = Array.from({ length: 14 }, () => ({
    x: rand(),
    y: rand(),
    size: 3 + rand() * 5,
    spin: 0.4 + rand() * 1.2,
    angle: rand() * Math.PI * 2,
    fall: 0.004 + rand() * 0.01,
    sway: rand() * Math.PI * 2,
    shape: [rand(), rand(), rand(), rand()]
  }));

  let w = 0, h = 0, dpr = 1;
  let progress = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    low.width = Math.max(1, Math.round(w * SCALE));
    low.height = Math.max(1, Math.round(h * SCALE));
  }

  function drawSmoke(time) {
    const lw = low.width, lh = low.height;
    lctx.globalCompositeOperation = "source-over";
    lctx.fillStyle = "#080808";
    lctx.fillRect(0, 0, lw, lh);
    lctx.globalCompositeOperation = "lighter";

    const px = pointer.x * lw * 0.03;
    const py = pointer.y * lh * 0.03;

    for (const p of plumes) {
      const t = time * p.speed + p.phase;
      const grow = 1 + progress * 0.9;
      const cx = (p.x + Math.sin(t) * 0.03 + p.drift * progress * 0.4) * lw + px;
      const cy = (p.y - progress * p.rise + Math.cos(t * 0.8) * 0.02) * lh + py;
      const r = p.r * Math.max(lw, lh) * grow;
      const fade = p.tone * (1 - progress * 0.7);
      const g = lctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(242, 237, 229, ${fade})`);
      g.addColorStop(0.45, `rgba(182, 175, 164, ${fade * 0.45})`);
      g.addColorStop(1, "rgba(8, 8, 8, 0)");
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.ellipse(cx, cy, r * 0.7, r * 1.15, Math.sin(t) * 0.35, 0, Math.PI * 2);
      lctx.fill();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(low, 0, 0, canvas.width, canvas.height);
  }

  /* 금박: 평평한 금색이 아니라, 회전하며 빛을 받는 순간에만 밝아지는 얇은 조각 */
  function drawFlakes(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const f of flakes) {
      const a = f.angle + time * f.spin;
      const glint = Math.pow(Math.abs(Math.cos(a)), 6);
      const x = ((f.x + Math.sin(time * 0.3 + f.sway) * 0.01) * w) + pointer.x * 10;
      const y = (((f.y + time * f.fall - progress * 0.25) % 1 + 1) % 1) * h + pointer.y * 10;
      const s = f.size * (0.35 + 0.65 * Math.abs(Math.cos(a)));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a * 0.5);
      ctx.fillStyle = `rgba(200, 169, 110, ${0.18 + glint * 0.62})`;
      ctx.beginPath();
      ctx.moveTo(-s * f.shape[0], -f.size * 0.4);
      ctx.lineTo(s * f.shape[1] + 1, -f.size * 0.2);
      ctx.lineTo(s * 0.8, f.size * f.shape[2] * 0.5);
      ctx.lineTo(-s * f.shape[3], f.size * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function render(time) {
    if (!w || !h) return;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    drawSmoke(time);
    drawFlakes(time);
  }

  return {
    resize,
    render,
    setProgress(p) { progress = p; },
    setPointer(nx, ny) { pointer.tx = nx; pointer.ty = ny; },
    /* 계속 움직여야 하는지 (연기는 천천히 흐름) */
    animated: true
  };
};
