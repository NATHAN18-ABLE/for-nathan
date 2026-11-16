"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLAZE, glaze } from "./glaze";

type V3 = [number, number, number];

// Deterministic jitter so the same room looks the same for everyone.
function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The porcelain tray the room sits on. */
export function Base({ size, position = [0, 0, 0] }: { size: [number, number]; position?: V3 }) {
  return (
    <group position={position}>
      <RoundedBox args={[size[0], 0.8, size[1]]} radius={0.35} smoothness={4} position={[0, -0.4, 0]} receiveShadow material={glaze(GLAZE.white, { gloss: 0.8 })} />
    </group>
  );
}

/** Large paving slabs in slightly varied tones, laid in running bond. */
export function Paving({ from, to, color = GLAZE.paving, slab = 1.2, seed = 5 }: { from: [number, number]; to: [number, number]; color?: string; slab?: number; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const slabs = useMemo(() => {
    const r = rand(seed);
    const out: { x: number; z: number; w: number; d: number; tone: number }[] = [];
    const d = slab * 0.7;
    for (let z = from[1], row = 0; z < to[1] - 0.01; z += d, row++) {
      const dz = Math.min(d, to[1] - z);
      for (let x = from[0] - (row % 2 ? slab / 2 : 0); x < to[0] - 0.01; x += slab) {
        const x0 = Math.max(from[0], x);
        const x1 = Math.min(to[0], x + slab);
        if (x1 - x0 > 0.05) out.push({ x: (x0 + x1) / 2, z: z + dz / 2, w: x1 - x0, d: dz, tone: r() });
      }
    }
    return out;
  }, [from, to, slab, seed]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const base = new THREE.Color(color);
    const deep = base.clone().offsetHSL(0, -0.02, -0.05);
    slabs.forEach((s, i) => {
      o.position.set(s.x, 0.02, s.z);
      o.scale.set(s.w - 0.05, 0.04, s.d - 0.05);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, base.clone().lerp(deep, s.tone));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [slabs, color]);
  const w = to[0] - from[0];
  const d = to[1] - from[1];
  return (
    <group>
      {/* grout */}
      <mesh position={[from[0] + w / 2, 0.003, from[1] + d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={glaze(GLAZE.stoneDeep, { gloss: 0.1 })}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, slabs.length]} receiveShadow material={glaze("#ffffff", { gloss: 0.3 })}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

/** A dry-stone wall of uneven blocks, capped with a small tiled roof (like the Jongmyo wall). */
export function StoneWall({ from, length, height = 2.1, depth = 0.7, seed = 1 }: { from: V3; length: number; height?: number; depth?: number; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const blocks = useMemo(() => {
    const r = rand(seed);
    const out: { pos: V3; scale: V3; tone: number }[] = [];
    const rows = Math.round(height / 0.5);
    for (let row = 0; row < rows; row++) {
      let x = row % 2 ? -0.3 : 0;
      while (x < length) {
        const w = Math.min(0.55 + r() * 0.55, length - x);
        if (w > 0.12) out.push({ pos: [x + w / 2, row * 0.5 + 0.25, 0], scale: [w - 0.05, 0.46, depth - r() * 0.06], tone: r() });
        x += w;
      }
    }
    return out;
  }, [length, height, depth, seed]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const a = new THREE.Color(GLAZE.stone);
    const b = new THREE.Color(GLAZE.stoneDeep);
    blocks.forEach((bl, i) => {
      o.position.set(...bl.pos);
      o.scale.set(...bl.scale);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, a.clone().lerp(b, bl.tone));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [blocks]);

  return (
    <group position={from}>
      <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]} castShadow receiveShadow material={glaze("#ffffff", { gloss: 0.35 })}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <TileCap position={[length / 2, height + 0.02, 0]} length={length + 0.3} width={depth + 0.8} height={0.62} />
    </group>
  );
}

/** A long gabled cap of roof tiles. */
export function TileCap({ position, length, width, height = 0.42 }: { position: V3; length: number; width: number; height?: number }) {
  const geom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, 0);
    s.quadraticCurveTo(-width / 4, height * 0.35, 0, height);
    s.quadraticCurveTo(width / 4, height * 0.35, width / 2, 0);
    s.lineTo(-width / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 8 });
    g.translate(0, 0, -length / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [length, width, height]);
  return (
    <group position={position}>
      <mesh geometry={geom} castShadow receiveShadow material={glaze(GLAZE.tile, { gloss: 0.7 })} />
      <mesh position={[0, height + 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={glaze(GLAZE.tile, { gloss: 0.8 })}>
        <cylinderGeometry args={[0.07, 0.07, length, 10]} />
      </mesh>
    </group>
  );
}

/** A hipped roof whose four corners lift a little, like hanok eaves. */
export function HanokRoof({ width, depth, height, lift = 0.28 }: { width: number; depth: number; height: number; lift?: number }) {
  const geom = useMemo(() => {
    const hw = width / 2;
    const hd = depth / 2;
    const rw = Math.max(0.2, hw - hd * 0.75);
    const c = {
      fl: new THREE.Vector3(-hw, lift, hd),
      fr: new THREE.Vector3(hw, lift, hd),
      bl: new THREE.Vector3(-hw, lift, -hd),
      br: new THREE.Vector3(hw, lift, -hd),
      mf: new THREE.Vector3(0, 0, hd),
      mb: new THREE.Vector3(0, 0, -hd),
      ml: new THREE.Vector3(-hw, lift * 0.35, 0),
      mr: new THREE.Vector3(hw, lift * 0.35, 0),
      r0: new THREE.Vector3(-rw, height, 0),
      r1: new THREE.Vector3(rw, height, 0),
    };
    // Sagging midpoints between corner and centre give the eave its soft curve.
    const sag = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().lerp(b, 0.5).setY((a.y + b.y) / 2 - lift * 0.35);
    const qfl = sag(c.fl, c.mf);
    const qfr = sag(c.mf, c.fr);
    const qbl = sag(c.bl, c.mb);
    const qbr = sag(c.mb, c.br);
    const tris: THREE.Vector3[][] = [
      [c.fl, qfl, c.r0], [qfl, c.mf, c.r0], [c.mf, c.r1, c.r0], [c.mf, qfr, c.r1], [qfr, c.fr, c.r1],
      [c.br, qbr, c.r1], [qbr, c.mb, c.r1], [c.mb, c.r0, c.r1], [c.mb, qbl, c.r0], [qbl, c.bl, c.r0],
      [c.bl, c.ml, c.r0], [c.ml, c.fl, c.r0],
      [c.fr, c.mr, c.r1], [c.mr, c.br, c.r1],
      // underside
      [c.fl, c.fr, c.mf], [c.fl, c.bl, c.br], [c.fl, c.br, c.fr], [c.bl, c.mb, c.br],
    ];
    const pos: number[] = [];
    for (const t of tris) for (const v of t) pos.push(v.x, v.y, v.z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, [width, depth, height, lift]);
  const rw = Math.max(0.2, width / 2 - (depth / 2) * 0.75);
  return (
    <group>
      <mesh geometry={geom} castShadow receiveShadow>
        <meshPhysicalMaterial attach="material" color={GLAZE.tile} roughness={0.35} clearcoat={0.75} clearcoatRoughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={glaze(GLAZE.tile, { gloss: 0.85 })}>
        <cylinderGeometry args={[0.09, 0.09, rw * 2 + 0.4, 12]} />
      </mesh>
    </group>
  );
}

/** A small hanok shopfront: stone plinth, wooden posts, paper-white walls, lattice windows. */
export function Hanok({ position, width = 5, depth = 3, rotation = 0, glow = 0.2 }: { position: V3; width?: number; depth?: number; rotation?: number; glow?: number }) {
  const posts = 4;
  const wallH = 2;
  const front = depth / 2;
  const bays = Array.from({ length: posts - 1 }, (_, i) => -width / 2 + 0.25 + ((width - 0.5) / (posts - 1)) * (i + 0.5));
  const bayW = (width - 0.5) / (posts - 1) - 0.2;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow material={glaze(GLAZE.stone, { gloss: 0.3 })}>
        <boxGeometry args={[width + 0.3, 0.36, depth + 0.3]} />
      </mesh>
      {/* walls */}
      <mesh position={[0, 0.36 + wallH / 2, -0.15]} castShadow receiveShadow material={glaze(GLAZE.warmWhite, { gloss: 0.4 })}>
        <boxGeometry args={[width - 0.2, wallH, depth - 0.5]} />
      </mesh>
      {/* posts */}
      {Array.from({ length: posts }, (_, i) => {
        const x = -width / 2 + 0.25 + ((width - 0.5) / (posts - 1)) * i;
        return (
          <mesh key={i} position={[x, 0.36 + wallH / 2, front - 0.25]} castShadow material={glaze(GLAZE.wood, { gloss: 0.55 })}>
            <cylinderGeometry args={[0.11, 0.12, wallH, 12]} />
          </mesh>
        );
      })}
      {/* lattice windows and a lit doorway in the middle bay */}
      {bays.map((x, i) =>
        i === 1 ? (
          <group key={i} position={[x, 0.36, front - 0.38]}>
            <mesh position={[0, 0.95, 0]} material={glaze(GLAZE.lamp, { gloss: 0.2, emissive: GLAZE.lamp, emissiveIntensity: glow })}>
              <boxGeometry args={[bayW * 0.8, 1.8, 0.04]} />
            </mesh>
            <mesh position={[0, 1.9, 0.02]} material={glaze(GLAZE.woodDeep, { gloss: 0.5 })}>
              <boxGeometry args={[bayW * 0.86, 0.1, 0.06]} />
            </mesh>
          </group>
        ) : (
          <Lattice key={i} position={[x, 1.45, front - 0.38]} width={bayW} height={1.05} />
        ),
      )}
      <group position={[0, 0.36 + wallH, 0]}>
        <HanokRoof width={width + 1.1} depth={depth + 1.1} height={1.25} />
      </group>
    </group>
  );
}

export function Lattice({ position, width, height }: { position: V3; width: number; height: number }) {
  // All bars in one mesh: a window is one draw call, not thirty.
  const bars = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const nx = Math.max(3, Math.round(width / 0.22));
    const ny = Math.max(3, Math.round(height / 0.22));
    for (let i = 0; i <= nx; i++) parts.push(new THREE.BoxGeometry(0.035, height, 0.03).translate(-width / 2 + (width / nx) * i, 0, 0.03));
    for (let j = 0; j <= ny; j++) parts.push(new THREE.BoxGeometry(width, 0.035, 0.03).translate(0, -height / 2 + (height / ny) * j, 0.03));
    return mergeGeometries(parts);
  }, [width, height]);
  return (
    <group position={position}>
      <mesh material={glaze("#fbf8f0", { gloss: 0.15, emissive: "#fff3dc", emissiveIntensity: 0.15 })}>
        <boxGeometry args={[width, height, 0.03]} />
      </mesh>
      <mesh geometry={bars} material={glaze(GLAZE.woodDeep, { gloss: 0.5 })} />
    </group>
  );
}

export function Tree({ position, scale = 1, seed = 1, fruit = false }: { position: V3; scale?: number; seed?: number; fruit?: boolean }) {
  const blobs = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: 4 }, () => ({
      p: [(r() - 0.5) * 1.2, 2.2 + r() * 0.9, (r() - 0.5) * 1.2] as V3,
      s: 0.75 + r() * 0.45,
      deep: r() > 0.5,
    }));
  }, [seed]);
  const fruits = useMemo(() => {
    if (!fruit) return [];
    const r = rand(seed + 7);
    return Array.from({ length: 9 }, () => [(r() - 0.5) * 1.8, 2.0 + r() * 1.3, (r() - 0.5) * 1.8] as V3);
  }, [fruit, seed]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow material={glaze(GLAZE.woodDeep, { gloss: 0.5 })}>
        <cylinderGeometry args={[0.12, 0.18, 2, 10]} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s} castShadow receiveShadow material={glaze(b.deep ? GLAZE.celadonDeep : GLAZE.celadon, { gloss: 0.3 })}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      ))}
      {fruits.map((p, i) => (
        <mesh key={i} position={p} castShadow material={glaze(GLAZE.persimmon, { gloss: 0.9 })}>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
      ))}
    </group>
  );
}

