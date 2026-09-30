// V8 exploded-view — procedural Three.js scene, rendered purely from HyperFrames time.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

const W = 1080, H = 1920, DUR = 15;

// ---------- math helpers ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const easeInOutQuint = (x) => { x = clamp01(x); return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2; };
const easeOutExpo = (x) => { x = clamp01(x); return x === 1 ? 1 : 1 - 2 ** (-10 * x); };
const easeInCubic = (x) => { x = clamp01(x); return x * x * x; };
const DEG = Math.PI / 180;

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

function noiseTexture({ seed, size = 512, base = 8, octaves = 5, ridge = false, lo = 0, hi = 1 }) {
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
      v = lerp(lo, hi, v / norm);
      const b = Math.round(clamp01(v) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function carbonTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const cell = 16;
  for (let j = 0; j < 512 / cell; j++) {
    for (let i = 0; i < 512 / cell; i++) {
      const horiz = (i + j) % 4 < 2;
      const g = horiz
        ? ctx.createLinearGradient(i * cell, j * cell, i * cell, (j + 1) * cell)
        : ctx.createLinearGradient(i * cell, j * cell, (i + 1) * cell, j * cell);
      g.addColorStop(0, "#15171a");
      g.addColorStop(0.5, horiz ? "#4a4f57" : "#2c3036");
      g.addColorStop(1, "#15171a");
      ctx.fillStyle = g;
      ctx.fillRect(i * cell, j * cell, cell, cell);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(3, 1);
  tex.anisotropy = 8;
  return tex;
}

function backdropTexture() {
  const c = document.createElement("canvas");
  c.width = 540; c.height = 960;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, c.width, c.height);
  const g = ctx.createRadialGradient(270, 380, 20, 270, 420, 620);
  g.addColorStop(0, "#1d2126");
  g.addColorStop(0.45, "#0e1013");
  g.addColorStop(1, "#050607");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  const warm = ctx.createRadialGradient(270, 700, 10, 270, 700, 420);
  warm.addColorStop(0, "rgba(120,40,30,0.18)");
  warm.addColorStop(1, "rgba(120,40,30,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- renderer / scene ----------
const canvas = document.getElementById("three-layer");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
scene.background = backdropTexture();

// Studio environment: long strip softboxes give the automotive reflection lines.
function studioEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x020203);
  const box = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(...look);
    env.add(m);
  };
  box(14, 3, 0xffffff, 2.4, [0, 9, 0], [0, 0, 0]); // overhead softbox
  box(0.9, 12, 0xffffff, 3.2, [7, 2, 4], [0, 0, 0]); // front-right strip
  box(0.9, 12, 0xffffff, 4.0, [-6, 2, 6], [0, 0, 0]); // front-left strip
  box(0.6, 12, 0xcfe0ff, 3.0, [-5, 2, -7], [0, 0, 0]); // back cool strip
  box(0.6, 12, 0xffe2c4, 3.0, [6, 2, -6], [0, 0, 0]); // back warm strip
  box(20, 2, 0x3a1a12, 0.6, [0, -6, 0], [0, 0, 0]); // warm floor bounce
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}
scene.environment = studioEnvironment();

// ---------- materials ----------
const castBump = noiseTexture({ seed: 11, base: 32, octaves: 3 });
castBump.repeat.set(2, 2);
const castRough = noiseTexture({ seed: 23, base: 4, octaves: 4, lo: 0.7, hi: 1.0 });
castRough.repeat.set(1.5, 1.5);
const crinkle = noiseTexture({ seed: 37, base: 48, octaves: 3, ridge: true });
crinkle.repeat.set(3, 3);

const M = {
  alu: new THREE.MeshPhysicalMaterial({ color: 0x8e9399, metalness: 1, roughness: 0.52, roughnessMap: castRough, bumpMap: castBump, bumpScale: 0.22 }),
  machined: new THREE.MeshPhysicalMaterial({ color: 0xc9cdd2, metalness: 1, roughness: 0.16 }),
  red: new THREE.MeshPhysicalMaterial({ color: 0x8f0a10, metalness: 0.25, roughness: 0.55, bumpMap: crinkle, bumpScale: 1.5, clearcoat: 0.6, clearcoatRoughness: 0.28 }),
  steel: new THREE.MeshPhysicalMaterial({ color: 0xd6d9dc, metalness: 1, roughness: 0.09 }),
  forged: new THREE.MeshPhysicalMaterial({ color: 0x80858c, metalness: 1, roughness: 0.3, bumpMap: castBump, bumpScale: 0.12 }),
  dark: new THREE.MeshPhysicalMaterial({ color: 0x101113, metalness: 0.2, roughness: 0.45, clearcoat: 0.3 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 }),
  bore: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1 }),
  gasket: new THREE.MeshPhysicalMaterial({ color: 0x4a4d52, metalness: 0.9, roughness: 0.32 }),
  header: new THREE.MeshPhysicalMaterial({
    color: 0x9d948b, metalness: 1, roughness: 0.28,
    iridescence: 0.5, iridescenceIOR: 1.9, iridescenceThicknessRange: [250, 650],
  }),
  carbon: new THREE.MeshPhysicalMaterial({ map: carbonTexture(), metalness: 0.25, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.04 }),
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

