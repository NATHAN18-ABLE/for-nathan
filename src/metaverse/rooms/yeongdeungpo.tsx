"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Boardwalk, CityView, Mountains, Quality, TexBox, rand, surface, worldBox, type Hill } from "../world";
import { toon, toonWith } from "../toon/material";
import { Ink } from "../toon/part";
import { AcUnit, Poles, Pot, Scooter, Sign } from "./props";
import { Burst, Neighbor } from "../life";
import { on } from "../bus";
import type { RoomConfig } from "../types";

// Mullae-dong's ironworks alleys on a rainy autumn evening, about 60 m x 80 m and flat.
// North is -z. From a small square at the south end, one alley runs north between steel
// workshops, crossed by two lanes, to a square with a welded steel sculpture. Workshops keep
// their shutters up into the evening; upstairs, artists' studios and small cafés have moved in.
// Shop signs carry generic trade words, not real business names.

const HILLS: Hill[] = [];
const LIFT = 0.05;

type Rect = { x0: number; z0: number; x1: number; z1: number };
const PLAZA: Rect = { x0: -12, z0: 22, x1: 12, z1: 32 };
const MAIN: Rect = { x0: -2.5, z0: -30, x1: 2.5, z1: 22 };
const SQUARE: Rect = { x0: -10, z0: -40, x1: 10, z1: -30 };
const RECTS: Rect[] = [
  PLAZA,
  MAIN,
  { x0: -28, z0: -15, x1: -2.5, z1: -10.5 }, // the north lane, west and east
  { x0: 2.5, z0: -15, x1: 28, z1: -10.5 },
  { x0: -28, z0: 6, x1: -2.5, z1: 10.5 }, // the south lane
  { x0: 2.5, z0: 6, x1: 28, z1: 10.5 },
  SQUARE,
];
const LANES = RECTS.filter((r) => r !== PLAZA && r !== SQUARE);

// Buildings placed by hand: the gallery behind a shutter, the mural wall, the welder's shop, the café.
const GALLERY = { x0: 13, z0: 22.5, x1: 20, z1: 31.5 }; // faces west, onto the plaza
const MURAL = { x0: -20, z0: 22.5, x1: -13, z1: 31.5 }; // its east wall is painted
const WELDER = { x0: 3.6, z0: -6.2, x1: 10, z1: 0.2 }; // faces west, onto the alley
const CAFE = { x0: -12, z0: -47, x1: -4, z1: -41 }; // faces south, onto the square
const FIXED = [GALLERY, MURAL, WELDER, CAFE];

const SCULPTURE = { x: 0, z: -35.5 };
const ANVIL = { x: 7, z: -36.8 };
const BENCH = { x: -8, z: -39.1 };
const ARTIST = { x: 10.9, z: 30.6 };
const WELDER_AT = { x: 3.0, z: -3.2 }; // where the welder stands, just outside the shop

const overlaps = (a: Rect, b: Rect, m: number) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;

const WORDS = ["선반", "용접", "절단", "철강", "금속", "밀링", "판금", "기계", "볼트", "주물", "철공", "배관"];
const WALLS = ["#b9b4ab", "#c9c2b4", "#a9aeb3", "#bfb3a0", "#d3cdc2", "#9fa6a8"];
const SIGN_COLORS = ["#2f5aa8", "#3e7d5b", "#c8463c", "#e0a53a", "#4a4f5a"];

interface Lot extends Rect {
  face: { dx: number; dz: number }; // the way the shopfront looks (toward its alley)
  floors: number;
  wall: string;
  open: boolean; // shutter up, the workshop lit inside
  word: string | null;
  sign: string;
  brick: boolean;
  seed: number;
}