/** A low wooden platform for sitting outdoors. */
export function Pyeongsang({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const legs: V3[] = [
    [-1, 0.2, -0.7],
    [1, 0.2, -0.7],
    [-1, 0.2, 0.7],
    [1, 0.2, 0.7],
  ];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[2.3, 0.12, 1.7]} radius={0.04} position={[0, 0.46, 0]} castShadow receiveShadow material={glaze(GLAZE.wood, { gloss: 0.6 })} />
      {legs.map((p, i) => (
        <mesh key={i} position={p} castShadow material={glaze(GLAZE.woodDeep, { gloss: 0.5 })}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

export function Lantern({ position, glow = 0.4 }: { position: V3; glow?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow material={glaze(GLAZE.ink, { gloss: 0.6 })}>
        <cylinderGeometry args={[0.04, 0.05, 1.6, 8]} />
      </mesh>
      <RoundedBox args={[0.32, 0.4, 0.32]} radius={0.05} position={[0, 1.72, 0]} material={glaze(GLAZE.lamp, { gloss: 0.4, emissive: GLAZE.lamp, emissiveIntensity: glow })} />
      <mesh position={[0, 1.97, 0]} material={glaze(GLAZE.ink, { gloss: 0.6 })}>
        <coneGeometry args={[0.26, 0.16, 4]} />
      </mesh>
    </group>
  );
}

/** A porcelain pot with a cobalt band and a rounded shrub. */
export function Planter({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow material={glaze(GLAZE.white, { gloss: 0.9 })}>
        <cylinderGeometry args={[0.32, 0.24, 0.6, 20]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={glaze(GLAZE.cobalt, { gloss: 0.9 })}>
        <cylinderGeometry args={[0.31, 0.3, 0.07, 20]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow material={glaze(GLAZE.celadonDeep, { gloss: 0.6 })}>
        <sphereGeometry args={[0.36, 18, 14]} />
      </mesh>
    </group>
  );
}

export function Curb({ from, to, height = 0.18, width = 0.3 }: { from: [number, number]; to: [number, number]; height?: number; width?: number }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  return (
    <mesh position={[(from[0] + to[0]) / 2, height / 2, (from[1] + to[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]} castShadow receiveShadow material={glaze(GLAZE.stone, { gloss: 0.35 })}>
      <boxGeometry args={[len, height, width]} />
    </mesh>
  );
}

/** A low courtyard wall with a tiled cap. */
export function LowWall({ from, to, height = 1 }: { from: [number, number]; to: [number, number]; height?: number }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  return (
    <group position={[(from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow material={glaze(GLAZE.warmWhite, { gloss: 0.35 })}>
        <boxGeometry args={[len, height, 0.35]} />
      </mesh>
      <TileCap position={[0, height, 0]} length={len + 0.2} width={0.7} height={0.26} />
    </group>
  );
}
