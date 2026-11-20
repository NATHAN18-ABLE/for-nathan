"use client";

// Building blocks for the neighbourhood rooms, drawn in the same soft toon style as the
// travelers: flat colours, a light painted pattern (roof tiles, paving joints, wall stones)
// and an ink outline on the main shapes. Everything is made in code; nothing is downloaded.

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toon, toonWith, toonGlow } from "./toon/material";
import { Ink } from "./toon/part";

type V3 = [number, number, number];

export function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- surfaces ---------- */

const TEX = ["roof", "granite", "stonewall", "plaster", "wood", "ground", "grass"] as const;
export type TexName = (typeof TEX)[number];

// Base colours: an autumn afternoon, softened.
const BASE: Record<TexName, string> = {
  roof: "#6f7886",
  granite: "#e6dfd2",
  stonewall: "#ddd3c3",
  plaster: "#f7f1e5",
  wood: "#b8865a",
  ground: "#dfcaa6",
  grass: "#b2c77f",
};

/**
 * One tile of a surface's pattern, painted as light and shade around white, so the material's
 * colour shows through: tile rows on roofs, joints between paving slabs, stones in a wall.
 */
function paintPattern(name: TexName): HTMLCanvasElement | null {
  if (name === "plaster") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = rand(name.length * 31);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  if (name === "roof") {
    // Four columns of round tiles per tile width, each with a lit crest and a shaded gap.
    for (let i = 0; i < 4; i++) {
      const x = i * 64;
      const grad = g.createLinearGradient(x, 0, x + 64, 0);
      grad.addColorStop(0, "#b9bec8");
      grad.addColorStop(0.18, "#e9ecf0");
      grad.addColorStop(0.5, "#ffffff");
      grad.addColorStop(0.82, "#e3e6ec");
      grad.addColorStop(1, "#b9bec8");
      g.fillStyle = grad;
      g.fillRect(x, 0, 64, 256);
    }
    g.fillStyle = "rgba(120,128,140,0.35)";
    for (let j = 0; j < 4; j++) g.fillRect(0, j * 64, 256, 3);
  } else if (name === "granite") {
    // Slabs in a running bond.
    g.fillStyle = "#d9d3c7";
    for (let j = 0; j < 2; j++) {
      g.fillRect(0, j * 128, 256, 4);
      const off = j % 2 ? 64 : 0;
      for (let i = 0; i < 3; i++) g.fillRect(((off + i * 128) % 256) - 2, j * 128, 4, 128);
    }
  } else if (name === "stonewall") {
    // Rounded stones in rows, set in pale mortar.
    g.fillStyle = "#cfc6b8";
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 42) {
      let x = -((y / 42) % 2) * 30;
      while (x < 256) {
        const w = 44 + r() * 40;
        const shade = 236 + Math.floor(r() * 19);
        g.fillStyle = `rgb(${shade},${shade - 2},${shade - 6})`;
        g.beginPath();
        g.roundRect(x + 3, y + 3, w - 6, 36, 12);
        g.fill();
        if (x + w > 256) {
          g.beginPath();
          g.roundRect(x + 3 - 256, y + 3, w - 6, 36, 12);
          g.fill();
        }
        x += w;
      }
    }
  } else if (name === "wood") {
    g.strokeStyle = "rgba(120,80,50,0.12)";
    g.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const y = r() * 256;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(80, y + (r() - 0.5) * 20, 170, y + (r() - 0.5) * 20, 256, y);
      g.stroke();
    }
  } else {
    // grass and earth: soft blotches so a large field is not one flat sheet
    for (let i = 0; i < 26; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(0,0,0,0.045)" : "rgba(255,255,255,0.5)";
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 10 + r() * 26, 6 + r() * 16, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  return c;
}

const patterns = new Map<TexName, HTMLCanvasElement | null>();
const surfaces = new Map<string, THREE.MeshToonMaterial>();

/** A surface material; `metresPerTile` is how far one tile of its pattern stretches. */
export function useSurface(name: TexName, metresPerTile: number, tint = "#ffffff", _gain = 1) {
  return useMemo(() => surface(name, metresPerTile, tint), [name, metresPerTile, tint]);
}

export function surface(name: TexName, metresPerTile: number, tint = "#ffffff") {
  const key = `${name}|${metresPerTile}|${tint}`;
  let m = surfaces.get(key);
  if (m) return m;
  if (!patterns.has(name)) patterns.set(name, paintPattern(name));
  const canvas = patterns.get(name)!;
  let map: THREE.Texture | undefined;
  if (canvas) {
    map = new THREE.CanvasTexture(canvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1 / metresPerTile, 1 / metresPerTile);
    map.anisotropy = 4;
    map.colorSpace = THREE.SRGBColorSpace;
  }
  const color = `#${new THREE.Color(BASE[name]).multiply(new THREE.Color(tint)).getHexString()}`;
  m = toonWith({ color, map, key: `surface|${key}` });
  surfaces.set(key, m);
  return m;
}

/** Box with UVs in metres, so textures keep their scale on any size. */
export function worldBox(w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const pos = g.attributes.position;
  const nrm = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
    if (ny > 0.5) uv.setXY(i, x, z);
    else if (nx > 0.5) uv.setXY(i, z, y);
    else uv.setXY(i, x, y);
  }
  return g;
}