const LOTS: Lot[] = (() => {
  const r = rand(77);
  const out: Lot[] = [];
  const free = (l: Rect, m = 0.9) => !RECTS.some((q) => overlaps(l, q, m)) && !out.some((q) => overlaps(l, q, 0.12)) && !FIXED.some((q) => overlaps(l, q, 0.3));
  const dress = (l: Rect, face: { dx: number; dz: number }, front: boolean): Lot => ({
    ...l,
    face,
    floors: r() < 0.55 ? 2 : 1,
    wall: WALLS[Math.floor(r() * WALLS.length)],
    open: front && r() < 0.5,
    word: front && r() < 0.75 ? WORDS[Math.floor(r() * WORDS.length)] : null,
    sign: SIGN_COLORS[Math.floor(r() * SIGN_COLORS.length)],
    brick: r() < 0.3,
    seed: Math.floor(r() * 1e6),
  });
  for (const l of FIXED) {
    const lot = dress(l, l === CAFE ? { dx: 0, dz: 1 } : l === MURAL ? { dx: 1, dz: 0 } : { dx: -1, dz: 0 }, true);
    // the mural wall and the gallery front are drawn on their own; the welder works with the shutter up
    if (l === MURAL || l === GALLERY) Object.assign(lot, { open: false, word: null, floors: 2 });
    if (l === WELDER) Object.assign(lot, { open: true, word: "용접", floors: 2 });
    if (l === CAFE) Object.assign(lot, { open: true, word: "카페", sign: "#3e7d5b", floors: 2 });
    out.push(lot);
  }
  // a row of workshops along each side of every alley, fronts onto it
  const GAP = 1.0;
  for (const q of LANES) {
    const tall = q.z1 - q.z0 > q.x1 - q.x0;
    for (const side of [-1, 1]) {
      let t = tall ? q.z0 : q.x0;
      const end = tall ? q.z1 : q.x1;
      while (t < end - 2.5) {
        const len = 4.6 + r() * 2.4, depth = 6 + r() * 2;
        const l = tall
          ? side < 0
            ? { x0: q.x0 - GAP - depth, x1: q.x0 - GAP, z0: t, z1: t + len }
            : { x0: q.x1 + GAP, x1: q.x1 + GAP + depth, z0: t, z1: t + len }
          : side < 0
            ? { z0: q.z0 - GAP - depth, z1: q.z0 - GAP, x0: t, x1: t + len }
            : { z0: q.z1 + GAP, z1: q.z1 + GAP + depth, x0: t, x1: t + len };
        if (free(l)) out.push(dress(l, tall ? { dx: -side, dz: 0 } : { dx: 0, dz: -side }, true));
        t += len + 0.15;
      }
    }
  }
  // the backs of the blocks, so the alleys read as a dense neighbourhood
  for (let z = -56; z < 44; z += 7)
    for (let x = -40; x < 40; x += 7) {
      const w = 5.5 + r() * 1.4, d = 5.5 + r() * 1.4;
      const l = { x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 };
      if (free(l, 1.2)) out.push(dress(l, { dx: 0, dz: 1 }, false));
    }
  return out;
})();

const LAMPS: [number, number][] = [
  [3.0, 16],
  [-3.0, 3],
  [3.0, -9],
  [-3.0, -22],
  [-8.5, 23.2],
  [8.5, 23.2],
  [-8.5, -30.8],
  [8.5, -30.8],
];

const HOLES = [
  { x: SCULPTURE.x, z: SCULPTURE.z, r: 1.9 },
  { x: ANVIL.x, z: ANVIL.z, r: 0.85 },
  { x: BENCH.x, z: BENCH.z, r: 1.2 },
  { x: ARTIST.x, z: ARTIST.z, r: 0.7 },
  { x: WELDER_AT.x, z: WELDER_AT.z, r: 0.45 },
  ...LAMPS.map(([x, z]) => ({ x, z, r: 0.3 })),
];

// Utility poles down the alley, with the wires looping between them.
const POLES: [number, number, number][] = [-24, -6, 12].map((z, i) => [i % 2 ? 3.2 : -3.2, 0, z]);
const WIRES: [[number, number, number], [number, number, number]][] = POLES.slice(1).flatMap((p, i) => {
  const a = POLES[i];
  return [-0.6, 0, 0.6].map((dx): [[number, number, number], [number, number, number]] => [
    [a[0] + dx, 7.4, a[2]],
    [p[0] + dx, 7.4, p[2]],
  ]);
});

/* ---------- materials painted on canvas ---------- */

