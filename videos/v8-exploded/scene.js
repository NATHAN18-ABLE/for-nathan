// V8 exploded-view — procedural Three.js scene, rendered purely from HyperFrames time.
// Reference: a modern Ford-style 5.0 DOHC V8 (Coyote layout): 90° aluminium block, four-cam heads,
// coil-on-plug cam covers, tall-runner composite intake with a front throttle body, and a full
// front-end accessory drive (serpentine belt, alternator, A/C compressor, tensioner, water pump).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const W = 1080, H = 1920, DUR = 15;

// The runtime holds the first frame until the scene (including the embedded font) is drawable.
let markReady;
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["v8-scene"] = new Promise((r) => (markReady = r));
await document.fonts.load('120px "Michroma"');

// ---------- math helpers ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const easeInOutQuint = (x) => { x = clamp01(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; };
const easeInCubic = (x) => { x = clamp01(x); return x * x * x; };
const DEG = Math.PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- procedural textures (seeded, deterministic) ----------
function valueNoise(seed, size) {
  const rnd = mulberry32(seed);
  const g = new Float32Array(size * size);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const at = (i, j) => g[(((j % size) + size) % size) * size + (((i % size) + size) % size)];
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), u), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), u), v);
  };
}

function canvasTex(c, { srgb = false, repeat = [1, 1] } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(...repeat);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function noiseTexture({ seed, size = 512, base = 8, octaves = 5, ridge = false, lo = 0, hi = 1, repeat = [1, 1] }) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  const layers = [];
  for (let o = 0; o < octaves; o++) layers.push({ n: valueNoise(seed + o * 101, base << o), f: (base << o) / size, a: 0.5 ** o });
  let norm = 0;
  for (const l of layers) norm += l.a;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const l of layers) {
        let s = l.n(x * l.f, y * l.f);
        if (ridge) s = 1 - Math.abs(s * 2 - 1);
        v += s * l.a;
      }
      const b = Math.round(clamp01(lerp(lo, hi, v / norm)) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvasTex(c, { repeat });
}

function stripeTexture(n, lo = 40, hi = 220) {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 256;
  const ctx = c.getContext("2d");
  for (let y = 0; y < 256; y++) {
    const v = Math.round(lerp(lo, hi, 0.5 + 0.5 * Math.cos((y / 256) * n * Math.PI * 2)));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 8, 1);
  }
  return canvasTex(c);
}

function badgeTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const ctx = c.getContext("2d");
  const rnd = mulberry32(5);
  ctx.fillStyle = "#b9bdc2";
  ctx.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 900; i++) {
    const v = 160 + Math.floor(rnd() * 80);
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.35)`;
    ctx.fillRect(0, rnd() * 256, 1024, 1);
  }
  ctx.fillStyle = "#15171a";
  ctx.font = '150px "Michroma"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("5.0", 512, 138);
  return canvasTex(c, { srgb: true });
}

function backdropTexture() {
  const c = document.createElement("canvas");
  c.width = 540; c.height = 960;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#040506";
  ctx.fillRect(0, 0, c.width, c.height);
  const g = ctx.createRadialGradient(270, 400, 20, 270, 440, 640);
  g.addColorStop(0, "#1b1f24");
  g.addColorStop(0.45, "#0c0e11");
  g.addColorStop(1, "#040506");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function radialAlpha() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.35, "#d0d0d0");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// ---------- renderer / scene ----------
const canvas = document.getElementById("three-layer");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = backdropTexture();

// Studio environment: long strip softboxes give the automotive reflection lines.
function studioEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x020203);
  const box = (w, h, color, intensity, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  box(14, 3, 0xffffff, 2.2, [0, 9, 0]); // overhead softbox
  box(0.9, 12, 0xffffff, 3.0, [7, 2, 4]); // front-right strip
  box(0.9, 12, 0xffffff, 3.6, [-6, 2, 6]); // front-left strip
  box(0.6, 12, 0xcfe0ff, 3.0, [-5, 2, -7]); // back cool strip
  box(0.6, 12, 0xffe2c4, 2.6, [6, 2, -6]); // back warm strip
  box(20, 2, 0x2a1610, 0.5, [0, -6, 0]); // warm floor bounce
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}
scene.environment = studioEnvironment();

// ---------- materials ----------
const castBump = noiseTexture({ seed: 11, base: 32, octaves: 3, repeat: [2, 2] });
const castRough = noiseTexture({ seed: 23, base: 4, octaves: 4, lo: 0.7, hi: 1.0, repeat: [1.5, 1.5] });
const crinkle = noiseTexture({ seed: 37, base: 48, octaves: 3, ridge: true, repeat: [3, 3] });
const grain = noiseTexture({ seed: 51, base: 64, octaves: 2, repeat: [4, 4] });
const ribs = stripeTexture(6);
const corrugate = stripeTexture(1);
corrugate.repeat.set(1, 60);

const M = {
  alu: new THREE.MeshPhysicalMaterial({ color: 0x8e9399, metalness: 1, roughness: 0.52, roughnessMap: castRough, bumpMap: castBump, bumpScale: 0.22 }),
  machined: new THREE.MeshPhysicalMaterial({ color: 0xc9cdd2, metalness: 1, roughness: 0.16 }),
  red: new THREE.MeshPhysicalMaterial({ color: 0x8f0a10, metalness: 0.25, roughness: 0.55, bumpMap: crinkle, bumpScale: 1.5, clearcoat: 0.6, clearcoatRoughness: 0.28 }),
  steel: new THREE.MeshPhysicalMaterial({ color: 0xd6d9dc, metalness: 1, roughness: 0.09 }),
  zinc: new THREE.MeshPhysicalMaterial({ color: 0xa9a58f, metalness: 1, roughness: 0.3 }),
  forged: new THREE.MeshPhysicalMaterial({ color: 0x80858c, metalness: 1, roughness: 0.3, bumpMap: castBump, bumpScale: 0.12 }),
  composite: new THREE.MeshPhysicalMaterial({ color: 0x16171a, metalness: 0, roughness: 0.58, bumpMap: grain, bumpScale: 0.35, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
  dark: new THREE.MeshPhysicalMaterial({ color: 0x101113, metalness: 0.2, roughness: 0.45, clearcoat: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 }),
  belt: new THREE.MeshStandardMaterial({ color: 0x0e0e0f, roughness: 0.7, bumpMap: ribs, bumpScale: 1.2 }),
  loom: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.6, bumpMap: corrugate, bumpScale: 1.5 }),
  hose: new THREE.MeshPhysicalMaterial({ color: 0x0d0d0e, roughness: 0.55, clearcoat: 0.2 }),
  bore: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1 }),
  gasket: new THREE.MeshPhysicalMaterial({ color: 0x4a4d52, metalness: 0.9, roughness: 0.32 }),
  header: new THREE.MeshPhysicalMaterial({
    color: 0xb3aba2, metalness: 1, roughness: 0.24,
    iridescence: 0.35, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700],
  }),
  yellow: new THREE.MeshPhysicalMaterial({ color: 0xe0a800, roughness: 0.4, clearcoat: 0.5 }),
  filter: new THREE.MeshPhysicalMaterial({ color: 0x1b2d57, metalness: 0.4, roughness: 0.35, clearcoat: 0.8 }),
  badge: new THREE.MeshPhysicalMaterial({ map: badgeTexture(), metalness: 1, roughness: 0.22 }),
};

function mesh(geo, mat, parent, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const rbox = (w, h, d, r, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);
const hexBolt = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 6);
const cylX = (r, len, seg = 32) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(Math.PI / 2);
const tube = (pts, r, seg = 48, radial = 12) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, radial);
const latheX = (profile, seg = 64) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg).rotateZ(-Math.PI / 2);

// ---------- engine geometry constants ----------
const D = 1.08; // deck height from crank axis along bank axis
const CR = 0.2; // crank throw
const RL = 0.75; // rod length
const BANK = 45 * DEG;
const PIN_X = [-0.75, -0.25, 0.25, 0.75];
const PIN_PHASE = [0, Math.PI / 2, (3 * Math.PI) / 2, Math.PI]; // cross-plane crank
const SIDES = [1, -1]; // +1 left bank (+Z), -1 right bank (-Z)
const FLOOR_Y = -1.02;
const LIFT = 1.95; // the running gear lifts off the pan, which stays on the floor
const bankAngle = (side) => side * BANK;
const bankAxis = (side) => V(0, Math.cos(bankAngle(side)), Math.sin(bankAngle(side)));
const bankLocalZ = (side) => V(0, -Math.sin(bankAngle(side)), Math.cos(bankAngle(side)));
const bankToWorld = (side, x, y, z) => {
  const a = bankAngle(side);
  return V(x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a));
};
const cylX_of = (side, k) => PIN_X[k] + side * 0.07;
const bankFrame = (side, parent) => {
  const g = new THREE.Group();
  g.rotation.x = bankAngle(side);
  parent.add(g);
  return g;
};

// ---------- parts registry (explode choreography) ----------
const engine = new THREE.Group();
scene.add(engine);
const parts = [];
const byName = {};
function part(name, { dir, dist, out, inn, tumble = [0, 0, 0] }) {
  const g = new THREE.Group();
  g.name = name;
  engine.add(g);
  const p = { g, dir: dir.clone().normalize(), dist, out, inn, tumble, phase: parts.length * 1.37 };
  parts.push(p);
  byName[name] = p;
  return g;
}
const up = V(0, 1, 0);
const bankish = (side, k) => bankAxis(side).add(V(0, k, 0));

// Front profile (lateral z, vertical y). `extra` raises the bank tops (timing cover spans the heads).
function blockShape(scale = 1, extra = 0) {
  const s = new THREE.Shape();
  const u = [Math.sin(BANK), Math.cos(BANK)];
  const p = [Math.cos(BANK), -Math.sin(BANK)];
  const C = [u[0] * (D + extra), u[1] * (D + extra)];
  const outer = [C[0] + p[0] * 0.31, C[1] + p[1] * 0.31];
  const inner = [C[0] - p[0] * 0.31, C[1] - p[1] * 0.31];
  const valley = [inner[0] - u[0] * (0.52 + extra), inner[1] - u[1] * (0.52 + extra)];
  const flank = [outer[0] - u[0] * (0.45 + extra), outer[1] - u[1] * (0.45 + extra)];
  const pts = [
    [0.66, -0.36], [flank[0], 0.05], flank, outer, inner, valley,
    [-valley[0], valley[1]], [-inner[0], inner[1]], [-outer[0], outer[1]], [-flank[0], flank[1]], [-flank[0], 0.05], [-0.66, -0.36],
  ];
  s.moveTo(pts[0][0] * scale, pts[0][1] * scale);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0] * scale, pts[i][1] * scale);
  s.closePath();
  return s;
}

// --- Block (anchor of the running gear) ---
const block = part("block", { dir: up, dist: 0, out: [0, 1], inn: [0, 1] });
{
  const L = 2.06;
  const geo = new THREE.ExtrudeGeometry(blockShape(), { depth: L, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 4 });
  geo.translate(0, 0, -L / 2);
  mesh(geo, M.alu, block, [0, 0, 0], [0, Math.PI / 2, 0]);
  for (const side of SIDES) {
    // cast ribs, motor-mount pads, freeze plugs
    for (let i = 0; i < 7; i++) mesh(rbox(0.05, 0.36, 0.06, 0.015), M.alu, block, [-0.9 + i * 0.3, -0.13, side * 0.7]);
    mesh(rbox(0.36, 0.22, 0.16, 0.04), M.alu, block, [0.15, 0.1, side * 0.75]);
    mesh(rbox(0.3, 0.1, 0.12, 0.03), M.rubber, block, [0.15, 0.1, side * 0.86]);
    for (const x of [-0.55, 0.25]) {
      const fp = bankToWorld(side, x, D - 0.42, side * 0.36);
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 24), M.machined, block, fp.toArray(), [side * BANK + Math.PI / 2, 0, 0]);
    }
    // deck: bores, liners, head-bolt holes
    const bf = bankFrame(side, block);
    mesh(rbox(2.02, 0.02, 0.6, 0.008), M.machined, bf, [0, D + 0.02, 0]);
    for (let k = 0; k < 4; k++) {
      const x = cylX_of(side, k);
      mesh(new THREE.CircleGeometry(0.2, 48), M.bore, bf, [x, D + 0.032, 0], [-Math.PI / 2, 0, 0]);
      mesh(new THREE.RingGeometry(0.2, 0.232, 48), M.steel, bf, [x, D + 0.033, 0], [-Math.PI / 2, 0, 0]);
      for (const dx of [-0.25, 0.25]) for (const dz of [-0.24, 0.24])
        mesh(new THREE.CircleGeometry(0.022, 12), M.bore, bf, [x + dx, D + 0.033, dz], [-Math.PI / 2, 0, 0]);
    }
  }
  // main-bearing caps under the crank, revealed when the pan comes away
  for (let i = 0; i < 5; i++) {
    const x = -1.0 + i * 0.5;
    mesh(rbox(0.12, 0.14, 0.56, 0.03), M.forged, block, [x, -0.3, 0]);
    for (const z of [-0.2, 0.2]) mesh(hexBolt.clone().scale(1.4, 1.4, 1.4), M.steel, block, [x, -0.38, z]);
  }
  // valley cover, oil-filter boss + canister, dipstick, starter
  mesh(rbox(1.9, 0.05, 0.5, 0.02), M.alu, block, [0, 0.62, 0]);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 32), M.alu, block, [0.62, -0.08, 0.74], [Math.PI / 2 - 0.5, 0, 0]);
  const filt = mesh(latheX([[0.001, -0.14], [0.11, -0.14], [0.115, -0.12], [0.115, 0.12], [0.1, 0.14], [0.001, 0.14]], 40), M.filter, block, [0.62, -0.2, 0.86], [0, 0, 0]);
  filt.rotation.set(0, Math.PI / 2, -0.5);
  mesh(tube([V(-0.35, -0.2, 0.7), V(-0.36, 0.4, 0.86), V(-0.42, 1.1, 1.16), V(-0.46, 1.5, 1.22)], 0.018, 40, 8), M.steel, block);
  mesh(new THREE.TorusGeometry(0.06, 0.018, 10, 24), M.yellow, block, [-0.46, 1.58, 1.22], [0, Math.PI / 2, 0]);
  mesh(cylX(0.1, 0.36), M.dark, block, [-0.72, -0.22, -0.78]);
  mesh(cylX(0.055, 0.2), M.machined, block, [-0.6, -0.1, -0.83]);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6).rotateZ(Math.PI / 2), M.steel, block, [-0.52, -0.22, -0.78]);
}

// --- Oil pan (stays on the floor while the engine lifts off it) ---
const pan = part("oilPan", { dir: up.clone().negate(), dist: LIFT, out: [3.35, 1.9], inn: [9.0, 0.62] });
{
  mesh(rbox(2.06, 0.05, 1.38, 0.02), M.machined, pan, [0, -0.39, 0]);
  mesh(rbox(1.96, 0.36, 1.24, 0.07), M.alu, pan, [0, -0.58, 0]);
  mesh(rbox(0.95, 0.3, 1.0, 0.08), M.alu, pan, [-0.45, -0.83, 0]);
  for (let i = 0; i < 6; i++) mesh(rbox(0.8, 0.04, 0.03, 0.01), M.alu, pan, [-0.45, -0.97, -0.4 + i * 0.16]);
  mesh(hexBolt.clone().scale(2, 2, 2), M.steel, pan, [-0.1, -0.97, 0.3]);
  for (let i = 0; i < 9; i++) for (const side of SIDES) mesh(hexBolt, M.steel, pan, [-0.95 + i * 0.237, -0.35, side * 0.66]);
}

// --- Crankshaft (rotates) ---
const crank = part("crankshaft", { dir: up.clone().negate(), dist: 1.05, out: [3.6, 1.9], inn: [9.2, 0.62] });
const crankRot = new THREE.Group();
crank.add(crankRot);
const DAMPER_R = 0.27;
{
  for (let i = 0; i < 5; i++) mesh(cylX(0.1, 0.1), M.steel, crankRot, [-1.0 + i * 0.5, 0, 0]);
  const web = new THREE.Shape();
  web.absarc(0, CR, 0.12, 0, Math.PI, false);
  web.lineTo(-0.16, -0.02);
  web.absarc(0, 0, 0.32, Math.PI + 0.35, 2 * Math.PI - 0.35, false);
  web.lineTo(0.12, CR);
  const webGeo = new THREE.ExtrudeGeometry(web, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 });
  webGeo.translate(0, 0, -0.025).rotateY(Math.PI / 2);
  PIN_X.forEach((px, k) => {
    const ph = PIN_PHASE[k];
    mesh(cylX(0.09, 0.28), M.steel, crankRot, [px, CR * Math.cos(ph), CR * Math.sin(ph)]);
    for (const dx of [-0.165, 0.165]) mesh(webGeo, M.forged, crankRot, [px + dx, 0, 0], [ph, 0, 0]);
  });
  mesh(cylX(0.07, 0.3), M.steel, crankRot, [1.18, 0, 0]);
  // harmonic balancer with 6-rib belt track
  const prof = [[0.05, -0.09]];
  prof.push([DAMPER_R, -0.09]);
  for (let i = 0; i < 6; i++) prof.push([DAMPER_R - 0.018, -0.06 + i * 0.018], [DAMPER_R, -0.051 + i * 0.018]);
  prof.push([DAMPER_R, 0.06], [0.2, 0.07], [0.19, 0.09], [0.05, 0.09]);
  mesh(latheX(prof), M.forged, crankRot, [1.3, 0, 0]);
  mesh(new THREE.TorusGeometry(0.2, 0.022, 12, 64).rotateY(Math.PI / 2), M.rubber, crankRot, [1.39, 0, 0]);
  mesh(cylX(0.07, 0.04, 6), M.steel, crankRot, [1.405, 0, 0]);
  mesh(cylX(0.22, 0.05, 48), M.forged, crankRot, [-1.12, 0, 0]);
}

// --- Pistons + rods (per bank; positioned per frame by slider-crank kinematics) ---
const pistonGeo = new THREE.LatheGeometry([
  [0.0, -0.12], [0.184, -0.12], [0.188, -0.02], [0.19, 0.0], [0.19, 0.035], [0.18, 0.037], [0.18, 0.047], [0.19, 0.049],
  [0.19, 0.062], [0.18, 0.064], [0.18, 0.073], [0.19, 0.075], [0.19, 0.095], [0.175, 0.105], [0.0, 0.112],
].map(([r, y]) => new THREE.Vector2(r, y)), 56);
const rodShape = new THREE.Shape();
{
  const pts = [];
  for (let a = 30; a >= -210; a -= 10) pts.push([0.12 * Math.cos(a * DEG), 0.12 * Math.sin(a * DEG)]);
  for (let a = 200; a >= -20; a -= 10) pts.push([0.058 * Math.cos(a * DEG), RL + 0.058 * Math.sin(a * DEG)]);
  rodShape.moveTo(...pts[0]);
  for (const q of pts.slice(1)) rodShape.lineTo(...q);
  rodShape.closePath();
}
const rodGeo = new THREE.ExtrudeGeometry(rodShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
rodGeo.translate(0, 0, -0.025).rotateY(Math.PI / 2);
const pistonSets = SIDES.map((side) => {
  const g = part(`pistons${side}`, { dir: bankAxis(side), dist: 0.62, out: [3.85 + (side > 0 ? 0 : 0.12), 1.8], inn: [9.45 + (side > 0 ? 0 : 0.1), 0.6] });
  const bf = bankFrame(side, g);
  const items = PIN_X.map((_, k) => {
    const x = cylX_of(side, k);
    const piston = mesh(pistonGeo, M.machined, bf, [x, 0, 0]);
    for (const [dx, dz] of [[-0.07, 0.07], [0.07, 0.07], [-0.07, -0.07], [0.07, -0.07]])
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.006, 24), M.forged, piston, [dx, 0.112, dz]);
    const rod = mesh(rodGeo, M.forged, bf, [x, 0, 0]);
    for (const dz of [-0.1, 0.1]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12), M.steel, rod, [0, -0.08, dz]);
    return { piston, rod, k };
  });
  return { side, items };
});

function updatePistons(theta) {
  for (const { side, items } of pistonSets) {
    const u = bankAxis(side), lz = bankLocalZ(side);
    for (const { piston, rod, k } of items) {
      const a = theta + PIN_PHASE[k];
      const P = V(0, CR * Math.cos(a), CR * Math.sin(a));
      const pa = P.dot(u), pb = P.dot(lz);
      const s = pa + Math.sqrt(RL * RL - pb * pb);
      piston.position.y = s;
      rod.position.y = pa;
      rod.position.z = pb;
      rod.rotation.x = Math.atan2(-pb, s - pa);
    }
  }
}

// --- Head gaskets (MLS) ---
for (const side of SIDES) {
  const g = part(`gasket${side}`, { dir: bankish(side, 1.0), dist: 0.62, out: [3.7, 1.8], inn: [9.85, 0.55], tumble: [0.05 * side, 0, 0] });
  const bf = bankFrame(side, g);
  mesh(rbox(2.0, 0.012, 0.6, 0.005), M.gasket, bf, [0, D + 0.04, 0]);
  for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(0.212, 0.012, 8, 48).rotateX(Math.PI / 2), M.steel, bf, [cylX_of(side, k), D + 0.047, 0]);
}

// --- Cylinder heads: bucket tappets, cam journals, plug tubes visible on top ---
for (const side of SIDES) {
  const g = part(`head${side}`, { dir: bankish(side, 1.0), dist: 1.05, out: [3.3, 1.9], inn: [10.05, 0.58], tumble: [0.06 * side, 0, 0.02] });
  const bf = bankFrame(side, g);
  mesh(rbox(2.06, 0.3, 0.64, 0.035), M.alu, bf, [0, D + 0.2, 0]);
  mesh(rbox(2.06, 0.02, 0.64, 0.008), M.machined, bf, [0, D + 0.055, 0]);
  mesh(rbox(2.02, 0.012, 0.6, 0.006), M.machined, bf, [0, D + 0.355, 0]);
  for (let k = 0; k < 4; k++) {
    const x = cylX_of(side, k);
    mesh(rbox(0.26, 0.14, 0.05, 0.02), M.machined, bf, [x, D + 0.17, side * 0.34]); // exhaust flange
    mesh(rbox(0.22, 0.12, 0.05, 0.02), M.machined, bf, [x, D + 0.2, -side * 0.34]); // intake flange
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 24), M.machined, bf, [x, D + 0.39, 0]); // plug tube
    mesh(new THREE.CircleGeometry(0.035, 20), M.bore, bf, [x, D + 0.426, 0], [-Math.PI / 2, 0, 0]);
    for (const dz of [-0.15, 0.15]) for (const dv of [-0.07, 0.07])
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 24), M.steel, bf, [x + dv, D + 0.375, dz]);
  }
  for (let i = 0; i < 5; i++) for (const dz of [-0.15, 0.15]) {
    const x = -0.98 + i * 0.49;
    mesh(rbox(0.07, 0.07, 0.17, 0.02), M.machined, bf, [x, D + 0.4, dz]);
    for (const dd of [-0.065, 0.065]) mesh(hexBolt, M.steel, bf, [x, D + 0.44, dz + dd]);
  }
}

// --- Camshafts (DOHC, rotate at half crank speed) ---
const camShafts = [];
const lobeGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.05, 32).rotateZ(Math.PI / 2).scale(1, 1.35, 1).translate(0, 0.022, 0);
function gearGeo(r, teeth) {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r : r * 0.9;
    if (i === 0) s.moveTo(rr * Math.cos(a0), rr * Math.sin(a0));
    s.lineTo(rr * Math.cos(a0), rr * Math.sin(a0));
    s.lineTo(rr * Math.cos(a1), rr * Math.sin(a1));
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 1 }).translate(0, 0, -0.02).rotateY(Math.PI / 2);
}
const camGear = gearGeo(0.12, 26);
for (const side of SIDES) {
  const g = part(`cams${side}`, { dir: bankish(side, 1.1), dist: 1.55, out: [3.05, 1.9], inn: [10.3, 0.55], tumble: [0, 0.04 * side, 0] });
  const bf = bankFrame(side, g);
  for (const dz of [-0.15, 0.15]) {
    const shaft = new THREE.Group();
    shaft.position.set(0, D + 0.46, dz);
    bf.add(shaft);
    mesh(cylX(0.04, 2.1, 20), M.steel, shaft);
    for (let k = 0; k < 4; k++) for (const dv of [-0.07, 0.07])
      mesh(lobeGeo, M.steel, shaft, [cylX_of(side, k) + dv, 0, 0], [PIN_PHASE[k] * 0.5 + (dz > 0 ? 1.1 : 0) + dv * 3, 0, 0]);
    mesh(camGear, M.forged, shaft, [0.97, 0, 0]);
    camShafts.push(shaft);
  }
}

// --- Cam covers: red crinkle, coil-on-plug, harness loom, VCT solenoids ---
for (const side of SIDES) {
  const g = part(`cover${side}`, { dir: bankish(side, 1.25), dist: 2.15, out: [2.8, 2.0], inn: [10.6, 0.55], tumble: [0.1 * side, 0, -0.03] });
  const bf = bankFrame(side, g);
  mesh(rbox(2.04, 0.22, 0.64, 0.07, 6), M.red, bf, [0, D + 0.49, 0]);
  mesh(rbox(2.08, 0.035, 0.68, 0.012), M.machined, bf, [0, D + 0.375, 0]);
  for (const dz of [-0.22, 0.22]) mesh(rbox(1.75, 0.035, 0.03, 0.012), M.machined, bf, [0, D + 0.61, dz]);
  for (let k = 0; k < 4; k++) {
    const x = cylX_of(side, k);
    mesh(rbox(0.19, 0.1, 0.15, 0.03), M.dark, bf, [x, D + 0.645, 0]);
    mesh(rbox(0.07, 0.06, 0.08, 0.012), M.dark, bf, [x + 0.12, D + 0.665, 0.02]);
    mesh(hexBolt, M.steel, bf, [x - 0.07, D + 0.7, 0.04]);
  }
  mesh(tube([V(-0.95, D + 0.69, 0.13), V(-0.2, D + 0.7, 0.12), V(0.6, D + 0.7, 0.12), V(1.02, D + 0.66, 0.1), V(1.12, D + 0.52, 0.06)], 0.028, 80, 10), M.loom, bf);
  for (let i = 0; i < 6; i++) for (const dz of [-0.29, 0.29]) mesh(hexBolt, M.steel, bf, [-0.85 + i * 0.34, D + 0.6, dz]);
  if (side > 0) mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 32), M.dark, bf, [-0.62, D + 0.63, -0.14]);
}

// --- Timing cover (spans block, heads and cam-cover fronts, like the Coyote front cover) ---
const timing = part("timing", { dir: V(1, 0.1, 0), dist: 0.85, out: [3.2, 1.9], inn: [10.75, 0.5] });
{
  const TC_EXTRA = 0.6, TC_FACE = 1.155;
  const shape = blockShape(1.0, TC_EXTRA);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 });
  mesh(geo, M.alu, timing, [1.06, 0, 0], [0, Math.PI / 2, 0]);
  // perimeter bolts: walk the outline and inset each point toward the cover's middle
  const outline = shape.getSpacedPoints(26).slice(0, -1);
  const cz = 0, cy = 0.62;
  for (const q of outline) {
    const dz = cz - q.x, dy = cy - q.y, l = Math.hypot(dz, dy) || 1;
    mesh(hexBolt.clone().rotateZ(Math.PI / 2), M.steel, timing, [TC_FACE + 0.012, q.y + (dy / l) * 0.06, -(q.x + (dz / l) * 0.06)]);
  }
  // cast ribs and bosses on the face
  for (const side of SIDES) {
    const bf = bankFrame(side, timing);
    mesh(rbox(0.05, 0.9, 0.06, 0.02), M.alu, bf, [TC_FACE, D - 0.05, side * 0.22]);
    mesh(rbox(0.05, 0.9, 0.06, 0.02), M.alu, bf, [TC_FACE, D - 0.05, -side * 0.22]);
    // variable-cam-timing solenoids seated in the cover, one per cam
    for (const dz of [-0.15, 0.15]) {
      mesh(cylX(0.06, 0.06, 24), M.alu, bf, [TC_FACE + 0.02, D + 0.47, dz]);
      mesh(cylX(0.045, 0.1, 24), M.machined, bf, [TC_FACE + 0.08, D + 0.47, dz]);
      mesh(rbox(0.07, 0.08, 0.08, 0.018), M.dark, bf, [TC_FACE + 0.16, D + 0.47, dz]);
    }
  }
  mesh(cylX(0.11, 0.12, 32), M.alu, timing, [1.19, 0.5, 0]); // water-pump snout
  mesh(cylX(0.075, 0.08, 32), M.machined, timing, [1.16, 0, 0]); // front seal
  for (const [y, z] of [[0.22, 0.42], [0.22, -0.42], [-0.2, 0.46], [-0.2, -0.46]])
    mesh(cylX(0.045, 0.04, 16), M.alu, timing, [TC_FACE + 0.015, y, z]);
}

// --- Front-end accessory drive: serpentine belt computed around the real pulley layout ---
// Pulley centres in the belt plane (u = z, v = y); listed counter-clockwise; w = +1 ribbed side, -1 backside.
const BELT_X = 1.335, BELT_W = 0.1, BELT_T = 0.022;
const PULLEYS = [
  { name: "ac", c: [-0.66, -0.26], r: 0.15, w: 1 },
  { name: "damper", c: [0, 0], r: DAMPER_R, w: 1, onCrank: true },
  { name: "tensioner", c: [0.4, 0.1], r: 0.085, w: 1 },
  { name: "alternator", c: [0.78, 0.66], r: 0.085, w: 1 },
  { name: "waterpump", c: [0.02, 0.5], r: 0.16, w: -1 },
  { name: "idler", c: [-0.34, 0.98], r: 0.08, w: 1 },
];
function beltGeometry() {
  const n = PULLEYS.length;
  const eff = PULLEYS.map((p) => ({ ...p, r: p.w > 0 ? p.r : p.r + BELT_T }));
  const seg = [];
  for (let i = 0; i < n; i++) {
    const A = eff[i], B = eff[(i + 1) % n];
    const s1 = A.r * A.w, s2 = B.r * B.w;
    const dx = B.c[0] - A.c[0], dy = B.c[1] - A.c[1], L = Math.hypot(dx, dy);
    const du = [dx / L, dy / L], pr = [du[1], -du[0]];
    const cp = (s1 - s2) / L, sp = Math.sqrt(Math.max(0, 1 - cp * cp));
    const nn = [cp * du[0] + sp * pr[0], cp * du[1] + sp * pr[1]];
    seg.push({ p1: [A.c[0] + s1 * nn[0], A.c[1] + s1 * nn[1]], p2: [B.c[0] + s2 * nn[0], B.c[1] + s2 * nn[1]] });
  }
  const path = [];
  for (let i = 0; i < n; i++) {
    const P = eff[i], pin = seg[(i - 1 + n) % n].p2, pout = seg[i].p1;
    let a0 = Math.atan2(pin[1] - P.c[1], pin[0] - P.c[0]);
    let a1 = Math.atan2(pout[1] - P.c[1], pout[0] - P.c[0]);
    if (P.w > 0) while (a1 < a0) a1 += Math.PI * 2;
    else while (a1 > a0) a1 -= Math.PI * 2;
    const steps = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.06));
    for (let s = 0; s <= steps; s++) {
      const a = lerp(a0, a1, s / steps);
      path.push([P.c[0] + P.r * Math.cos(a), P.c[1] + P.r * Math.sin(a)]);
    }
  }
  path.push(path[0]);
  const pos = [], uv = [], idx = [];
  let len = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
    const t = [b[0] - a[0], b[1] - a[1]], tl = Math.hypot(...t) || 1;
    const nr = [t[1] / tl, -t[0] / tl]; // right of travel = outside of the loop
    if (i > 0) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    const [u0, v0] = path[i];
    const u1 = u0 + nr[0] * BELT_T, v1 = v0 + nr[1] * BELT_T;
    for (const [uu, vv] of [[u0, v0], [u1, v1]])
      for (const xx of [BELT_X - BELT_W / 2, BELT_X + BELT_W / 2]) {
        pos.push(xx, vv, uu);
        uv.push(len * 4, xx > BELT_X ? 1 : 0);
      }
  }
  for (let i = 0; i < path.length - 1; i++) {
    const a = i * 4, b = (i + 1) * 4;
    // inner (0,1) outer (2,3) faces and the two edges
    idx.push(a, b, a + 1, a + 1, b, b + 1);
    idx.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
    idx.push(a, a + 2, b, a + 2, b + 2, b);
    idx.push(a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
function pulleyGeo(r, grooved) {
  const prof = [[0.03, -0.06], [r, -0.06]];
  if (grooved) for (let i = 0; i < 6; i++) prof.push([r - 0.014, -0.045 + i * 0.017], [r, -0.037 + i * 0.017]);
  else prof.push([r + 0.012, -0.055], [r, -0.045], [r, 0.045], [r + 0.012, 0.055]);
  prof.push([r, 0.06], [r * 0.7, 0.065], [0.03, 0.065]);
  return latheX(prof, 56);
}
const fead = part("fead", { dir: V(1, 0.08, 0), dist: 1.3, out: [2.95, 1.9], inn: [10.9, 0.55], tumble: [0, 0, 0.03] });
const spinning = [];
{
  const belt = mesh(beltGeometry(), M.belt, fead);
  belt.material.side = THREE.DoubleSide;
  for (const p of PULLEYS) {
    if (p.onCrank) continue;
    const grp = new THREE.Group();
    grp.position.set(BELT_X, p.c[1], p.c[0]);
    fead.add(grp);
    mesh(pulleyGeo(p.r, p.w > 0 && p.name !== "idler" && p.name !== "tensioner"), p.name === "waterpump" ? M.machined : M.forged, grp);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      if (p.r > 0.12) mesh(new THREE.CircleGeometry(p.r * 0.18, 20).rotateY(Math.PI / 2), M.bore, grp, [0.066, p.r * 0.5 * Math.sin(a), p.r * 0.5 * Math.cos(a)]);
    }
    mesh(cylX(0.03, 0.02, 6), M.steel, grp, [0.075, 0, 0]);
    spinning.push({ grp, ratio: (DAMPER_R / p.r) * (p.w > 0 ? 1 : -1) });
  }
  // alternator: finned case, rear housing, cooling slots
  const alt = PULLEYS.find((p) => p.name === "alternator").c;
  const altProf = [[0.001, -0.18], [0.2, -0.18], [0.22, -0.15]];
  for (let i = 0; i < 7; i++) altProf.push([0.22, -0.13 + i * 0.033], [0.205, -0.118 + i * 0.033], [0.22, -0.106 + i * 0.033]);
  altProf.push([0.22, 0.1], [0.19, 0.14], [0.001, 0.14]);
  mesh(latheX(altProf, 48), M.alu, fead, [BELT_X - 0.26, alt[1], alt[0]]);
  mesh(cylX(0.06, 0.08), M.dark, fead, [BELT_X - 0.47, alt[1], alt[0]]);
  // A/C compressor with clutch plate
  const ac = PULLEYS.find((p) => p.name === "ac").c;
  mesh(latheX([[0.001, -0.3], [0.17, -0.3], [0.19, -0.26], [0.19, 0.0], [0.15, 0.03], [0.001, 0.03]], 48), M.alu, fead, [BELT_X - 0.14, ac[1], ac[0]]);
  mesh(rbox(0.1, 0.1, 0.12, 0.02), M.machined, fead, [BELT_X - 0.3, ac[1] + 0.2, ac[0]]);
  // tensioner arm + spring can
  const tn = PULLEYS.find((p) => p.name === "tensioner").c;
  mesh(cylX(0.08, 0.1, 32), M.alu, fead, [BELT_X - 0.07, tn[1] - 0.16, tn[0] - 0.12]);
  mesh(rbox(0.04, 0.24, 0.07, 0.02), M.alu, fead, [BELT_X - 0.02, tn[1] - 0.08, tn[0] - 0.06], [-0.6, 0, 0]);
  // thermostat housing + upper hose stub
  mesh(cylX(0.075, 0.14, 24), M.alu, fead, [BELT_X - 0.06, 0.95, 0.0]);
  mesh(cylX(0.055, 0.12, 24), M.machined, fead, [BELT_X + 0.06, 0.95, 0.0]);
  mesh(new THREE.TorusGeometry(0.058, 0.01, 8, 24).rotateY(Math.PI / 2), M.machined, fead, [BELT_X + 0.12, 0.95, 0.0]);
}

// --- Exhaust headers (stainless, heat-tinted) with O2 sensors ---
for (const side of SIDES) {
  const g = part(`header${side}`, { dir: V(0, -0.15, side), dist: 0.95, out: [3.5, 1.8], inn: [10.4, 0.55] });
  const zc = side * 1.12;
  for (let k = 0; k < 4; k++) {
    const x = cylX_of(side, k);
    const port = bankToWorld(side, x, D + 0.17, side * 0.37);
    const out = bankLocalZ(side).multiplyScalar(side);
    mesh(tube([port, port.clone().addScaledVector(out, 0.22), V(x * 0.95, port.y - 0.42, zc + side * 0.12), V(x * 0.55 - 0.3, -0.18, zc), V(-0.62, -0.36, zc)], 0.052, 64, 14), M.header, g);
    mesh(rbox(0.24, 0.16, 0.05, 0.02).lookAt(out), M.header, g, port.toArray());
  }
  mesh(tube([V(-0.6, -0.36, zc), V(-1.05, -0.42, zc), V(-1.45, -0.44, zc)], 0.1, 24, 20), M.header, g);
  mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 32).rotateY(Math.PI / 2), M.steel, g, [-1.45, -0.44, zc]);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), M.steel, g, [-1.0, -0.3, zc]);
  mesh(tube([V(-1.0, -0.24, zc), V(-0.9, -0.1, zc - side * 0.05), V(-0.7, 0.0, zc - side * 0.2)], 0.012, 20, 6), M.loom, g);
}

// --- Intake: composite plenum, tall runners, throttle body, fuel rails, injectors ---
const intake = part("intake", { dir: up, dist: 2.25, out: [2.55, 2.1], inn: [11.0, 0.62], tumble: [0, 0.05, 0] });
{
  mesh(rbox(1.84, 0.32, 0.62, 0.13, 6), M.composite, intake, [0, 1.56, 0]);
  mesh(rbox(1.5, 0.06, 0.34, 0.03), M.composite, intake, [0, 1.74, 0]);
  mesh(rbox(0.56, 0.012, 0.15, 0.006), M.badge, intake, [0.2, 1.775, 0]);
  for (const side of SIDES) {
    for (let k = 0; k < 4; k++) {
      const x = cylX_of(side, k);
      const port = bankToWorld(side, x, D + 0.2, -side * 0.37);
      mesh(tube([V(x, 1.66, side * 0.18), V(x, 1.78, side * 0.44), V(x, 1.6, side * 0.66), port.clone().add(V(0, 0.14, side * 0.03)), port], 0.078, 56, 16), M.composite, intake);
      // injector: body into the port, connector on top
      const inj = port.clone().add(V(0.07, 0.1, -side * 0.06));
      mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.12, 12), M.steel, intake, inj.toArray(), [side * 0.6, 0, 0]);
      mesh(rbox(0.04, 0.04, 0.05, 0.01), M.dark, intake, inj.clone().add(V(0, 0.07, -side * 0.04)).toArray());
    }
    const a = bankToWorld(side, -0.95, D + 0.36, -side * 0.44), b = bankToWorld(side, 1.0, D + 0.36, -side * 0.44);
    mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 8, 0.032, 12), M.steel, intake);
  }
  // throttle body at the front with its drive-by-wire motor housing
  mesh(cylX(0.17, 0.2, 48), M.alu, intake, [1.06, 1.56, 0]);
  mesh(new THREE.TorusGeometry(0.17, 0.02, 12, 48).rotateY(Math.PI / 2), M.machined, intake, [1.17, 1.56, 0]);
  mesh(new THREE.CircleGeometry(0.15, 40).rotateY(Math.PI / 2), M.dark, intake, [1.165, 1.56, 0]);
  mesh(rbox(0.16, 0.2, 0.12, 0.03), M.dark, intake, [1.05, 1.56, -0.24]);
}

// ---------- floor: glossy studio deck with a soft planar reflection ----------
const floorAlpha = radialAlpha();
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(14, 96),
  new THREE.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.7, specularIntensity: 0.25, envMapIntensity: 0.06, transparent: true, alphaMap: floorAlpha }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = FLOOR_Y;
floor.receiveShadow = true;
scene.add(floor);
const reflector = new Reflector(new THREE.CircleGeometry(14, 96), {
  textureWidth: 540,
  textureHeight: 960,
  clipBias: 0.003,
  color: 0x6f7378,
  shader: {
    name: "FadeReflector",
    uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uOpacity: { value: 0.5 } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main(){ vUv = textureMatrix * vec4(position,1.0); vW = (modelMatrix*vec4(position,1.0)).xyz;
      gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float uOpacity; varying vec4 vUv; varying vec3 vW;
      void main(){ vec4 base = texture2DProj(tDiffuse, vUv); float d = length(vW.xz);
      float fade = exp(-d*d/10.0); gl_FragColor = vec4(base.rgb*color, uOpacity*fade); }`,
  },
});
reflector.material.transparent = true;
reflector.material.depthWrite = false;
reflector.rotation.x = -Math.PI / 2;
reflector.position.y = FLOOR_Y + 0.004;
scene.add(reflector);