export function TexBox({ size, position, rotation = 0, name, tile, tint, gain, cast = true, line = true }: { size: V3; position: V3; rotation?: number; name: TexName; tile: number; tint?: string; gain?: number; cast?: boolean; line?: boolean }) {
  const mat = useSurface(name, tile, tint, gain);
  const geom = useMemo(() => worldBox(...size), [size[0], size[1], size[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh geometry={geom} material={mat} position={position} rotation={[0, rotation, 0]} castShadow={cast} receiveShadow userData={{ solid: true }}>
      {line && <Ink />}
    </mesh>
  );
}

/* ---------- terrain ---------- */

export interface Hill {
  x: number;
  z: number;
  r: number;
  h: number;
}

/** Ground height at a point: flat town with smooth hills. Avatars stand on this. */
export function heightAt(x: number, z: number, hills: Hill[]) {
  let y = 0;
  for (const h of hills) {
    const d = Math.hypot(x - h.x, z - h.z) / h.r;
    if (d < 1) y += h.h * (0.5 + 0.5 * Math.cos(Math.PI * d));
  }
  return y;
}

export function Terrain({ size, hills, name = "grass", tile = 6 }: { size: [number, number]; hills: Hill[]; name?: TexName; tile?: number }) {
  const mat = useSurface(name, tile);
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(size[0], size[1], Math.round(size[0] / 1.5), Math.round(size[1] / 1.5));
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, heightAt(x, z, hills) - 0.02);
      uv.setXY(i, x, z);
    }
    g.computeVertexNormals();
    return g;
  }, [size, hills]);
  return <mesh geometry={geom} material={mat} receiveShadow />;
}

/** A flat paved area laid on the ground. */
export function Pavement({ from, to, name = "granite", tile = 2.4, y = 0.01, gain = 1 }: { from: [number, number]; to: [number, number]; name?: TexName; tile?: number; y?: number; gain?: number }) {
  const w = to[0] - from[0];
  const d = to[1] - from[1];
  const mat = useSurface(name, tile, "#ffffff", gain);
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    g.translate(from[0] + w / 2, y, from[1] + d / 2);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    return g;
  }, [from, to, w, d, y]);
  return <mesh geometry={geom} material={mat} receiveShadow />;
}

/* ---------- hanok ---------- */

/**
 * A gabled hanok roof (matbae): two curved slopes that sag gently toward the eaves,
 * with corners that lift. Length runs along x. UVs are in metres for the tile texture.
 */