const painted = new Map<string, THREE.Material>();
function stripes(color: string, kind: "shutter" | "tin") {
  const key = `${kind}|${color}`;
  let m = painted.get(key);
  if (m) return m;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  g.fillRect(0, 0, 128, 128);
  const base = new THREE.Color(color);
  for (let i = 0; i < 16; i++) {
    const k = i % 2 ? 0.82 : 1.08;
    g.fillStyle = `#${base.clone().multiplyScalar(k).getHexString()}`;
    if (kind === "shutter") g.fillRect(0, i * 8, 128, 6);
    else g.fillRect(i * 8, 0, 5, 128);
  }
  if (kind === "tin") {
    // rust streaks
    g.fillStyle = "rgba(150, 82, 45, 0.35)";
    for (let i = 0; i < 6; i++) g.fillRect((i * 37) % 128, 0, 3, 40 + ((i * 53) % 70));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  m = toonWith({ color: "#ffffff", map: tex, key: `mullae-${key}` });
  painted.set(key, m);
  return m;
}

let muralMat: THREE.Material | null = null;
/** The painted wall: big warm shapes, a gear, a wave of teal, and the neighbourhood's name. */
function mural() {
  if (muralMat) return muralMat;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2d3f52";
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#f0a23a";
  g.beginPath();
  g.arc(130, 120, 78, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#f6e3c2";
  g.lineWidth = 14;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.beginPath();
    g.moveTo(130 + Math.cos(a) * 40, 120 + Math.sin(a) * 40);
    g.lineTo(130 + Math.cos(a) * 64, 120 + Math.sin(a) * 64);
    g.stroke();
  }
  g.fillStyle = "#3fa39a";
  g.beginPath();
  g.moveTo(0, 256);
  for (let x = 0; x <= 512; x += 16) g.lineTo(x, 190 + Math.sin(x / 40) * 18);
  g.lineTo(512, 256);
  g.fill();
  g.fillStyle = "#e85d4a";
  g.fillRect(250, 40, 26, 150);
  g.fillRect(300, 80, 26, 110);
  g.fillRect(350, 60, 26, 130);
  g.fillStyle = "#f6efe2";
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  g.font = `800 64px ${font}`;
  g.fillText("문래", 400, 120);
  g.font = `700 26px ${font}`;
  g.fillText("MULLAE", 404, 160);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  muralMat = toonWith({ color: "#ffffff", map: tex, key: "mullae-mural" });
  return muralMat;
}

/* ---------- buildings ---------- */

/**
 * A Mullae workshop, built facing +z and turned to its alley: concrete or brick, a roll-up
 * shutter (up and lit inside, or down), a trade sign, a tin awning, and upstairs the studio
 * windows, warm on a rainy evening.
 */
function Workshop({ lot }: { lot: Lot }) {
  const angle = Math.atan2(lot.face.dx, lot.face.dz);
  const across = lot.face.dz !== 0; // front runs along x
  const w = across ? lot.x1 - lot.x0 : lot.z1 - lot.z0; // width of the front
  const d = across ? lot.z1 - lot.z0 : lot.x1 - lot.x0;
  const H = lot.floors * 3.3;
  const cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  const body = useMemo(() => worldBox(w, H, d), [w, H, d]);
  const r = useMemo(() => rand(lot.seed), [lot.seed]);
  const wallMat = lot.brick ? surface("brick", 1.6, "#c99a82") : surface("plaster", 2, lot.wall);
  const shutterW = Math.min(w - 0.8, 4.2);
  const glow = toonWith({ color: "#ffd9a0", emissive: "#ffb866", emissiveIntensity: 1.1, key: "mullae-window" });
  const dark = toonWith({ color: "#3b4250", emissive: "#28304a", emissiveIntensity: 0.2, key: "mullae-window-dark" });
  return (
    <group position={[cx, 0, cz]} rotation={[0, angle, 0]}>
      <mesh geometry={body} material={wallMat} position={[0, H / 2, 0]} castShadow receiveShadow userData={{ solid: true }}>
        <Ink />
      </mesh>
      {/* the parapet */}
      <mesh position={[0, H + 0.15, 0]} material={toon("#8f8a82")}>
        <boxGeometry args={[w + 0.12, 0.3, d + 0.12]} />
        <Ink />
      </mesh>
      {lot.word !== null || lot.open ? (
        <>
          {lot.open ? (
            <group position={[0, 0, d / 2]}>
              <mesh position={[0, 1.3, 0.01]} material={toonWith({ color: "#3a332c", emissive: "#4a3420", emissiveIntensity: 0.6, key: "mullae-inside" })}>
                <planeGeometry args={[shutterW, 2.6]} />
              </mesh>
              {/* the shutter, rolled up into its box */}
              <mesh position={[0, 2.75, 0.18]} material={stripes("#9aa3ad", "shutter")}>
                <boxGeometry args={[shutterW + 0.2, 0.36, 0.36]} />
                <Ink />
              </mesh>
              {/* a strip light inside and steel stock leaning on the back */}
              <mesh position={[0, 2.45, 0.03]} material={toonWith({ color: "#fff3d6", emissive: "#ffe7b0", emissiveIntensity: 1.6, key: "mullae-strip" })}>
                <boxGeometry args={[shutterW * 0.7, 0.06, 0.04]} />
              </mesh>
              {[-0.9, -0.5, 0.6, 1.1].map((x) => (
                <mesh key={x} position={[x * (shutterW / 4.2), 0.95, 0.06]} rotation={[0, 0, 0.08 * Math.sign(x)]} material={toon(x < 0 ? "#7b8189" : "#a26a42")}>
                  <boxGeometry args={[0.12, 1.9, 0.08]} />
                </mesh>
              ))}
            </group>
          ) : (
            <mesh position={[0, 1.3, d / 2 + 0.03]} material={stripes("#a7adb3", "shutter")}>
              <boxGeometry args={[shutterW, 2.6, 0.06]} />
              <Ink />
            </mesh>
          )}
          {lot.word && <Sign position={[0, 3.0, d / 2 + 0.08]} text={lot.word} color={lot.sign} />}
          {/* the tin awning over the front */}
          <mesh position={[0, 3.55, d / 2 + 0.65]} rotation={[0.22, 0, 0]} material={stripes("#8c9196", "tin")}>
            <boxGeometry args={[w * 0.95, 0.06, 1.4]} />
            <Ink />
          </mesh>
        </>
      ) : null}
      {/* studio windows upstairs: some lit, some dark */}
      {lot.floors > 1 &&
        [-1, 0, 1].slice(w > 5.8 ? 0 : 1).map((k) => (
          <mesh key={k} position={[k * (w > 5.8 ? 1.9 : 1.3) + (w > 5.8 ? 0 : -0.65), 4.9, d / 2 + 0.02]} material={r() < 0.6 ? glow : dark}>
            <planeGeometry args={[1.2, 1.3]} />
          </mesh>
        ))}
      {lot.floors > 1 && r() < 0.5 && <AcUnit position={[w / 2 - 0.5, 4.2, d / 2 + 0.25]} facing={0} />}
      {lot.floors > 1 && r() < 0.4 && <Pot position={[-w / 2 + 0.6, H + 0.3, d / 2 - 0.5]} size={0.8} />}
    </group>
  );
}

/** Steel stock left out front: bundles of pipe, stacked plate, gas bottles, a hand cart. */
function Yard({ lot, k }: { lot: Lot; k: number }) {
  if (lot.word === null && !lot.open) return null;
  const angle = Math.atan2(lot.face.dx, lot.face.dz);
  const across = lot.face.dz !== 0;
  const w = across ? lot.x1 - lot.x0 : lot.z1 - lot.z0;
  const d = across ? lot.z1 - lot.z0 : lot.x1 - lot.x0;
  const cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  const kind = k % 4;
  const x = (k % 2 ? 1 : -1) * (w / 2 - 0.45);
  return (
    <group position={[cx, LIFT, cz]} rotation={[0, angle, 0]}>
      <group position={[x, 0, d / 2 + 0.45]}>
        {kind === 0 &&
          [0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[(i % 3) * 0.13 - 0.13, 0.08 + Math.floor(i / 3) * 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon("#8d9298")}>
              <cylinderGeometry args={[0.06, 0.06, 0.8, 10]} />
            </mesh>
          ))}
        {kind === 1 &&
          [0, 1].map((i) => (
            <mesh key={i} position={[i * 0.36 - 0.18, 0.55, 0]} material={toon(i ? "#2f6aa8" : "#c8463c")} castShadow>
              <cylinderGeometry args={[0.13, 0.13, 1.1, 12]} />
              <Ink />
            </mesh>
          ))}
        {kind === 2 && (
          <mesh position={[0, 0.2, 0]} material={toon("#7a6f66")}>
            <boxGeometry args={[0.7, 0.4, 0.5]} />
            <Ink />
          </mesh>
        )}
        {kind === 3 && (
          <group>
            <mesh position={[0, 0.25, 0]} material={toon("#b05a35")}>
              <boxGeometry args={[0.6, 0.06, 0.9]} />
              <Ink />
            </mesh>
            <mesh position={[0, 0.12, -0.35]} rotation={[0, 0, Math.PI / 2]} material={toon("#2b2f38")}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

/** The gallery's inside: three framed works under their lights, hidden until the shutter goes up. */
function GalleryInside() {
  const art = ["#e85d4a", "#3fa39a", "#f0a23a"];
  return (
    <group position={[GALLERY.x0, 0, (GALLERY.z0 + GALLERY.z1) / 2]}>
      <mesh position={[-0.015, 1.3, 0]} rotation={[0, -Math.PI / 2, 0]} material={toonWith({ color: "#f1ece2", emissive: "#fff2dc", emissiveIntensity: 0.35, key: "gallery-wall" })}>
        <planeGeometry args={[4, 2.6]} />
      </mesh>
      {[-1.3, 0, 1.3].map((z, i) => (
        <mesh key={z} position={[-0.028, 1.35, z]} rotation={[0, -Math.PI / 2, 0]} material={toonWith({ color: art[i], emissive: art[i], emissiveIntensity: 0.25, key: `gallery-art-${i}` })}>
          <planeGeometry args={[0.8, 1.0]} />
        </mesh>
      ))}
      <Sign position={[-0.08, 3.0, 0]} rotation={-Math.PI / 2} text="갤러리" color="#2f3238" />
    </group>
  );
}

/** A welded steel flower: a stem of pipe, plate petals, a sphere of bolts at the heart. */
function SteelFlower() {
  return (
    <group position={[SCULPTURE.x, 0, SCULPTURE.z]}>
      <TexBox size={[2.6, 0.5, 2.6]} position={[0, 0.25, 0]} name="granite" tile={1} tint="#8f8c88" />
      <mesh position={[0, 2.5, 0]} material={toon("#6f6a64")} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 4, 12]} />
        <Ink />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.9, 4.7, Math.sin(a) * 0.9]} rotation={[0, -a, 0.75]} material={toon(i % 2 ? "#a8633a" : "#8e8a84")} castShadow>
            <boxGeometry args={[1.5, 0.06, 0.7]} />
            <Ink />
          </mesh>
        );
      })}
      <mesh position={[0, 4.6, 0]} material={toon("#c08a45")}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <Ink />
      </mesh>
      {/* two leaves of plate on the stem */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.5, 1.9 + s * 0.3, 0]} rotation={[0, 0, s * 0.6]} material={toon("#7b8189")}>
          <boxGeometry args={[0.9, 0.05, 0.4]} />
          <Ink />
        </mesh>
      ))}
    </group>
  );
}

