// ---------------------------------------------------------------------------
// Pixel art, all drawn in code. Logical scene is 384x216; sprites are 16x24.
// ---------------------------------------------------------------------------

const SKIN = ["#f5d7bd", "#e9bf98", "#d39f74", "#a8704a", "#7a4e32"];
const HAIR = ["#1c1a26", "#4a3122", "#7b5230", "#b8854a", "#cfcac0", "#8a2f45", "#34407a"];
const SUIT = ["#2c3d73", "#4f2f66", "#235a52", "#6a2d33", "#3c3f4f", "#6b5826", "#1f3346"];
const STYLE_NAMES = ["짧은 머리", "가르마", "단발", "묶은 머리", "짧게 민 머리"];
const ACC_NAMES = ["없음", "안경", "헤드셋", "넥타이"];
const CEO_LOOK = { skin: 1, hair: 0, style: 1, suit: 6, acc: 3 };
const EXT_AUDIT_LOOK = { skin: 2, hair: 4, style: 4, suit: 4, acc: 1 };

const W = 384, H = 216;
const TABLE = { x: 92, y: 104, w: 200, h: 42, face: 8 };

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x | 0, y | 0, w, h);
}

// One character, 16 wide. y is the top of the head; hair styles can reach y-2.
function drawPerson(g, x, y, look, o = {}) {
  const skin = SKIN[look.skin] || SKIN[0];
  const sd = shade(skin, 0.82);
  const hair = HAIR[look.hair] || HAIR[0];
  const hd = shade(hair, 0.78);
  const hl = shade(hair, 1.3);
  const suit = SUIT[look.suit] || SUIT[0];
  const cd = shade(suit, 0.74);
  const cl = shade(suit, 1.22);
  const ink = "#15121e";
  const back = o.facing === "back";
  const style = look.style | 0;

  // torso and arms
  rect(g, x + 3, y + 12, 10, 13, suit);
  rect(g, x + 2, y + 13, 1, 10, cd);
  rect(g, x + 13, y + 13, 1, 10, cd);
  rect(g, x + 3, y + 12, 10, 1, cl);
  rect(g, x + 1, y + 14, 1, 7, cd);
  rect(g, x + 14, y + 14, 1, 7, cd);
  if (!back) {
    rect(g, x + 6, y + 12, 4, 1, "#e8ecf5");
    rect(g, x + 7, y + 13, 2, 2, "#e8ecf5");
    if (look.acc === 3) {
      rect(g, x + 7, y + 13, 2, 1, "#c9354a");
      rect(g, x + 7, y + 14, 2, 5, "#a82a3d");
    }
    rect(g, x + 7, y + 15, 2, 9, shade(suit, 0.86));
  } else {
    rect(g, x + 7, y + 14, 2, 10, cd);
  }
  // neck
  rect(g, x + 7, y + 10, 2, 2, sd);

  // head
  rect(g, x + 4, y + 1, 8, 8, skin);
  rect(g, x + 5, y + 9, 6, 1, skin);
  rect(g, x + 3, y + 5, 1, 2, sd);
  rect(g, x + 12, y + 5, 1, 2, sd);

  if (back) {
    // the back of the head is mostly hair
    const bh = style === 4 ? shade(hair, 1.12) : hair;
    rect(g, x + 4, y, 8, 9, bh);
    rect(g, x + 3, y + 1, 10, 6, bh);
    rect(g, x + 5, y + 9, 6, 1, style === 2 ? hair : sd);
    if (style === 2) rect(g, x + 3, y + 7, 10, 3, hair);
    if (style === 3) rect(g, x + 6, y - 2, 4, 3, hd);
    rect(g, x + 6, y, 3, 1, hl);
  } else {
    // hair, front
    if (style === 0) {
      rect(g, x + 4, y, 8, 3, hair);
      rect(g, x + 3, y + 1, 1, 4, hair);
      rect(g, x + 12, y + 1, 1, 4, hair);
      rect(g, x + 4, y + 3, 3, 1, hair);
    } else if (style === 1) {
      rect(g, x + 4, y, 8, 2, hair);
      rect(g, x + 3, y + 1, 1, 5, hair);
      rect(g, x + 12, y + 1, 1, 4, hair);
      rect(g, x + 4, y + 2, 5, 2, hair);
      rect(g, x + 9, y + 2, 3, 1, hair);
    } else if (style === 2) {
      rect(g, x + 3, y, 10, 3, hair);
      rect(g, x + 3, y + 3, 2, 7, hair);
      rect(g, x + 11, y + 3, 2, 7, hair);
      rect(g, x + 5, y + 3, 6, 1, hair);
      rect(g, x + 3, y + 9, 2, 1, hd);
      rect(g, x + 11, y + 9, 2, 1, hd);
    } else if (style === 3) {
      rect(g, x + 6, y - 2, 4, 2, hd);
      rect(g, x + 4, y, 8, 3, hair);
      rect(g, x + 3, y + 1, 1, 4, hair);
      rect(g, x + 12, y + 1, 1, 4, hair);
    } else {
      rect(g, x + 4, y, 8, 2, shade(hair, 1.12));
      rect(g, x + 3, y + 1, 1, 2, hair);
      rect(g, x + 12, y + 1, 1, 2, hair);
    }
    rect(g, x + 6, y, 2, 1, hl);

    // face
    const eyeY = look.acc === 1 ? y + 6 : y + 5;
    if (o.blink) {
      rect(g, x + 6, eyeY + 1, 1, 1, ink);
      rect(g, x + 9, eyeY + 1, 1, 1, ink);
    } else {
      rect(g, x + 6, eyeY, 1, 2, ink);
      rect(g, x + 9, eyeY, 1, 2, ink);
    }
    if (look.acc === 1) {
      rect(g, x + 5, y + 5, 3, 1, "#2b2b3a");
      rect(g, x + 8, y + 5, 3, 1, "#2b2b3a");
      rect(g, x + 5, y + 6, 1, 1, "#2b2b3a");
      rect(g, x + 10, y + 6, 1, 1, "#2b2b3a");
    }
    rect(g, x + 7, y + 7, 1, 1, sd);
    if (o.talk) {
      rect(g, x + 7, y + 8, 2, 1, "#7a3340");
    } else {
      rect(g, x + 7, y + 8, 2, 1, shade(skin, 0.7));
    }
    if (o.frown) rect(g, x + 6, eyeY - 1, 1, 1, hd), rect(g, x + 9, eyeY - 1, 1, 1, hd);
  }

  if (look.acc === 2) {
    rect(g, x + 4, y - 1, 8, 1, "#2d2f3a");
    rect(g, x + 3, y, 1, 3, "#2d2f3a");
    rect(g, x + 12, y, 1, 3, "#2d2f3a");
    rect(g, x + 2, y + 4, 2, 3, "#2d2f3a");
    rect(g, x + 12, y + 4, 2, 3, "#2d2f3a");
    if (!back) rect(g, x + 3, y + 7, 1, 1, "#2d2f3a"), rect(g, x + 4, y + 8, 2, 1, "#4a4d5c");
  }
}