export function gableRoofGeometry(length: number, depth: number, height: number, lift = 0.45, sag = 0.18) {
  const nu = 24;
  const nv = 10;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  for (const side of [1, -1]) {
    const base = positions.length / 3;
    for (let j = 0; j <= nv; j++) {
      const v = j / nv; // 0 eave .. 1 ridge
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const edge = Math.pow(Math.abs(u * 2 - 1), 3);
        const x = (u - 0.5) * length * (1 + 0.04 * (1 - v));
        const z = side * (depth / 2) * (1 - v);
        const y = height * v - sag * Math.sin(Math.PI * v) + lift * edge * (1 - v) * (1 - v);
        positions.push(x, y, z);
        // distance along the slope for the tile rows
        uvs.push(x, Math.hypot(depth / 2, height) * v);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i;
        const b = a + 1;
        const c = a + nu + 1;
        const d = c + 1;
        // Wind so the outer (upper) face points up and away from the ridge.
        if (side > 0) index.push(a, b, c, b, d, c);
        else index.push(a, c, b, b, c, d);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

export function GableRoof({ length, depth, height, position = [0, 0, 0], lift, sag }: { length: number; depth: number; height: number; position?: V3; lift?: number; sag?: number }) {
  const mat = useSurface("roof", 1.4);
  const under = useSurface("wood", 1.5, "#d8c6b2");
  const top = useMemo(() => gableRoofGeometry(length, depth, height, lift, sag), [length, depth, height, lift, sag]);
  const bottom = useMemo(() => {
    const g = gableRoofGeometry(length, depth, height, lift, sag);
    g.translate(0, -0.12, 0);
    g.index && g.setIndex(Array.from(g.index.array).reverse());
    g.computeVertexNormals();
    return g;
  }, [length, depth, height, lift, sag]);
  const ridge = useSurface("plaster", 2, "#f2efe9");
  return (
    <group position={position}>
      <mesh geometry={top} material={mat} castShadow receiveShadow>
        <Ink />
      </mesh>
      <mesh geometry={bottom} material={under} />
      {/* ridge: a white-banded tile ridge */}
      <mesh position={[0, height + 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={toon("#545c69")}>
        <cylinderGeometry args={[0.16, 0.16, length * 0.98, 12]} />
        <Ink />
      </mesh>
      <mesh position={[0, height - 0.12, 0]} material={ridge}>
        <boxGeometry args={[length * 0.96, 0.16, 0.36]} />
      </mesh>
    </group>
  );
}

/** A hanok shopfront facing +z: stone base, wooden posts, plaster walls, lattice doors. */
export function Hanok({ position, rotation = 0, width = 9, depth = 6, glow = 0.35, seed = 1 }: { position: V3; rotation?: number; width?: number; depth?: number; glow?: number; seed?: number }) {
  const wallH = 2.6;
  const bays = Math.max(2, Math.round(width / 2.6));
  const bayW = width / bays;
  const r = useMemo(() => rand(seed), [seed]);
  const lit = useMemo(() => Array.from({ length: bays }, () => r() > 0.45), [bays, r]);
  const wood = useSurface("wood", 1.2);
  const plaster = useSurface("plaster", 2.5);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <TexBox size={[width + 0.6, 0.6, depth + 0.6]} position={[0, 0.3, 0]} name="granite" tile={1.2} tint="#d8d4cc" />
      {/* walls */}
      <mesh position={[0, 0.6 + wallH / 2, -0.2]} material={plaster} castShadow receiveShadow userData={{ solid: true }} geometry={useMemo(() => worldBox(width - 0.3, wallH, depth - 0.8), [width, depth])}>
        <Ink />
      </mesh>
      {/* a stone footing around the walls, and a small window on each side */}
      <TexBox size={[width - 0.22, 0.85, depth - 0.72]} position={[0, 0.6 + 0.425, -0.2]} name="stonewall" tile={1.3} tint="#ece5d9" />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * ((width - 0.3) / 2 + 0.03), 0.6 + 1.2, -0.2]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <LatticeDoor position={[0, 0, 0]} width={0.95} height={0.8} glow={glow * 0.6} />
        </group>
      ))}
      {/* posts and beam */}
      {Array.from({ length: bays + 1 }, (_, i) => (
        <mesh key={i} position={[-width / 2 + i * bayW, 0.6 + wallH / 2, depth / 2 - 0.35]} material={wood} castShadow>
          <cylinderGeometry args={[0.17, 0.19, wallH, 12]} />
          <Ink />
        </mesh>
      ))}
      <mesh position={[0, 0.6 + wallH + 0.12, depth / 2 - 0.35]} material={wood} castShadow>
        <boxGeometry args={[width + 0.3, 0.3, 0.32]} />
        <Ink />
      </mesh>
      {/* bays: lattice doors, some lit from inside */}
      {Array.from({ length: bays }, (_, i) => (
        <LatticeDoor key={i} position={[-width / 2 + bayW * (i + 0.5), 0.6, depth / 2 - 0.42]} width={bayW - 0.42} height={wallH - 0.25} glow={lit[i] ? glow : 0.04} />
      ))}
      <GableRoof length={width + 2.2} depth={depth + 2.4} height={1.9} position={[0, 0.6 + wallH + 0.2, -0.1]} />
    </group>
  );
}