function CafeBench() {
  return (
    <group position={[BENCH.x, LIFT, BENCH.z]}>
      <TexBox size={[2.2, 0.1, 0.55]} position={[0, 0.48, 0]} name="wood" tile={0.8} />
      <TexBox size={[0.12, 0.45, 0.5]} position={[-0.9, 0.22, 0]} name="granite" tile={0.6} tint="#8f8c88" />
      <TexBox size={[0.12, 0.45, 0.5]} position={[0.9, 0.22, 0]} name="granite" tile={0.6} tint="#8f8c88" />
    </group>
  );
}

/** Rainwater lying in the dips of the alleys, holding the warm light. */
function Puddles() {
  const items = useMemo(() => {
    const r = rand(19);
    const out: [number, number, number, number][] = [];
    for (const q of RECTS)
      for (let i = 0; i < Math.round(((q.x1 - q.x0) * (q.z1 - q.z0)) / 70); i++) {
        const x = q.x0 + 0.8 + r() * (q.x1 - q.x0 - 1.6), z = q.z0 + 0.8 + r() * (q.z1 - q.z0 - 1.6);
        if (HOLES.some((h) => Math.hypot(h.x - x, h.z - z) < h.r + 1)) continue;
        out.push([x, z, 0.35 + r() * 0.55, r() * Math.PI]);
      }
    return out;
  }, []);
  const mat = useMemo(() => toonWith({ color: "#646a75", emissive: "#8a93a8", emissiveIntensity: 0.1, key: "puddle" }), []);
  return (
    <>
      {items.map(([x, z, s, a], i) => (
        <mesh key={i} position={[x, LIFT + 0.012, z]} rotation={[-Math.PI / 2, 0, a]} scale={[s * 1.4, s, 1]} material={mat} receiveShadow>
          <circleGeometry args={[1, 18]} />
        </mesh>
      ))}
    </>
  );
}