// ---------- engine geometry constants ----------
const D = 1.08; // deck height from crank axis along bank axis
const CR = 0.2; // crank throw
const RL = 0.75; // rod length
const BANK = 45 * DEG;
const PIN_X = [-0.75, -0.25, 0.25, 0.75];
const PIN_PHASE = [0, Math.PI / 2, (3 * Math.PI) / 2, Math.PI]; // cross-plane crank
const SIDES = [1, -1]; // +1 left bank (+Z), -1 right bank (-Z)
const bankAngle = (side) => side * BANK;
const bankAxis = (side) => new THREE.Vector3(0, Math.cos(bankAngle(side)), Math.sin(bankAngle(side)));
const bankLocalZ = (side) => new THREE.Vector3(0, -Math.sin(bankAngle(side)), Math.cos(bankAngle(side)));
const bankToWorld = (side, x, y, z) => {
  const a = bankAngle(side);
  return new THREE.Vector3(x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a));
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
function part(name, { dir, dist, out, inn, tumble = [0, 0, 0] }) {
  const g = new THREE.Group();
  g.name = name;
  engine.add(g);
  parts.push({ g, dir: dir.clone().normalize(), dist, out, inn, tumble, phase: parts.length * 1.37 });
  return g;
}
const up = new THREE.Vector3(0, 1, 0);
const bankish = (side, k) => bankAxis(side).add(new THREE.Vector3(0, k, 0));

// Block profile (lateral z, vertical y) — shared by block and timing cover.
function blockShape(scale = 1) {
  const s = new THREE.Shape();
  const u = [Math.sin(BANK), Math.cos(BANK)];
  const p = [Math.cos(BANK), -Math.sin(BANK)];
  const C = [u[0] * D, u[1] * D];
  const outer = [C[0] + p[0] * 0.31, C[1] + p[1] * 0.31];
  const inner = [C[0] - p[0] * 0.31, C[1] - p[1] * 0.31];
  const valley = [inner[0] - u[0] * 0.52, inner[1] - u[1] * 0.52];
  const flank = [outer[0] - u[0] * 0.45, outer[1] - u[1] * 0.45];
  const pts = [
    [0.66, -0.36], [flank[0], 0.05], flank, outer, inner, valley,
    [-valley[0], valley[1]], [-inner[0], inner[1]], [-outer[0], outer[1]], [-flank[0], flank[1]], [-flank[0], 0.05], [-0.66, -0.36],
  ];
  s.moveTo(pts[0][0] * scale, pts[0][1] * scale);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0] * scale, pts[i][1] * scale);
  s.closePath();
  return s;
}