function LatticeDoor({ position, width, height, glow }: { position: V3; width: number; height: number; glow: number }) {
  const bars = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const nx = Math.max(3, Math.round(width / 0.28));
    const ny = Math.max(4, Math.round(height / 0.28));
    for (let i = 0; i <= nx; i++) parts.push(new THREE.BoxGeometry(0.04, height, 0.05).translate(-width / 2 + (width / nx) * i, height / 2, 0.03));
    for (let j = 0; j <= ny; j++) parts.push(new THREE.BoxGeometry(width, 0.04, 0.05).translate(0, (height / ny) * j, 0.03));
    return mergeBoxes(parts);
  }, [width, height]);
  return (
    <group position={position}>
      {/* hanji paper, warm where a lamp is lit inside */}
      <mesh position={[0, height / 2, 0]} material={toonWith({ color: "#fbf3e2", emissive: "#ffc983", emissiveIntensity: Math.round(glow * 10) / 10 })}>
        <boxGeometry args={[width, height, 0.03]} />
      </mesh>
      <mesh geometry={bars} material={toon("#8a6240")} />
    </group>
  );
}

function mergeBoxes(parts: THREE.BufferGeometry[]) {
  // Small local merge to avoid pulling in the examples bundle twice.
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const p of parts) {
    const g = p.index ? p : p;
    const a = g.attributes.position.array;
    const n = g.attributes.normal.array;
    for (let i = 0; i < a.length; i++) pos.push(a[i]);
    for (let i = 0; i < n.length; i++) nrm.push(n[i]);
    const ix = g.index!.array;
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
    off += a.length / 3;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  out.setIndex(idx);
  return out;
}