// Bust portrait for dialogue and roster: the same sprite, cropped and doubled.
function drawPortrait(cv, look, o = {}) {
  const g = cv.getContext("2d");
  cv.width = 32;
  cv.height = 32;
  g.imageSmoothingEnabled = false;
  rect(g, 0, 0, 32, 32, o.bg || "#151e44");
  rect(g, 0, 22, 32, 10, shade(o.bg || "#151e44", 1.12));
  g.save();
  g.scale(2, 2);
  drawPerson(g, 0, 3, look, { talk: o.talk, blink: o.blink, frown: o.frown });
  g.restore();
}

// Static room layer, rendered once.
function buildRoom() {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");

  // wall
  rect(g, 0, 0, W, 60, "#1a2452");
  for (let x = 0; x < W; x += 48) rect(g, x, 3, 1, 53, "#16204a");
  rect(g, 0, 0, W, 3, "#101838");
  rect(g, 0, 54, W, 3, "#121a40");
  rect(g, 0, 57, W, 3, "#0d1432");

  // night windows with a skyline
  const win = (wx, seed) => {
    rect(g, wx - 2, 8, 108, 42, "#0b1129");
    rect(g, wx, 10, 104, 38, "#0f1f45");
    rect(g, wx, 10, 104, 12, "#13285a");
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let bx = wx; bx < wx + 104; ) {
      const bw = 8 + ((rnd() * 12) | 0);
      const bh = 10 + ((rnd() * 22) | 0);
      const top = 48 - bh;
      rect(g, bx, top, Math.min(bw, wx + 104 - bx), bh, rnd() > 0.5 ? "#0a1230" : "#0c1638");
      for (let ly = top + 3; ly < 46; ly += 4)
        for (let lx = bx + 2; lx < Math.min(bx + bw - 1, wx + 103); lx += 3)
          if (rnd() > 0.78) rect(g, lx, ly, 1, 1, rnd() > 0.3 ? "#ffcf6b" : "#7fe3d6");
      bx += bw + 1;
    }
    rect(g, wx + 51, 10, 2, 38, "#0b1129");
    rect(g, wx, 28, 104, 1, "#0b1129");
  };
  win(16, 7);
  win(264, 31);

  // wall screen bezel (content is dynamic)
  rect(g, 136, 6, 112, 46, "#060a18");
  rect(g, 138, 8, 108, 42, "#0b2830");

  // floor tiles
  for (let ty = 60; ty < H; ty += 16) {
    for (let tx = 0; tx < W; tx += 16) {
      const alt = ((tx + ty) / 16) % 2 === 0;
      rect(g, tx, ty, 16, 16, alt ? "#121a3e" : "#141d45");
      rect(g, tx, ty, 16, 1, "#0e1534");
      rect(g, tx, ty, 1, 16, "#0f1637");
    }
  }
  rect(g, 0, 60, W, 2, "#0a1029");

  // whiteboard with a hand-drawn chart, right side
  rect(g, 330, 66, 34, 26, "#0b1129");
  rect(g, 331, 67, 32, 24, "#d9deef");
  rect(g, 334, 84, 3, 4, "#3fd6c4");
  rect(g, 339, 80, 3, 8, "#3fd6c4");
  rect(g, 344, 76, 3, 12, "#ffb547");
  rect(g, 349, 82, 3, 6, "#ff5468");
  rect(g, 354, 72, 3, 16, "#3fd6c4");
  rect(g, 333, 88, 28, 1, "#55607f");
  rect(g, 340, 92, 2, 22, "#2a3145");
  rect(g, 352, 92, 2, 22, "#2a3145");

  // plant, front right
  rect(g, 348, 190, 16, 14, "#6b4a32");
  rect(g, 348, 190, 16, 2, "#87603f");
  const leaf = "#2f8a5c", leafD = "#226947";
  rect(g, 350, 176, 4, 14, leaf);
  rect(g, 356, 170, 4, 20, leafD);
  rect(g, 360, 178, 4, 12, leaf);
  rect(g, 346, 182, 4, 8, leafD);
  rect(g, 354, 166, 3, 6, leaf);

  // water cooler, back left
  rect(g, 18, 70, 12, 8, "#7fb6e6");
  rect(g, 17, 78, 14, 22, "#c8d4ff");
  rect(g, 17, 78, 14, 2, "#a3afdc");
  rect(g, 21, 84, 6, 2, "#3a4670");
  return cv;
}