// --- Block (static anchor) ---
const block = part("block", { dir: up, dist: 0, out: [0, 1], inn: [0, 1] });
{
  const L = 2.06;
  const geo = new THREE.ExtrudeGeometry(blockShape(), { depth: L, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 4 });
  geo.translate(0, 0, -L / 2);
  const m = mesh(geo, M.alu, block, [0, 0, 0], [0, Math.PI / 2, 0]);
  m.name = "blockBody";
  // cast ribs and mounts on the lower skirt
  for (const side of SIDES) {
    for (let i = 0; i < 7; i++) mesh(rbox(0.05, 0.36, 0.06, 0.015), M.alu, block, [-0.9 + i * 0.3, -0.13, side * 0.7]);
    mesh(rbox(0.34, 0.2, 0.14, 0.04), M.alu, block, [0.15, 0.1, side * 0.74]);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), M.machined, block, [0.15, 0.1, side * 0.82], [Math.PI / 2, 0, 0]);
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
  // valley cover plate
  mesh(rbox(1.9, 0.05, 0.5, 0.02), M.alu, block, [0, 0.62, 0]);
}

// --- Oil pan ---
const pan = part("oilPan", { dir: up.clone().negate(), dist: 1.95, out: [3.35, 1.9], inn: [9.0, 0.62], tumble: [0, 0, 0.04] });
{
  mesh(rbox(2.06, 0.05, 1.38, 0.02), M.machined, pan, [0, -0.39, 0]);
  mesh(rbox(1.96, 0.36, 1.24, 0.07), M.alu, pan, [0, -0.58, 0]);
  mesh(rbox(0.95, 0.32, 1.0, 0.08), M.alu, pan, [-0.45, -0.82, 0]);
  for (let i = 0; i < 6; i++) mesh(rbox(0.8, 0.05, 0.03, 0.01), M.alu, pan, [-0.45, -0.99, -0.4 + i * 0.16]);
  mesh(hexBolt.clone().scale(2, 2, 2), M.steel, pan, [-0.1, -0.98, 0.3]);
  for (let i = 0; i < 9; i++) for (const side of SIDES) mesh(hexBolt, M.steel, pan, [-0.95 + i * 0.237, -0.35, side * 0.66]);
}

// --- Crankshaft (rotates) ---
const crank = part("crankshaft", { dir: up.clone().negate(), dist: 1.05, out: [3.6, 1.9], inn: [9.2, 0.62] });
const crankRot = new THREE.Group();
crank.add(crankRot);
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
  mesh(cylX(0.07, 0.3), M.steel, crankRot, [1.2, 0, 0]);
  const balProfile = [[0.05, -0.08], [0.27, -0.08], [0.27, -0.05], [0.25, -0.04], [0.27, -0.03], [0.27, 0.0], [0.25, 0.01], [0.27, 0.02], [0.27, 0.05], [0.25, 0.06], [0.27, 0.07], [0.27, 0.08], [0.05, 0.08]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(balProfile, 64).rotateZ(Math.PI / 2), M.forged, crankRot, [1.3, 0, 0]);
  mesh(new THREE.TorusGeometry(0.2, 0.025, 12, 64).rotateY(Math.PI / 2), M.rubber, crankRot, [1.39, 0, 0]);
  mesh(cylX(0.22, 0.05, 48), M.forged, crankRot, [-1.12, 0, 0]);
}

// --- Pistons + rods (per bank; positioned per frame) ---
const pistonProfile = [
  [0.0, -0.12], [0.184, -0.12], [0.188, -0.02], [0.19, 0.0], [0.19, 0.035], [0.18, 0.037], [0.18, 0.047], [0.19, 0.049],
  [0.19, 0.062], [0.18, 0.064], [0.18, 0.073], [0.19, 0.075], [0.19, 0.095], [0.175, 0.105], [0.0, 0.112],
].map(([r, y]) => new THREE.Vector2(r, y));
const pistonGeo = new THREE.LatheGeometry(pistonProfile, 56);
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
    const rod = mesh(rodGeo, M.forged, bf, [x, 0, 0]);
    return { piston, rod, k };
  });
  return { side, items };
});

function updatePistons(theta) {
  for (const { side, items } of pistonSets) {
    const u = bankAxis(side), lz = bankLocalZ(side);
    for (const { piston, rod, k } of items) {
      const a = theta + PIN_PHASE[k];
      const P = new THREE.Vector3(0, CR * Math.cos(a), CR * Math.sin(a));
      const pa = P.dot(u), pb = P.dot(lz);
      const s = pa + Math.sqrt(RL * RL - pb * pb);
      piston.position.y = s;
      piston.position.z = 0;
      rod.position.y = pa;
      rod.position.z = pb;
      rod.rotation.x = Math.atan2(-pb, s - pa);
    }
  }
}