// ---------- lights ----------
const key = new THREE.SpotLight(0xfff1e6, 320, 40, 0.6, 0.9, 1.6);
key.position.set(4.5, 10, 5.5);
key.target.position.set(0, 1.0, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0002;
key.shadow.normalBias = 0.02;
key.shadow.camera.near = 4;
key.shadow.camera.far = 26;
scene.add(key, key.target);
const rimCool = new THREE.DirectionalLight(0xbcd2ff, 3.2);
rimCool.position.set(-6, 4.5, -5);
const rimWarm = new THREE.DirectionalLight(0xffd6b0, 2.2);
rimWarm.position.set(6, 3, -6);
scene.add(rimCool, rimWarm);
const sweep = new THREE.RectAreaLight(0xffffff, 0, 0.5, 9);
scene.add(sweep);
const flash = new THREE.PointLight(0xffe6c8, 0, 4, 2);
scene.add(flash);

// Atmospheric dust
const dust = (() => {
  const rnd = mulberry32(7);
  const n = 380;
  const base = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    base[i * 3] = (rnd() - 0.5) * 10;
    base[i * 3 + 1] = rnd() * 9 - 0.8;
    base[i * 3 + 2] = (rnd() - 0.5) * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(base.slice(), 3));
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({ size: 0.035, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe9d6 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return { pts, base, geo, n };
})();

// ---------- post ----------
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.28, 0.55, 0.9));
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 1 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uFade; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*37.0) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c*vec2(0.72,1.0), c*vec2(0.72,1.0));
      vec2 off = c * 0.0035 * r2 * 4.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      float lum = dot(col, vec3(0.299,0.587,0.114));
      col += mix(vec3(-0.004,0.004,0.012), vec3(0.016,0.006,-0.01), smoothstep(0.0,0.7,lum));
      col *= mix(1.0, 0.45, smoothstep(0.08, 0.62, r2));
      col += (hash(vUv*vec2(1080.0,1920.0)) - 0.5) * 0.03;
      gl_FragColor = vec4(col * uFade, 1.0);
    }`,
});
composer.addPass(grade);

// ---------- choreography ----------
// Camera keys: [time, azimuth°, elevation°, distance, targetY, fov]
const CAM = [
  [0.0, 58, 3, 6.0, 0.5, 30],
  [2.4, 50, 6, 7.6, 0.45, 30],
  [3.7, 42, 9, 12.4, 1.6, 30],
  [5.2, 34, 11, 16.6, 2.5, 30],
  [7.2, 24, 12, 15.5, 2.35, 30],
  [9.0, 14, 11, 15.5, 2.35, 30],
  [11.2, 24, 8, 12.5, 1.2, 30],
  [12.6, 38, 5, 12.0, -0.05, 30],
  [15.0, 52, 2.5, 14.0, -1.1, 30],
];
function camAt(t) {
  const n = CAM.length;
  let i = 0;
  while (i < n - 2 && t > CAM[i + 1][0]) i++;
  const k0 = CAM[Math.max(0, i - 1)], k1 = CAM[i], k2 = CAM[i + 1], k3 = CAM[Math.min(n - 1, i + 2)];
  const s = clamp01((t - k1[0]) / (k2[0] - k1[0]));
  const out = [];
  for (let c = 1; c < 6; c++) {
    const m1 = ((k2[c] - k0[c]) / Math.max(1e-6, k2[0] - k0[0])) * (k2[0] - k1[0]);
    const m2 = ((k3[c] - k1[c]) / Math.max(1e-6, k3[0] - k1[0])) * (k2[0] - k1[0]);
    const s2 = s * s, s3 = s2 * s;
    out.push((2 * s3 - 3 * s2 + 1) * k1[c] + (s3 - 2 * s2 + s) * m1 + (-2 * s3 + 3 * s2) * k2[c] + (s3 - s2) * m2);
  }
  return out;
}

// Crank angle: integrate a smooth speed profile (rev/s) with a fixed step so every seek is identical.
const omega = (t) => 0.22 * smooth((t - 2.2) / 1.5) + 1.9 * smooth((t - 12.4) / 1.8);
function crankAngle(t) {
  const dt = 1 / 240;
  let a = 0;
  for (let x = 0; x < t; x += dt) a += omega(Math.min(x + dt / 2, t)) * Math.min(dt, t - x);
  return a * Math.PI * 2;
}

function explodeAmount(p, t, withDrift = true) {
  const [o0, od] = p.out, [i0, id] = p.inn;
  const drift = withDrift ? 0.035 * Math.sin(t * 1.4 + p.phase) * smooth((t - 5) / 2) * (1 - smooth((t - 9) / 0.6)) : 0;
  if (t < i0) return easeInOutQuint((t - o0) / od) + drift;
  const pin = (t - i0) / id;
  if (pin < 1) return 1 - easeInCubic(pin) + drift;
  // contact: a short, stiff rebound so the part reads as metal seating on metal
  const tau = t - i0 - id;
  return 0.02 * Math.exp(-tau * 18) * Math.abs(Math.sin(tau * 40));
}
const landings = parts.filter((p) => p.dist > 0).map((p) => ({ t: p.inn[0] + p.inn[1], p }));
const kickRnd = mulberry32(99);
const kicks = landings.map(() => V(kickRnd() - 0.5, kickRnd() - 0.5, kickRnd() - 0.5).normalize());

// Callout anchors, in each part's local frame.
const labels = [...document.querySelectorAll("[data-anchor]")];
const ANCHORS = {
  head: ["head1", bankToWorld(1, 0, D + 0.2, 0)],
  piston: ["pistons-1", bankToWorld(-1, cylX_of(-1, 3), 0.95, 0)],
  crank: ["crankshaft", V(0.25, 0, 0)],
};

function renderAt(time) {
  const t = Math.min(Math.max(time, 0), DUR);

  // the running gear lifts off the pan (pan stays on the floor), then parts separate around it
  engine.position.y = LIFT * explodeAmount(byName.oilPan, t, false);
  for (const p of parts) {
    if (!p.dist) continue;
    const e = explodeAmount(p, t, p !== byName.oilPan);
    p.g.position.copy(p.dir).multiplyScalar(p.dist * e);
    const tb = Math.max(0, e);
    p.g.rotation.set(p.tumble[0] * tb, p.tumble[1] * tb, p.tumble[2] * tb);
  }
  const theta = crankAngle(t);
  crankRot.rotation.x = theta;
  for (const c of camShafts) c.rotation.x = theta * 0.5;
  for (const s of spinning) s.grp.rotation.x = theta * s.ratio;
  updatePistons(theta);

  // camera + landing kicks
  const [az, el, dist, ty, fov] = camAt(t);
  camera.position.set(
    dist * Math.cos(el * DEG) * Math.sin(az * DEG),
    ty + dist * Math.sin(el * DEG),
    dist * Math.cos(el * DEG) * Math.cos(az * DEG),
  );
  scene.updateMatrixWorld();
  let flashI = 0;
  landings.forEach((L, i) => {
    const tau = t - L.t;
    if (tau < 0 || tau > 0.6) return;
    const amp = Math.exp(-tau * 14);
    camera.position.addScaledVector(kicks[i], 0.05 * amp * Math.cos(tau * 48));
    if (amp > flashI) { flashI = amp; L.p.g.getWorldPosition(flash.position).add(V(0, 0.6, 0)); }
  });
  flash.intensity = 12 * flashI;
  camera.fov = fov;
  camera.updateProjectionMatrix();
  camera.lookAt(0, ty, 0);

  // light: reveal from darkness, strip sweeps on open and close
  const reveal = smooth((t - 0.1) / 2.2);
  scene.environmentIntensity = lerp(0.08, 1.0, reveal);
  key.intensity = 320 * smooth((t - 0.9) / 1.6);
  rimCool.intensity = 3.2 * smooth((t - 0.2) / 1.2);
  rimWarm.intensity = 2.2 * smooth((t - 0.5) / 1.4);
  const opening = t < 8;
  const sw = opening ? clamp01((t - 0.1) / 2.6) : clamp01((t - 12.9) / 1.8);
  const sweepAz = (opening ? lerp(115, -10, easeInOutQuint(sw)) : lerp(110, 10, easeInOutQuint(sw))) * DEG;
  sweep.position.set(4.2 * Math.sin(sweepAz), 1.2 + engine.position.y, 4.2 * Math.cos(sweepAz));
  sweep.lookAt(0, 0.4 + engine.position.y, 0);
  sweep.intensity = (opening ? 8 : 16) * Math.sin(Math.PI * sw) * (opening || t > 12.9 ? 1 : 0);

  // dust drift
  const pos = dust.geo.attributes.position.array;
  for (let i = 0; i < dust.n; i++) {
    pos[i * 3] = dust.base[i * 3] + 0.12 * Math.sin(t * 0.3 + i);
    pos[i * 3 + 1] = dust.base[i * 3 + 1] + t * 0.05 + 0.1 * Math.sin(t * 0.4 + i * 0.7);
    pos[i * 3 + 2] = dust.base[i * 3 + 2] + 0.12 * Math.cos(t * 0.25 + i * 1.3);
  }
  dust.geo.attributes.position.needsUpdate = true;
  dust.pts.material.opacity = 0.3 * reveal;

  grade.uniforms.uTime.value = Math.floor(t * 30) / 30;
  grade.uniforms.uFade.value = smooth(t / 0.35);
  composer.render();

  // overlay: callouts track their parts (their reveal lives on the GSAP timeline)
  for (const el of labels) {
    const [name, local] = ANCHORS[el.dataset.anchor];
    const v = local.clone().applyMatrix4(byName[name].g.matrixWorld).project(camera);
    const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
    const colX = el.classList.contains("left") ? 70 : W - 70;
    el.style.transform = `translate(0px, ${y.toFixed(1)}px)`;
    el.style.setProperty("--x", `${x.toFixed(1)}px`);
    el.style.setProperty("--lx", `${Math.min(x, colX).toFixed(1)}px`);
    el.style.setProperty("--lw", `${Math.abs(x - colX).toFixed(1)}px`);
  }
}

window.__v8RenderAt = renderAt;
window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
renderAt(window.__hfThreeTime || 0);
markReady();