function drawTable(g, flash) {
  const { x, y, w, h, face } = TABLE;
  // shadow on floor
  g.fillStyle = "rgba(4, 7, 20, 0.45)";
  g.fillRect(x - 2, y + h + face - 1, w + 4, 5);
  // top
  rect(g, x, y, w, h, "#0d3640");
  for (let gx = x + 8; gx < x + w; gx += 8) rect(g, gx, y + 2, 1, h - 3, "#114652");
  for (let gy = y + 8; gy < y + h; gy += 8) rect(g, x + 2, gy, w - 3, 1, "#114652");
  // tactical map in the middle
  const mx = x + 70, my = y + 14;
  const land = flash ? "#9c2134" : "#1d7a80";
  const landD = flash ? "#7a1a2a" : "#166169";
  rect(g, mx, my + 8, 22, 12, landD);
  rect(g, mx + 6, my + 4, 26, 14, land);
  rect(g, mx + 30, my + 10, 20, 12, landD);
  rect(g, mx + 36, my + 6, 12, 8, land);
  rect(g, mx + 14, my + 18, 10, 6, land);
  // flag
  rect(g, mx + 28, my - 2, 1, 14, "#c8d4ff");
  rect(g, mx + 29, my - 2, 7, 5, flash ? "#ff5468" : "#ffb547");
  // rim
  rect(g, x, y, w, 2, "#2a9aa0");
  rect(g, x, y, 1, h, "#1f7a80");
  rect(g, x + w - 1, y, 1, h, "#1f7a80");
  rect(g, x, y + h - 1, w, 1, "#0a2a32");
  // pixel-rounded corners
  g.clearRect(x, y, 1, 1);
  g.clearRect(x + w - 1, y, 1, 1);
  // front face
  rect(g, x + 1, y + h, w - 2, face, "#082028");
  rect(g, x + 1, y + h, w - 2, 1, "#1b5c66");
}