// --- Head gaskets ---
for (const side of SIDES) {
  const g = part(`gasket${side}`, { dir: bankish(side, 1.0), dist: 0.62, out: [3.7, 1.8], inn: [9.85, 0.55], tumble: [0.05 * side, 0, 0] });
  const bf = bankFrame(side, g);
  mesh(rbox(2.0, 0.012, 0.6, 0.005), M.gasket, bf, [0, D + 0.04, 0]);
  for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(0.212, 0.012, 8, 48).rotateX(Math.PI / 2), M.steel, bf, [cylX_of(side, k), D + 0.047, 0]);
}

// --- Cylinder heads ---
for (const side of SIDES) {
  const g = part(`head${side}`, { dir: bankish(side, 1.0), dist: 1.05, out: [3.3, 1.9], inn: [10.05, 0.58], tumble: [0.06 * side, 0, 0.02] });
  const bf = bankFrame(side, g);
  mesh(rbox(2.06, 0.3, 0.64, 0.035), M.alu, bf, [0, D + 0.2, 0]);
  mesh(rbox(2.06, 0.02, 0.64, 0.008), M.machined, bf, [0, D + 0.055, 0]);
  for (let k = 0; k < 4; k++) {
    const x = cylX_of(side, k);
    mesh(rbox(0.26, 0.14, 0.05, 0.02), M.machined, bf, [x, D + 0.17, side * 0.34]); // exhaust flange
    mesh(rbox(0.22, 0.12, 0.05, 0.02), M.machined, bf, [x, D + 0.2, -side * 0.34]); // intake flange
    for (const dx of [-0.25, 0.25]) mesh(hexBolt, M.steel, bf, [x + dx, D + 0.36, side * 0.26]);
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
    shaft.position.set(0, D + 0.4, dz);
    bf.add(shaft);
    mesh(cylX(0.04, 2.1, 20), M.steel, shaft);
    for (let k = 0; k < 4; k++) {
      for (const dv of [-0.07, 0.07]) {
        mesh(lobeGeo, M.steel, shaft, [cylX_of(side, k) + dv, 0, 0], [PIN_PHASE[k] * 0.5 + (dz > 0 ? 1.1 : 0) + dv * 3, 0, 0]);
      }
    }
    mesh(camGear, M.forged, shaft, [0.97, 0, 0]);
    camShafts.push(shaft);
  }
}

// --- Cam covers (red crinkle) ---
for (const side of SIDES) {
  const g = part(`cover${side}`, { dir: bankish(side, 1.25), dist: 2.15, out: [2.8, 2.0], inn: [10.6, 0.55], tumble: [0.1 * side, 0, -0.03] });
  const bf = bankFrame(side, g);
  mesh(rbox(2.04, 0.2, 0.64, 0.07, 6), M.red, bf, [0, D + 0.46, 0]);
  mesh(rbox(2.08, 0.035, 0.68, 0.012), M.machined, bf, [0, D + 0.365, 0]);
  for (const dz of [-0.2, 0.2]) mesh(rbox(1.7, 0.035, 0.035, 0.012), M.red, bf, [0, D + 0.575, dz]);
  for (let k = 0; k < 4; k++) {
    const x = cylX_of(side, k);
    mesh(rbox(0.17, 0.08, 0.13, 0.025), M.dark, bf, [x, D + 0.6, 0]);
    mesh(rbox(0.06, 0.05, 0.06, 0.01), M.dark, bf, [x + 0.1, D + 0.61, 0]);
  }
  for (let i = 0; i < 6; i++) for (const dz of [-0.285, 0.285]) mesh(hexBolt, M.steel, bf, [-0.85 + i * 0.34, D + 0.565, dz]);
  if (side > 0) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 32), M.dark, bf, [-0.7, D + 0.59, -0.1]);
}