function Scene() {
  return (
    <group>
      <Mountains radius={260} color="#59606e" />
      <CityView from={[-120, -140]} to={[120, -90]} seed={21} />
      <Boardwalk rects={[{ x0: -60, z0: -70, x1: 60, z1: 60 }]} hills={HILLS} lift={0.01} paving={{ name: "granite", tile: 3, tint: "#8a8782" }} />
      <Boardwalk rects={RECTS} hills={HILLS} lift={LIFT} paving={{ name: "granite", tile: 1.4, tint: "#a29e97" }} />
      {LOTS.map((lot, i) => (
        <Workshop key={i} lot={lot} />
      ))}
      {LOTS.map((lot, i) => (
        <Yard key={i} lot={lot} k={i} />
      ))}
      {/* the mural on the plaza's west wall */}
      <mesh position={[MURAL.x1 + 0.03, 2.6, (MURAL.z0 + MURAL.z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={mural()}>
        <planeGeometry args={[8.4, 4.2]} />
      </mesh>
      <GalleryInside />
      <SteelFlower />
      <CafeBench />
      <TexBox size={[0.42, 0.45, 0.42]} position={[ARTIST.x, LIFT + 0.225, ARTIST.z]} name="wood" tile={0.6} tint="#8a6646" />
      <Poles poles={POLES} wires={WIRES} />
      <Scooter position={[-11.2, LIFT, 24.6]} rotation={0.4} color="#c8463c" />
      <Scooter position={[11.4, LIFT, -13.8]} rotation={-1.2} color="#e8e3d8" />
      <Puddles />
    </group>
  );
}

/* ---------- live ---------- */

/** Rain: streaks falling in a box that follows the camera. */
function Rain() {
  const { low } = useContext(Quality);
  const count = low ? 260 : 650;
  const ref = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const geom = useMemo(() => new THREE.BoxGeometry(0.014, 0.55, 0.014), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#c9d3e6", transparent: true, opacity: 0.42, depthWrite: false }), []);
  const drops = useMemo(() => {
    const r = rand(3);
    return Array.from({ length: count }, () => ({ x: (r() - 0.5) * 26, y: r() * 14, z: (r() - 0.5) * 26, v: 11 + r() * 4 }));
  }, [count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const d = Math.min(dt, 0.05);
    const cx = camera.position.x, cz = camera.position.z;
    drops.forEach((p, i) => {
      p.y -= p.v * d;
      if (p.y < 0) p.y += 14;
      // wrap round the camera so the rain never runs out
      const x = cx + ((((p.x - cx) % 26) + 39) % 26) - 13;
      const z = cz + ((((p.z - cz) % 26) + 39) % 26) - 13;
      o.position.set(x, p.y, z);
      o.rotation.set(0, 0, 0.08);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

/** The welder at work: when someone stops to watch, the arc flares and sparks fly. */
function Welding() {
  const arc = useRef<THREE.Mesh>(null);
  const until = useRef(0);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#cfe6ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useEffect(() => on("use:weld", () => (until.current = performance.now() + 2800)), []);
  useFrame((state) => {
    const m = arc.current;
    if (!m) return;
    const on_ = performance.now() < until.current;
    const flicker = 0.5 + Math.abs(Math.sin(state.clock.elapsedTime * 37)) * 0.5;
    mat.opacity = on_ ? 0.85 * flicker : 0;
    m.visible = on_;
    m.scale.setScalar(0.6 + flicker * 0.6);
  });
  const at: [number, number, number] = [WELDER_AT.x + 0.5, 1.0, WELDER_AT.z - 0.2];
  return (
    <>
      <mesh ref={arc} position={at} material={mat} visible={false}>
        <sphereGeometry args={[0.35, 12, 10]} />
      </mesh>
      <Burst effect="weld" kind="spark" at={at} count={22} spread={1.4} rise={1.6} />
    </>
  );
}

/** The anvil on the square. Struck, the hammer comes down three times and sparks jump. */
function Anvil() {
  const hammer = useRef<THREE.Group>(null);
  const at = useRef(-1e9);
  useEffect(() => on("use:anvil", () => (at.current = performance.now())), []);
  useFrame(() => {
    const h = hammer.current;
    if (!h) return;
    const t = (performance.now() - at.current) / 1000;
    const k = t < 1.8 ? Math.abs(Math.sin((t / 0.6) * Math.PI)) : 0;
    h.rotation.z = -0.2 - k * 1.1;
  });
  return (
    <group position={[ANVIL.x, LIFT, ANVIL.z]}>
      <mesh position={[0, 0.3, 0]} material={toon("#5a5047")}>
        <cylinderGeometry args={[0.35, 0.45, 0.6, 14]} />
        <Ink />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={toon("#3d424c")} castShadow>
        <boxGeometry args={[0.9, 0.3, 0.36]} />
        <Ink />
      </mesh>
      <mesh position={[0.6, 0.78, 0]} rotation={[0, 0, -Math.PI / 2]} material={toon("#3d424c")}>
        <coneGeometry args={[0.15, 0.4, 10]} />
      </mesh>
      <group ref={hammer} position={[-0.55, 0.95, 0]}>
        <mesh position={[0.35, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} material={toon("#9a7652")}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        </mesh>
        <mesh position={[0.7, 0.05, 0]} material={toon("#6f747b")}>
          <boxGeometry args={[0.14, 0.24, 0.14]} />
          <Ink />
        </mesh>
      </group>
      <Burst effect="anvil" kind="spark" at={[0, 1.0, 0]} count={14} spread={0.9} rise={1.2} />
      <Burst effect="anvil" kind="note" at={[0, 1.4, 0]} count={5} spread={0.4} rise={1} />
    </group>
  );
}

/** The gallery's shutter: it rolls up for a while when someone lifts it, then comes back down. */
function GalleryShutter() {
  const ref = useRef<THREE.Mesh>(null);
  const at = useRef(-1e9);
  useEffect(() => on("use:shutter", () => (at.current = performance.now())), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = (performance.now() - at.current) / 1000;
    // up over 2 s, open 10 s, down over 2 s
    const open = t < 0 || t > 14 ? 0 : t < 2 ? t / 2 : t < 12 ? 1 : 1 - (t - 12) / 2;
    const h = 2.6 * (1 - open);
    m.scale.y = Math.max(0.02, h / 2.6);
    m.position.y = 2.6 - h / 2;
  });
  return (
    <group>
      <mesh ref={ref} position={[GALLERY.x0 - 0.04, 1.3, (GALLERY.z0 + GALLERY.z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={stripes("#b8bec4", "shutter")}>
        <boxGeometry args={[4.2, 2.6, 0.06]} />
        <Ink />
      </mesh>
      <mesh position={[GALLERY.x0 - 0.2, 2.75, (GALLERY.z0 + GALLERY.z1) / 2]} material={stripes("#9aa3ad", "shutter")}>
        <boxGeometry args={[0.36, 0.36, 4.4]} />
        <Ink />
      </mesh>
      <Burst effect="shutter" kind="spark" at={[GALLERY.x0 - 0.6, 2.2, (GALLERY.z0 + GALLERY.z1) / 2]} count={8} spread={0.6} rise={0.8} />
    </group>
  );
}

export const yeongdeungpo: RoomConfig = {
  slug: "yeongdeungpo",
  name: { en: "Yeongdeungpo", ko: "영등포" },
  place: { en: "Mullae ironworks alleys", ko: "문래 철공소 골목" },
  hour: { en: "Rainy autumn evening", ko: "비 오는 가을 저녁" },
  walk: { cell: 0.5, rects: RECTS, holes: HOLES, body: 0.28 },
  spawn: { x: 0, z: 29 },
  spawnHeading: Math.PI,
  sky: { top: "#3a4254", bottom: "#8f93a0" },
  sun: { position: [-30, 40, 20], color: "#c7cde0", intensity: 0.7 },
  ambient: { sky: "#9097ad", ground: "#4f4a46", intensity: 1.35 },
  world: { hills: HILLS, fog: ["#6f7484", 30, 170] },
  lamps: LAMPS,
  map: {
    blocks: LOTS.map((l): [number, number, number, number] => [l.x0, l.z0, l.x1, l.z1]),
  },
  pois: [
    {
      id: "mullae",
      at: { x: 0, z: 27 },
      radius: 3.5,
      title: { en: "Mullae-dong", ko: "문래동" },
      line: {
        en: "Since the 1960s Mullae has been a neighbourhood of small steel workshops. When rents fell in the 2000s, artists moved into the floors above, and the two have shared the alleys ever since.",
        ko: "문래동은 1960년대부터 작은 철공소들이 모인 동네예요. 2000년대에 임대료가 싼 2층과 3층으로 예술가들이 들어오면서, 지금은 철공소와 작업실이 골목을 함께 쓰고 있어요.",
      },
    },
    {
      id: "mural",
      at: { x: -10, z: 27 },
      radius: 2.6,
      action: "photo",
      title: { en: "The mural wall", ko: "벽화 골목" },
      line: {
        en: "Artists have painted the workshop walls all over Mullae. Stand in front of this one for a photo.",
        ko: "문래 곳곳의 공장 벽에 예술가들이 그림을 그렸어요. 이 벽 앞에서 사진을 남겨 보세요.",
      },
    },
    {
      id: "gallery",
      at: { x: 10.2, z: 27 },
      radius: 2.2,
      action: "use",
      effect: "shutter",
      gesture: "hop",
      face: { x: GALLERY.x0, z: 27 },
      actionLabel: { en: "Lift the shutter", ko: "셔터 올려 보기" },
      title: { en: "A gallery behind a shutter", ko: "셔터 뒤 작은 갤러리" },
      line: {
        en: "Some of Mullae's galleries hide behind the same roll-up shutters as the workshops. Lift this one and see what is showing.",
        ko: "문래의 어떤 갤러리는 철공소와 똑같은 셔터 뒤에 숨어 있어요. 셔터를 올리고 무엇이 걸려 있는지 보세요.",
      },
    },
    {
      id: "welder",
      at: { x: 0.6, z: -3.2 },
      radius: 2.4,
      action: "use",
      effect: "weld",
      face: WELDER_AT,
      actionLabel: { en: "Watch the welder", ko: "용접 구경하기" },
      title: { en: "A welding shop", ko: "용접 공장" },
      line: {
        en: "Most of the shops here cut, bend and weld steel to order for factories across Seoul. Stand back from the sparks.",
        ko: "이곳 공장들은 대부분 서울 곳곳의 공장에서 주문받은 철을 자르고 구부리고 용접해요. 불꽃에서 조금 떨어져서 보세요.",
      },
    },
    {
      id: "flower",
      at: { x: 0, z: -32.2 },
      radius: 3,
      title: { en: "The steel flower", ko: "강철 꽃" },
      line: {
        en: "Sculptures welded from the workshops' offcuts stand on corners all over the neighbourhood.",
        ko: "공장에서 남은 철판으로 용접한 조형물이 동네 곳곳의 모퉁이에 서 있어요.",
      },
    },
    {
      id: "anvil",
      at: { x: 5.4, z: -35.4 },
      radius: 1.8,
      action: "use",
      effect: "anvil",
      gesture: "bow",
      face: ANVIL,
      stamp: false,
      actionLabel: { en: "Strike the anvil", ko: "모루 두드리기" },
      title: { en: "An anvil", ko: "모루" },
      line: { en: "Give it a strike. Everyone on the square hears it ring.", ko: "한번 두드려 보세요. 광장의 모두에게 소리가 울려요." },
    },
    {
      id: "cafe",
      at: { x: BENCH.x, z: BENCH.z + 1.65 },
      radius: 2.2,
      action: "sit",
      actionLabel: { en: "Sit outside the café", ko: "카페 앞에 앉기" },
      seat: { x: BENCH.x, z: BENCH.z + 1.65, heading: 0, on: { x: BENCH.x, z: BENCH.z + 0.05, y: 0.53 - 0.45 } },
      title: { en: "A café upstairs from a workshop", ko: "철공소 위층 카페" },
      line: {
        en: "Cafés and bars have opened between the workshops. Sit for a while and listen to the rain on the tin awnings.",
        ko: "철공소 사이사이에 카페와 술집이 생겼어요. 잠시 앉아 함석 차양에 떨어지는 빗소리를 들어 보세요.",
      },
    },
  ],
  Scene,
  Live: () => (
    <>
      <Rain />
      <Welding />
      <Anvil />
      <GalleryShutter />
      <Neighbor avatar={{ gender: "m", outfit: "baji", colorway: 2, hair: "short", hairColor: 0, skin: 2 }} position={[WELDER_AT.x, LIFT, WELDER_AT.z]} heading={Math.PI / 2} react="weld" seed={6} />
      <Neighbor avatar={{ gender: "f", outfit: "hoodie", colorway: 1, hair: "braid", hairColor: 1, skin: 1 }} position={[ARTIST.x, LIFT + 0.26, ARTIST.z]} heading={-Math.PI / 2} pose="sit" seed={8} />
      <Neighbor avatar={{ gender: "f", outfit: "dress", colorway: 0, hair: "bob", hairColor: 2, skin: 0 }} position={[-5.6, LIFT, -40.5]} heading={0.3} react="anvil" seed={9} />
    </>
  ),
};
