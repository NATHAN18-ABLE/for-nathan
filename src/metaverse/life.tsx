"use client";

// Small things that make a place feel lived in, shared by the rooms: grass and wildflowers along
// the paths, rocks, neighbours going about their day, and the little burst (hearts, notes, sparks,
// drops) that answers when a traveler uses something in the room.

import { useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Quality, heightAt, rand, type Hill } from "./world";
import { toon, toonVertex, toonWith } from "./toon/material";
import { Ink } from "./toon/part";
import { ToonFigure, type Action } from "./toon/ToonFigure";
import { paletteOf, type Avatar } from "@/lib/metaverse/outfit.ts";
import { on } from "./bus";

type Spot = { x: number; z: number; r: number; n: number };

/** Points scattered in round patches, the same every visit. */
function scatter(spots: Spot[], seed: number, low: boolean) {
  const r = rand(seed);
  return spots.flatMap((s) =>
    Array.from({ length: low ? Math.ceil(s.n / 2) : s.n }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * s.r;
      return { x: s.x + Math.cos(a) * d, z: s.z + Math.sin(a) * d, rot: r() * Math.PI * 2, s: 0.7 + r() * 0.6, k: r() };
    }),
  );
}

/** A tuft of grass: a few bent blades, darker at the root, as one small mesh. */
function tuftGeometry() {
  const blades: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + i * 0.4;
    const h = 0.32 + (i % 3) * 0.08;
    const g = new THREE.ConeGeometry(0.045, h, 3, 1, true).translate(0, h / 2, 0);
    g.rotateZ(0.32 + (i % 2) * 0.18).rotateY(a).translate(Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05);
    blades.push(g);
  }
  const g = mergeGeometries(blades)!;
  blades.forEach((b) => b.dispose());
  // vertex colour: dark at the root, light at the tip
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const lo = new THREE.Color("#5f7f3c"), hi = new THREE.Color("#b5c76a"), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(lo).lerp(hi, Math.min(1, pos.getY(i) / 0.42));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/** Grass tufts in patches (instanced: hundreds cost one draw). */
export function Tufts({ spots, hills = [], seed = 21 }: { spots: Spot[]; hills?: Hill[]; seed?: number }) {
  const { low } = useContext(Quality);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(tuftGeometry, []);
  const mat = toonVertex();
  const items = useMemo(() => scatter(spots, seed, low), [spots, seed, low]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    items.forEach((t, i) => {
      o.position.set(t.x, heightAt(t.x, t.z, hills), t.z);
      o.rotation.set(0, t.rot, 0);
      o.scale.setScalar(t.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, hills]);
  return <instancedMesh ref={ref} args={[geom, mat, items.length]} receiveShadow />;
}

const FLOWER_COLORS: Record<string, string[]> = {
  cosmos: ["#f4a6c0", "#fbe7ef", "#e06a98", "#f7c6d6"],
  aster: ["#a89ad8", "#c8bff0", "#f4f1fb"],
  chrysanthemum: ["#f2c64a", "#f7dd7a", "#f4f1e8"],
};

/** Autumn wildflowers: a thin stem and a flat flower head, coloured per flower. */
export function Flowers({ spots, hills = [], seed = 31, kind = "cosmos" }: { spots: Spot[]; hills?: Hill[]; seed?: number; kind?: keyof typeof FLOWER_COLORS }) {
  const { low } = useContext(Quality);
  const heads = useRef<THREE.InstancedMesh>(null);
  const stems = useRef<THREE.InstancedMesh>(null);
  const headGeom = useMemo(() => new THREE.CylinderGeometry(0.11, 0.04, 0.04, 8), []);
  const stemGeom = useMemo(() => new THREE.CylinderGeometry(0.012, 0.016, 1, 4).translate(0, 0.5, 0), []);
  const headMat = useMemo(() => toonWith({ color: "#ffffff", key: "flower-head" }), []);
  const stemMat = useMemo(() => toon("#6f8c45"), []);
  const items = useMemo(() => scatter(spots, seed, low), [spots, seed, low]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const colors = FLOWER_COLORS[kind];
    items.forEach((f, i) => {
      const y = heightAt(f.x, f.z, hills);
      const h = 0.45 + f.s * 0.35;
      o.position.set(f.x, y, f.z);
      o.rotation.set(Math.sin(f.rot) * 0.15, 0, Math.cos(f.rot) * 0.15);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      stems.current?.setMatrixAt(i, o.matrix);
      o.position.set(f.x + Math.cos(f.rot) * 0.15 * h * 0.15, y + h, f.z - Math.sin(f.rot) * 0.15 * h * 0.15);
      o.rotation.set(Math.sin(f.rot) * 0.4, 0, Math.cos(f.rot) * 0.4);
      o.scale.setScalar(0.8 + f.k * 0.5);
      o.updateMatrix();
      heads.current?.setMatrixAt(i, o.matrix);
      heads.current?.setColorAt(i, c.set(colors[Math.floor(f.k * colors.length)]));
    });
    for (const m of [heads.current, stems.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [items, hills, kind]);
  return (
    <>
      <instancedMesh ref={stems} args={[stemGeom, stemMat, items.length]} />
      <instancedMesh ref={heads} args={[headGeom, headMat, items.length]} />
    </>
  );
}

/** Granite boulders, half sunk into the slope. */
export function Rocks({ rocks, hills = [], color = "#b9b2a6", seed = 41 }: { rocks: [number, number, number][]; hills?: Hill[]; color?: string; seed?: number }) {
  const geos = useMemo(() => {
    const r = rand(seed);
    return rocks.map(([, , s]) => {
      const g = new THREE.IcosahedronGeometry(s, 1);
      const p = g.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        const k = 0.78 + r() * 0.4;
        p.setXYZ(i, p.getX(i) * k * 1.25, p.getY(i) * k * 0.7, p.getZ(i) * k);
      }
      g.computeVertexNormals();
      return g;
    });
  }, [rocks, seed]);
  return (
    <>
      {rocks.map(([x, z, s], i) => (
        <mesh key={i} geometry={geos[i]} position={[x, heightAt(x, z, hills) + s * 0.18, z]} rotation={[0, i * 1.7, 0]} material={toon(color)} castShadow receiveShadow userData={{ solid: true }}>
          <Ink />
        </mesh>
      ))}
    </>
  );
}

type BurstKind = "heart" | "note" | "spark" | "drop" | "leaf";
const BURST_COLORS: Record<BurstKind, string[]> = {
  heart: ["#f06a8a", "#ff9db4", "#e84a6a"],
  note: ["#4d5fd1", "#2f9b7a", "#e0782f"],
  spark: ["#ffe08a", "#fff4c8", "#ffc24a"],
  drop: ["#8cc8f0", "#bfe3fa", "#5fb0e6"],
  leaf: ["#d24a2a", "#e9a73a", "#c93b30"],
};

function burstGeometry(kind: BurstKind) {
  if (kind === "heart") {
    const s = new THREE.Shape();
    s.moveTo(0, -0.1);
    s.bezierCurveTo(-0.16, 0.02, -0.1, 0.13, 0, 0.06);
    s.bezierCurveTo(0.1, 0.13, 0.16, 0.02, 0, -0.1);
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false }).translate(0, 0, -0.02);
  }
  if (kind === "note") {
    const head = new THREE.SphereGeometry(0.06, 10, 8).scale(1.2, 0.85, 0.7);
    const stem = new THREE.BoxGeometry(0.018, 0.2, 0.018).translate(0.06, 0.1, 0);
    const flag = new THREE.BoxGeometry(0.08, 0.03, 0.018).translate(0.095, 0.19, 0).rotateZ(-0.2);
    const g = mergeGeometries([head.toNonIndexed(), stem.toNonIndexed(), flag.toNonIndexed()])!;
    return g;
  }
  if (kind === "spark") return new THREE.OctahedronGeometry(0.08, 0);
  if (kind === "drop") return new THREE.SphereGeometry(0.06, 10, 8).scale(0.8, 1.2, 0.8);
  const s = new THREE.Shape();
  s.moveTo(0, -0.07);
  s.quadraticCurveTo(0.07, 0, 0, 0.08);
  s.quadraticCurveTo(-0.07, 0, 0, -0.07);
  return new THREE.ShapeGeometry(s);
}

/**
 * The answer to a traveler using something: when the room's effect fires, a handful of hearts,
 * notes, sparks or drops pop out at `at` and float up and away. Everyone sees it (the effect is
 * shared), so a pressed button reads from across the room.
 */
export function Burst({ effect, at, kind = "spark", count = 10, spread = 0.6, rise = 1.4 }: { effect: string; at: [number, number, number]; kind?: BurstKind; count?: number; spread?: number; rise?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => burstGeometry(kind), [kind]);
  const mat = useMemo(() => toonWith({ color: "#ffffff", side: THREE.DoubleSide, emissive: "#ffffff", emissiveIntensity: 0.25, key: `burst-${kind}` }), [kind]);
  const parts = useMemo(() => Array.from({ length: count }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 })), [count]);
  useEffect(
    () =>
      on(`use:${effect}`, () => {
        parts.forEach((p, i) => {
          const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
          Object.assign(p, { life: 1.6 + Math.random() * 0.6, x: 0, y: 0, z: 0, vx: Math.cos(a) * spread, vz: Math.sin(a) * spread, vy: rise * (0.7 + Math.random() * 0.6), spin: (Math.random() - 0.5) * 6 });
        });
      }),
    [effect, parts, count, spread, rise],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    const colors = BURST_COLORS[kind];
    for (let i = 0; i < count; i++) m.setColorAt(i, c.set(colors[i % colors.length]));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [kind, count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    const d = Math.min(dt, 0.05);
    let any = false;
    parts.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= d;
        p.x += p.vx * d;
        p.z += p.vz * d;
        p.y += p.vy * d;
        p.vy *= 0.985;
        p.vx *= 0.96;
        p.vz *= 0.96;
        any = true;
      }
      const s = p.life > 0 ? Math.min(1, p.life / 0.5) * Math.min(1, (2.2 - p.life) * 6) : 0;
      o.position.set(at[0] + p.x, at[1] + p.y, at[2] + p.z);
      o.rotation.set(0, state.clock.elapsedTime * p.spin, 0);
      o.scale.setScalar(Math.max(0.0001, s));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.visible = any;
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} visible={false} />;
}

/**
 * A neighbour who lives here: a figure in the same style as the travelers, standing, sitting or
 * waving in place. `react` names a room effect that makes them wave back for a moment.
 */
export function Neighbor({ avatar, position, heading = 0, pose = "idle", react, seed = 0 }: { avatar: Avatar; position: [number, number, number]; heading?: number; pose?: Action; react?: string; seed?: number }) {
  const action = useRef<Action>(pose);
  useEffect(() => {
    if (!react) return;
    let t = 0;
    const off = on(`use:${react}`, () => {
      action.current = "wave";
      clearTimeout(t);
      t = window.setTimeout(() => (action.current = pose), 2200);
    });
    return () => (off(), clearTimeout(t));
  }, [react, pose]);
  return (
    <group position={position} rotation={[0, heading, 0]}>
      <ToonFigure scale={1.35} outfit={avatar.outfit} hair={avatar.hair} palette={paletteOf(avatar)} lashes={avatar.gender === "f"} actionRef={action} seed={seed} />
    </group>
  );
}