// --- Timing cover ---
const timing = part("timing", { dir: new THREE.Vector3(1, 0.15, 0), dist: 0.85, out: [3.2, 1.9], inn: [10.8, 0.5] });
{
  const geo = new THREE.ExtrudeGeometry(blockShape(0.97), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  mesh(geo, M.alu, timing, [1.06, 0, 0], [0, Math.PI / 2, 0]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    mesh(hexBolt.clone().rotateZ(Math.PI / 2), M.steel, timing, [1.16, 0.45 + 0.45 * Math.sin(a), 0.5 * Math.cos(a)]);
  }
}

// --- Exhaust headers (heat-tinted, iridescent) ---
for (const side of SIDES) {
  const g = part(`header${side}`, { dir: new THREE.Vector3(0, -0.15, side), dist: 0.95, out: [3.5, 1.8], inn: [10.4, 0.55], tumble: [0, 0, 0] });
  const zc = side * 1.12;
  for (let k = 0; k < 4; k++) {
    const x = cylX_of(side, k);
    const port = bankToWorld(side, x, D + 0.17, side * 0.37);
    const out = bankLocalZ(side).multiplyScalar(side);
    const curve = new THREE.CatmullRomCurve3([
      port,
      port.clone().addScaledVector(out, 0.22),
      new THREE.Vector3(x * 0.95, port.y - 0.42, zc + side * 0.12),
      new THREE.Vector3(x * 0.55 - 0.3, -0.18, zc),
      new THREE.Vector3(-0.62, -0.36, zc),
    ]);
    mesh(new THREE.TubeGeometry(curve, 64, 0.052, 14), M.header, g);
    mesh(rbox(0.24, 0.16, 0.05, 0.02).lookAt(out), M.header, g, port.toArray());
  }
  const col = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.6, -0.36, zc), new THREE.Vector3(-1.05, -0.42, zc), new THREE.Vector3(-1.45, -0.44, zc)]);
  mesh(new THREE.TubeGeometry(col, 24, 0.1, 20), M.header, g);
  mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 32).rotateY(Math.PI / 2), M.steel, g, [-1.45, -0.44, zc]);
}

// --- Intake: plenum, runners, throttle body, fuel rails ---
const intake = part("intake", { dir: up, dist: 2.25, out: [2.55, 2.1], inn: [11.0, 0.62], tumble: [0, 0.05, 0] });
{
  mesh(rbox(1.84, 0.3, 0.64, 0.12, 6), M.alu, intake, [0, 1.52, 0]);
  mesh(rbox(1.62, 0.04, 0.5, 0.02), M.carbon, intake, [0, 1.685, 0]);
  for (let i = 0; i < 6; i++) for (const dz of [-0.27, 0.27]) mesh(hexBolt, M.steel, intake, [-0.75 + i * 0.3, 1.69, dz]);
  for (const side of SIDES) {
    for (let k = 0; k < 4; k++) {
      const x = cylX_of(side, k);
      const port = bankToWorld(side, x, D + 0.2, -side * 0.37);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 1.48, side * 0.26),
        new THREE.Vector3(x, 1.44, side * 0.52),
        port.clone().add(new THREE.Vector3(0, 0.12, side * 0.02)),
        port,
      ]);
      mesh(new THREE.TubeGeometry(curve, 40, 0.07, 16), M.alu, intake);
    }
    const railStart = bankToWorld(side, -0.95, D + 0.32, -side * 0.42);
    const railEnd = bankToWorld(side, 0.95, D + 0.32, -side * 0.42);
    mesh(new THREE.TubeGeometry(new THREE.LineCurve3(railStart, railEnd), 8, 0.03, 12), M.steel, intake);
  }
  mesh(cylX(0.16, 0.26, 48), M.alu, intake, [1.05, 1.52, 0]);
  mesh(new THREE.TorusGeometry(0.16, 0.022, 12, 48).rotateY(Math.PI / 2), M.steel, intake, [1.18, 1.52, 0]);
  mesh(new THREE.CircleGeometry(0.14, 40).rotateY(Math.PI / 2), M.dark, intake, [1.17, 1.52, 0]);
}

