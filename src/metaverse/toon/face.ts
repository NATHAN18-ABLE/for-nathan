import * as THREE from "three";

/**
 * The face is painted, not modelled: a texture wrapped on the head sphere, drawn on a canvas so
 * every curve is smooth at any zoom. Expressions are separate textures swapped in place.
 *
 * The head uses three's sphere UVs: u = 0.25 is straight ahead (+z), and one canvas pixel covers
 * the same angle across and down, so shapes drawn near the centre keep their proportions.
 */

export type Expression = "open" | "blink" | "smile" | "happy";
export const EXPRESSIONS: Expression[] = ["open", "blink", "smile", "happy"];

const W = 1024;
const H = 512;
const K = W / (2 * Math.PI); // pixels per radian
const CX = W / 4;
const CY = H / 2;
const at = (az: number, el: number): [number, number] => [CX + az * K, CY - el * K];

const INK = "#2b1f22";
const MOUTH = "#6c3133";

function eyeOpen(g: CanvasRenderingContext2D, x: number, y: number) {
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.ellipse(0, 0, 25, 33, 0, 0, Math.PI * 2);
  g.fillStyle = INK;
  g.fill();
  g.clip();
  // A warm glow low in the eye gives it depth.
  const glow = g.createRadialGradient(0, 22, 2, 0, 22, 26);
  glow.addColorStop(0, "rgba(140, 92, 72, 0.95)");
  glow.addColorStop(1, "rgba(140, 92, 72, 0)");
  g.fillStyle = glow;
  g.fillRect(-30, -40, 60, 80);
  g.restore();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(x + 8, y - 12, 9.5, 10.5, -0.3, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 0.85;
  g.beginPath();
  g.arc(x - 8, y + 14, 4.2, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

function stroke(g: CanvasRenderingContext2D, color: string, width: number, path: () => void) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  path();
  g.stroke();
}

function paint(skin: string, brow: string, expr: Expression, lashes: boolean) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = skin;
  g.fillRect(0, 0, W, H);

  // Cheeks: a soft blush that fades out rather than a hard disc.
  for (const side of [-1, 1]) {
    const [x, y] = at(side * 0.6, -0.2);
    g.save();
    g.translate(x, y);
    g.scale(1, 0.62);
    const blush = g.createRadialGradient(0, 0, 0, 0, 0, 30);
    blush.addColorStop(0, "rgba(238, 120, 124, 0.55)");
    blush.addColorStop(1, "rgba(238, 120, 124, 0)");
    g.fillStyle = blush;
    g.fillRect(-32, -32, 64, 64);
    g.restore();
  }

  // Brows: short, soft, in the hair colour.
  for (const side of [-1, 1]) {
    const [x, y] = at(side * 0.37, 0.37);
    const lift = expr === "happy" || expr === "smile" ? -3 : 0;
    stroke(g, brow, 7, () => {
      g.moveTo(x - 15, y + 2 + lift);
      g.quadraticCurveTo(x, y - 6 + lift, x + 15, y + 2 + lift);
    });
  }

  for (const side of [-1, 1]) {
    const [x, y] = at(side * 0.36, -0.02);
    if (expr === "open" || expr === "smile") {
      eyeOpen(g, x, y);
      // Two small lashes flicking out from the outer corner.
      if (lashes)
        stroke(g, INK, 5, () => {
          g.moveTo(x + side * 20, y - 24);
          g.quadraticCurveTo(x + side * 28, y - 28, x + side * 32, y - 36);
          g.moveTo(x + side * 24, y - 15);
          g.quadraticCurveTo(x + side * 32, y - 16, x + side * 37, y - 22);
        });
    }
    else if (expr === "blink")
      stroke(g, INK, 7, () => {
        g.moveTo(x - 20, y + 4);
        g.quadraticCurveTo(x, y + 14, x + 20, y + 4);
        if (lashes) {
          g.moveTo(x + side * 20, y + 4);
          g.lineTo(x + side * 28, y);
        }
      });
    else
      stroke(g, INK, 7.5, () => {
        g.moveTo(x - 20, y + 8);
        g.quadraticCurveTo(x, y - 16, x + 20, y + 8);
      });
  }

  const [mx, my] = at(0, -0.29);
  if (expr === "smile" || expr === "happy") {
    // Open smile: a soft D with a little tongue.
    g.save();
    g.beginPath();
    g.moveTo(mx - 16, my - 4);
    g.quadraticCurveTo(mx, my - 1, mx + 16, my - 4);
    g.bezierCurveTo(mx + 15, my + 16, mx - 15, my + 16, mx - 16, my - 4);
    g.closePath();
    g.fillStyle = MOUTH;
    g.fill();
    g.clip();
    g.fillStyle = "#e57a7c";
    g.beginPath();
    g.ellipse(mx, my + 12, 9, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  } else {
    stroke(g, MOUTH, 5, () => {
      g.moveTo(mx - 11, my - 2);
      g.quadraticCurveTo(mx, my + 8, mx + 11, my - 2);
    });
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const cache = new Map<string, Record<Expression, THREE.CanvasTexture>>();

/** The four expressions for one skin and brow colour, painted once and shared. */
export function faceTextures(skin: string, brow: string, lashes = false) {
  const key = `${skin}|${brow}|${lashes}`;
  let set = cache.get(key);
  if (!set) {
    set = Object.fromEntries(EXPRESSIONS.map((e) => [e, paint(skin, brow, e, lashes)])) as Record<Expression, THREE.CanvasTexture>;
    cache.set(key, set);
  }
  return set;
}