/** A stone wall with a small tiled cap (the Jongmyo wall). Runs along z. */
export function TiledWall({ from, length, height = 3.2, thick = 0.9 }: { from: V3; length: number; height?: number; thick?: number }) {
  return (
    <group position={from}>
      <TexBox size={[thick, height, length]} position={[0, height / 2, length / 2]} name="stonewall" tile={2.2} tint="#e4ddd0" />
      <group position={[0, height, length / 2]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof length={length + 0.4} depth={thick + 1.1} height={0.55} lift={0.05} sag={0.04} />
      </group>
    </group>
  );
}

/* ---------- trees ---------- */

export interface TreeSpot {
  x: number;
  z: number;
  s: number;
  kind?: "green" | "ginkgo" | "pine" | "persimmon" | "maple";
}

const TREE_COLORS = {
  green: ["#8a9a52", "#9aa65a", "#7d8f4c"], // late-autumn green, already turning
  ginkgo: ["#e2b53c", "#ecc650", "#d6a632"],
  pine: ["#3f6b4a", "#4d7a55", "#365e40"],
  persimmon: ["#b8823c", "#c9933f", "#a8742f"],
  maple: ["#c8402a", "#dc5a2c", "#b33326", "#e27a34"],
};

/** Many trees in four draw calls: trunks and three layers of soft canopy. */
export function Forest({ trees, hills = [], seed = 1 }: { trees: TreeSpot[]; hills?: Hill[]; seed?: number }) {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const crownGeo = useMemo(() => {
    // Weld the sphere first, then push vertices in and out smoothly, so the crown stays
    // one soft mass instead of splitting into loose triangles.
    const g = mergeVertices(new THREE.IcosahedronGeometry(1, 2).deleteAttribute("normal").deleteAttribute("uv"));
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const bump = 1 + 0.05 * Math.sin(v.x * 4 + seed) * Math.cos(v.z * 3.6) + 0.035 * Math.sin(v.y * 5.3 + seed * 2);
      p.setXYZ(i, v.x * bump, v.y * bump * 0.86, v.z * bump);
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  const blobs = useMemo(() => {
    const r = rand(seed + 3);
    return trees.flatMap((t) => {
      const base = heightAt(t.x, t.z, hills);
      const n = t.kind === "pine" ? 3 : 4;
      return Array.from({ length: n }, (_, i) => {
        const pine = t.kind === "pine";
        const y = base + t.s * (pine ? 2.6 + i * 1.1 : 3.1 + r() * 1.2);
        const spread = pine ? 0.25 : 1.1;
        const size = t.s * (pine ? 1.7 - i * 0.35 : 1.35 + r() * 0.5);
        const pal = TREE_COLORS[t.kind ?? "green"];
        return { x: t.x + (r() - 0.5) * spread * t.s, y, z: t.z + (r() - 0.5) * spread * t.s, size, color: pal[Math.floor(r() * pal.length)] };
      });
    });
  }, [trees, hills, seed]);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    if (trunk.current) {
      trees.forEach((t, i) => {
        const base = heightAt(t.x, t.z, hills);
        o.position.set(t.x, base + t.s * 1.6, t.z);
        o.scale.set(t.s, t.s * 3.2, t.s);
        o.rotation.set(0, 0, 0);
        o.updateMatrix();
        trunk.current!.setMatrixAt(i, o.matrix);
      });
      trunk.current.instanceMatrix.needsUpdate = true;
    }
    if (crown.current) {
      blobs.forEach((b, i) => {
        o.position.set(b.x, b.y, b.z);
        o.scale.setScalar(b.size);
        o.rotation.set(0, i, 0);
        o.updateMatrix();
        crown.current!.setMatrixAt(i, o.matrix);
        crown.current!.setColorAt(i, c.set(b.color));
      });
      crown.current.instanceMatrix.needsUpdate = true;
      if (crown.current.instanceColor) crown.current.instanceColor.needsUpdate = true;
    }
  }, [trees, blobs, hills]);

  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]} castShadow material={toon("#7d5a3e")}>
        <cylinderGeometry args={[0.12, 0.2, 1, 10]} />
        <Ink />
      </instancedMesh>
      {/* solid: the camera stops in front of a crown instead of hiding the traveler behind it */}
      <instancedMesh ref={crown} args={[crownGeo, undefined, blobs.length]} castShadow material={toonWith({ color: "#ffffff", key: "tree-crown" })} userData={{ solid: true }}>
        <Ink />
      </instancedMesh>
    </group>
  );
}

/** Distant ridgelines, softened by fog. */
export function Mountains({ seed = 7, radius = 170 }: { seed?: number; radius?: number }) {
  const geom = useMemo(() => {
    const r = rand(seed);
    const g = new THREE.CylinderGeometry(radius, radius, 1, 160, 6, true);
    const p = g.attributes.position;
    const peaks = Array.from({ length: 9 }, () => ({ a: r() * Math.PI * 2, h: 18 + r() * 34, w: 0.25 + r() * 0.35 }));
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x);
      let h = 6;
      for (const k of peaks) {
        const d = Math.atan2(Math.sin(a - k.a), Math.cos(a - k.a)) / k.w;
        h += k.h * Math.exp(-d * d);
      }
      h += Math.sin(a * 23) * 1.5 + Math.sin(a * 57) * 0.8;
      p.setY(i, y > 0 ? h : -2);
    }
    g.computeVertexNormals();
    return g;
  }, [seed, radius]);
  return (
    <mesh geometry={geom}>
      {/* Pale, like distant hills in a picture book; kept out of the fog so they stay hills. */}
      <primitive object={toonWith({ color: "#a9bd94", side: THREE.BackSide, fog: false })} attach="material" />
    </mesh>
  );
}