function drawChairBack(g, cx, y, color) {
  rect(g, cx - 8, y, 16, 14, shade(color, 0.7));
  rect(g, cx - 7, y + 1, 14, 12, color);
  rect(g, cx - 7, y + 1, 14, 1, shade(color, 1.25));
}

function drawCursor(g, x, y, w, h, t, color) {
  const o = (t >> 2) & 1 ? 1 : 0; // 2-frame pulse
  const L = 4;
  const x0 = x - 3 - o, y0 = y - 3 - o, x1 = x + w + 2 + o, y1 = y + h + 2 + o;
  g.fillStyle = color;
  // corners
  g.fillRect(x0, y0, L, 1); g.fillRect(x0, y0, 1, L);
  g.fillRect(x1 - L + 1, y0, L, 1); g.fillRect(x1, y0, 1, L);
  g.fillRect(x0, y1, L, 1); g.fillRect(x0, y1 - L + 1, 1, L);
  g.fillRect(x1 - L + 1, y1, L, 1); g.fillRect(x1, y1 - L + 1, 1, L);
}

function drawArrow(g, cx, y, t, color) {
  const b = (t >> 3) & 1;
  g.fillStyle = color;
  for (let i = 0; i < 4; i++) g.fillRect(cx - 3 + i, y + b + i, 7 - i * 2, 1);
}

function drawBubble(g, x, y, t) {
  rect(g, x, y, 15, 8, "#0a0f1f");
  rect(g, x + 1, y + 1, 13, 6, "#eef1ff");
  rect(g, x + 2, y + 8, 2, 2, "#eef1ff");
  rect(g, x + 1, y + 8, 1, 2, "#0a0f1f");
  const k = (t >> 3) % 4;
  for (let i = 0; i < 3; i++) rect(g, x + 3 + i * 3, y + 3, 2, 2, i < k ? "#1c2b66" : "#a3afdc");
}

function drawStance(g, cx, y, stance) {
  if (stance === "찬성") {
    g.fillStyle = "#0a0f1f"; g.fillRect(cx - 4, y - 1, 9, 9);
    g.fillStyle = "#3fd6c4";
    g.fillRect(cx - 2, y, 5, 1); g.fillRect(cx - 2, y + 6, 5, 1);
    g.fillRect(cx - 3, y + 1, 1, 5); g.fillRect(cx + 3, y + 1, 1, 5);
  } else if (stance === "조건부") {
    g.fillStyle = "#0a0f1f"; g.fillRect(cx - 4, y - 1, 9, 9);
    g.fillStyle = "#ffb547";
    for (let i = 0; i < 6; i++) g.fillRect(cx - (i >> 1), y + i, 1 + (i >> 1) * 2, 1);
    g.fillRect(cx - 3, y + 6, 7, 1);
  } else if (stance === "반대") {
    g.fillStyle = "#0a0f1f"; g.fillRect(cx - 4, y - 1, 9, 9);
    g.fillStyle = "#ff5468";
    for (let i = 0; i < 7; i++) { g.fillRect(cx - 3 + i, y + i, 1, 1); g.fillRect(cx + 3 - i, y + i, 1, 1); }
  }
}

function drawEnvelope(g, cx, y, t) {
  const b = (t >> 3) & 1;
  const x = cx - 5, yy = y - b;
  g.fillStyle = "#0a0f1f"; g.fillRect(x - 1, yy - 1, 12, 9);
  g.fillStyle = "#ffb547"; g.fillRect(x, yy, 10, 7);
  g.fillStyle = "#b8741a";
  for (let i = 0; i < 4; i++) { g.fillRect(x + i + 1, yy + i, 1, 1); g.fillRect(x + 8 - i, yy + i, 1, 1); }
}