// ---------- lights ----------
const key = new THREE.SpotLight(0xfff1e6, 380, 30, 0.55, 0.9, 1.6);
key.position.set(4.5, 8, 5.5);
key.target.position.set(0, 0.4, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0002;
key.shadow.normalBias = 0.02;
key.shadow.camera.near = 3;
key.shadow.camera.far = 22;
scene.add(key, key.target);
const rimCool = new THREE.DirectionalLight(0xbcd2ff, 3.2);
rimCool.position.set(-6, 3.5, -5);
const rimWarm = new THREE.DirectionalLight(0xffd6b0, 2.4);
rimWarm.position.set(6, 1.5, -6);
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
    base[i * 3] = (rnd() - 0.5) * 9;
    base[i * 3 + 1] = (rnd() - 0.5) * 11 + 0.5;
    base[i * 3 + 2] = (rnd() - 0.5) * 9;
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
  const mat = new THREE.PointsMaterial({ size: 0.035, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe9d6 });
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
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.32, 0.55, 0.88);
composer.addPass(bloom);
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
      col += mix(vec3(-0.004,0.004,0.012), vec3(0.018,0.006,-0.012), smoothstep(0.0,0.7,lum));
      col *= mix(1.0, 0.42, smoothstep(0.08, 0.62, r2));
      col += (hash(vUv*vec2(1080.0,1920.0)) - 0.5) * 0.035;
      gl_FragColor = vec4(col * uFade, 1.0);
    }`,
});
composer.addPass(grade);

// ---------- choreography ----------
// Camera keys: [time, azimuth°, elevation°, distance, targetY, fov]
const CAM = [
  [0.0, 58, 3, 6.0, 0.5, 30],
  [2.4, 50, 7, 7.6, 0.45, 30],
  [5.2, 34, 14, 15.0, 0.5, 30],
  [7.2, 24, 16, 17.0, 0.5, 30],
  [9.0, 14, 15, 17.2, 0.5, 30],
  [11.2, 24, 10, 13.5, 0.35, 30],
  [12.6, 38, 6, 13.0, -0.2, 30],
  [15.0, 52, 2, 14.8, -1.25, 30],
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

function explodeAmount(p, t) {
  const [o0, od] = p.out, [i0, id] = p.inn;
  const drift = 0.035 * Math.sin(t * 1.4 + p.phase) * smooth((t - 5) / 2) * (1 - smooth((t - 9) / 0.6));
  if (t < i0) return easeInOutQuint((t - o0) / od) + drift;
  const pin = (t - i0) / id;
  if (pin < 1) return 1 - easeInCubic(pin) + drift;
  // contact: a short, stiff rebound so the part reads as metal seating on metal
  const tau = t - i0 - id;
  return 0.02 * Math.exp(-tau * 18) * Math.abs(Math.sin(tau * 40));
}
const landings = parts.filter((p) => p.dist > 0).map((p) => ({ t: p.inn[0] + p.inn[1], p }));
const kickRnd = mulberry32(99);
const kicks = landings.map(() => new THREE.Vector3(kickRnd() - 0.5, kickRnd() - 0.5, kickRnd() - 0.5).normalize());

const tmp = new THREE.Vector3();
const labels = [...document.querySelectorAll("[data-anchor]")];
const anchorOf = {
  head: () => tmp.copy(bankToWorld(1, 0, D + 0.2, 0)).add(offsetOf("head1")),
  piston: () => tmp.copy(bankToWorld(-1, cylX_of(-1, 3), 0.9, 0)).add(offsetOf("pistons-1")),
  crank: () => tmp.set(0.25, 0, 0).add(offsetOf("crankshaft")),
};
const offsets = {};
const offsetOf = (name) => offsets[name] || new THREE.Vector3();

function renderAt(time) {
  const t = Math.min(Math.max(time, 0), DUR);

  // parts
  for (const p of parts) {
    if (!p.dist) continue;
    const e = explodeAmount(p, t);
    const off = p.dir.clone().multiplyScalar(p.dist * e);
    p.g.position.copy(off);
    offsets[p.g.name] = off;
    const tb = Math.max(0, e);
    p.g.rotation.set(p.tumble[0] * tb, p.tumble[1] * tb, p.tumble[2] * tb);
  }
  const theta = crankAngle(t);
  crankRot.rotation.x = theta;
  for (const c of camShafts) c.rotation.x = theta * 0.5;
  updatePistons(theta);

  // camera + landing kicks
  const [az, el, dist, ty, fov] = camAt(t);
  const target = new THREE.Vector3(0, ty, 0);
  camera.position.set(
    dist * Math.cos(el * DEG) * Math.sin(az * DEG),
    ty + dist * Math.sin(el * DEG),
    dist * Math.cos(el * DEG) * Math.cos(az * DEG),
  );
  let flashI = 0;
  landings.forEach((L, i) => {
    const tau = t - L.t;
    if (tau < 0 || tau > 0.6) return;
    const amp = Math.exp(-tau * 14);
    camera.position.addScaledVector(kicks[i], 0.05 * amp * Math.cos(tau * 48));
    if (amp > flashI) { flashI = amp; flash.position.copy(L.p.g.position).add(new THREE.Vector3(0, 0.6, 0)); }
  });
  flash.intensity = 14 * flashI;
  camera.fov = fov;
  camera.updateProjectionMatrix();
  camera.lookAt(target);

  // light: reveal from darkness, strip sweeps on open and close
  const reveal = smooth((t - 0.1) / 2.2);
  scene.environmentIntensity = lerp(0.08, 1.0, reveal);
  key.intensity = 380 * smooth((t - 0.9) / 1.6);
  rimCool.intensity = 3.2 * smooth((t - 0.2) / 1.2);
  rimWarm.intensity = 2.4 * smooth((t - 0.5) / 1.4);
  const sw1 = clamp01((t - 0.1) / 2.6), sw2 = clamp01((t - 12.9) / 1.8);
  const sweepK = t < 8 ? sw1 : sw2;
  const sweepAz = (t < 8 ? lerp(115, -10, easeInOutQuint(sw1)) : lerp(110, 10, easeInOutQuint(sw2))) * DEG;
  sweep.position.set(4.2 * Math.sin(sweepAz), 1.2, 4.2 * Math.cos(sweepAz));
  sweep.lookAt(0, 0.4, 0);
  sweep.intensity = 22 * Math.sin(Math.PI * sweepK) * (t < 8 || t > 12.9 ? 1 : 0);

  // dust drift
  const pos = dust.geo.attributes.position.array;
  for (let i = 0; i < dust.n; i++) {
    pos[i * 3] = dust.base[i * 3] + 0.12 * Math.sin(t * 0.3 + i);
    pos[i * 3 + 1] = dust.base[i * 3 + 1] + t * 0.05 + 0.1 * Math.sin(t * 0.4 + i * 0.7);
    pos[i * 3 + 2] = dust.base[i * 3 + 2] + 0.12 * Math.cos(t * 0.25 + i * 1.3);
  }
  dust.geo.attributes.position.needsUpdate = true;
  dust.pts.material.opacity = 0.35 * reveal;

  grade.uniforms.uTime.value = Math.floor(t * 30) / 30;
  grade.uniforms.uFade.value = smooth(t / 0.35);
  composer.render();

  // overlay: spec callouts track their parts; title resolves at the end
  for (const el of labels) {
    const a = anchorOf[el.dataset.anchor]();
    const v = a.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
    // dot sits on the part; the tag lives in a fixed edge column at the dot's height
    const colX = el.classList.contains("left") ? 70 : W - 70;
    el.style.transform = `translate(0px, ${y.toFixed(1)}px)`;
    el.style.setProperty("--x", `${x.toFixed(1)}px`);
    el.style.setProperty("--lx", `${Math.min(x, colX).toFixed(1)}px`);
    el.style.setProperty("--lw", `${Math.abs(x - colX).toFixed(1)}px`);
    const inT = parseFloat(el.dataset.in);
    const k = easeOutExpo((t - inT) / 0.6) * (1 - smooth((t - 8.9) / 0.4));
    el.style.setProperty("--k", k.toFixed(4));
  }
  const title = document.getElementById("title-block");
  if (title) {
    title.style.setProperty("--rule", easeOutExpo((t - 12.95) / 0.7).toFixed(4));
    title.style.setProperty("--word", easeOutExpo((t - 13.15) / 1.0).toFixed(4));
    title.style.setProperty("--spec", easeOutExpo((t - 13.7) / 0.8).toFixed(4));
  }
}

window.__v8RenderAt = renderAt;
window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["v8-scene"] = document.fonts.ready.then(() => renderAt(window.__hfThreeTime || 0));
renderAt(window.__hfThreeTime || 0);