/** A street lamp with a paper shade. Travelers light it; it fades on as it warms up. */
export function LampPost({ position, lit, hills = [] }: { position: [number, number]; lit: boolean; hills?: Hill[] }) {
  const shade = useMemo(() => toonGlow("#fff6e6", "#ffb866", 0.08), []);
  const glow = useRef(lit ? 1 : 0);
  useFrame((_, dt) => {
    glow.current += ((lit ? 1 : 0) - glow.current) * (1 - Math.exp(-dt * 2.5));
    shade.emissiveIntensity = 0.08 + glow.current * 2.6;
  });
  const y = heightAt(position[0], position[1], hills);
  return (
    <group position={[position[0], y, position[1]]}>
      <mesh position={[0, 1.4, 0]} castShadow material={toon("#3d424c")}>
        <cylinderGeometry args={[0.07, 0.09, 2.8, 10]} />
        <Ink />
      </mesh>
      <mesh position={[0, 2.95, 0]} material={shade}>
        <boxGeometry args={[0.42, 0.5, 0.42]} />
        <Ink />
      </mesh>
      <mesh position={[0, 3.3, 0]} material={toon("#3d424c")}>
        <coneGeometry args={[0.36, 0.22, 4]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** Onggi jars on a low stone terrace (jangdokdae): glazed, dark brown, a few sizes. */
export function JarTerrace({ position, rotation = 0, seed = 2 }: { position: [number, number, number]; rotation?: number; seed?: number }) {
  const jar = useMemo(() => {
    const pts = [
      [0.0, 0],
      [0.26, 0.02],
      [0.36, 0.18],
      [0.42, 0.38],
      [0.4, 0.55],
      [0.3, 0.66],
      [0.22, 0.68],
      [0.22, 0.72],
      [0.0, 0.72],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  const lid = useMemo(() => new THREE.SphereGeometry(0.24, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), []);
  const jars = useMemo(() => {
    const r = rand(seed);
    const out: { x: number; z: number; s: number }[] = [];
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < 4 - row; i++) out.push({ x: -1.2 + i * 0.85 + row * 0.42, z: row * -0.8, s: 0.75 + r() * 0.45 + row * 0.15 });
    return out;
  }, [seed]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <TexBox size={[3.6, 0.32, 2.1]} position={[0, 0.16, -0.4]} name="granite" tile={1.2} />
      {jars.map((j, i) => (
        <group key={i} position={[j.x, 0.32, j.z]} scale={j.s}>
          <mesh geometry={jar} castShadow material={toon("#7a4630")}>
            <Ink />
          </mesh>
          <mesh geometry={lid} position={[0, 0.69, 0]} castShadow material={toon("#64382a")}>
            <Ink />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- sky ---------- */

/** A painted sky: a soft vertical gradient and a ring of round clouds drifting very slowly. */
export function ToonSky({ top, horizon }: { top: string; horizon: string }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color(top) }, horizon: { value: new THREE.Color(horizon) } },
        vertexShader: "varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader:
          "uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main() { float k = smoothstep(-0.05, 0.55, vDir.y); gl_FragColor = vec4(mix(horizon, top, k), 1.0); }",
      }),
    [top, horizon],
  );
  const clouds = useMemo(() => {
    const r = rand(21);
    return Array.from({ length: 14 }, () => {
      const a = r() * Math.PI * 2;
      const d = 150 + r() * 50;
      return { x: Math.cos(a) * d, y: 38 + r() * 34, z: Math.sin(a) * d, s: 7 + r() * 7, puffs: Array.from({ length: 4 }, (_, i) => ({ x: (i - 1.5) * 1.1 + (r() - 0.5) * 0.6, y: (r() - 0.3) * 0.7, s: 0.8 + r() * 0.6 })) };
    });
  }, []);
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.y += Math.min(dt, 0.05) * 0.004;
  });
  const cloudMat = useMemo(() => toonWith({ color: "#fffaf1", fog: false, key: "cloud" }), []);
  return (
    <group>
      <mesh material={material} renderOrder={-1}>
        <sphereGeometry args={[320, 32, 16]} />
      </mesh>
      <group ref={ring}>
        {clouds.map((c, i) => (
          <group key={i} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.62, c.s]} rotation={[0, -Math.atan2(c.z, c.x), 0]}>
            {c.puffs.map((p, j) => (
              <mesh key={j} position={[0, p.y, p.x]} scale={p.s} material={cloudMat}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
