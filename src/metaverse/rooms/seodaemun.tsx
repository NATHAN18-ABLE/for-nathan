"use client";

import { useEffect, useMemo, useRef } from "react";
import { Burst, Flowers, Rocks, Tufts } from "../life";
import { Sign } from "./props";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Boardwalk, CityView, Forest, GableRoof, Mountains, TexBox, Terrain, heightAt, rand, type Hill, type TreeSpot } from "../world";
import { LeafLitter } from "../autumn";
import { toon, toonWith } from "../toon/material";
import { Ink, Part } from "../toon/part";
import { on } from "../bus";
import type { RoomConfig } from "../types";

// Ansan Jarak-gil on a clear autumn day, about 60 m x 90 m of the hillside.
// North is -z. A wooden boardwalk climbs from the trailhead in the south in switchbacks: north,
// east, north again past a lookout over the city, west through the metasequoia grove (with a
// roofed rest stop), and north to the beacon on the summit. The city, Namsan and N Seoul Tower
// lie to the south-east below.

const LIFT = 0.18; // the deck stands this far above the slope

const HILLS: Hill[] = [
  { x: 0, z: -30, r: 62, h: 14 },
  { x: -24, z: -44, r: 22, h: 5 },
  // the land falls away to the south-east, down to the city
  { x: 95, z: 45, r: 75, h: -9 },
];
const ground = (x: number, z: number) => heightAt(x, z, HILLS);

const RECTS = [
  { x0: -12, z0: 28, x1: 12, z1: 38 }, // trailhead
  // Stretches meet edge to edge (never overlap), so each bit of deck is laid once.
  { x0: -1.6, z0: 6.4, x1: 1.6, z1: 28 }, // first climb, north
  { x0: -1.6, z0: 3, x1: 22, z1: 6.4 }, // east
  { x0: 18.6, z0: -18, x1: 22, z1: 3 }, // north again
  { x0: 22, z0: -11, x1: 31, z1: -3 }, // the lookout
  { x0: -24, z0: -21.4, x1: 22, z1: -18 }, // west, through the grove
  { x0: -6, z0: -27, x1: 4, z1: -21.4 }, // rest stop
  { x0: -24, z0: -40, x1: -20.6, z1: -21.4 }, // up to the summit
  { x0: -32, z0: -52, x1: -12, z1: -40 }, // summit
];

const nearPath = (x: number, z: number, m: number) => RECTS.some((r) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m);

const TREES: TreeSpot[] = (() => {
  const r = rand(23);
  const out: TreeSpot[] = [];
  for (let i = 0; i < 900 && out.length < 300; i++) {
    const x = -62 + r() * 120;
    const z = -78 + r() * 100;
    if (nearPath(x, z, 3.4)) continue;
    // keep the view from the lookout open over the slope to the south-east
    if (x > 24 && z > -26 && z < 14) continue;
    const grove = x > -26 && x < 24 && z > -34 && z < -8;
    const k = r();
    const kind: TreeSpot["kind"] = grove ? (k < 0.75 ? "metasequoia" : "green") : k < 0.3 ? "green" : k < 0.5 ? "pine" : k < 0.7 ? "maple" : k < 0.85 ? "ginkgo" : "metasequoia";
    out.push({ x, z, s: kind === "metasequoia" ? 1.05 + r() * 0.35 : 0.9 + r() * 0.45, kind });
  }
  // ginkgo around the trailhead
  for (const [x, z] of [[-14, 30], [14, 30], [-14, 37], [14, 37]] as const) out.push({ x, z, s: 0.9, kind: "ginkgo" });
  return out;
})();

const BENCHES: [number, number][] = [
  [-8, 36.6],
  [8, 36.6],
];
const SHELTER = { x: -1, z: -25 };
const SPRING = { x: 10.6, z: 30.2 }; // the mineral spring at the trailhead
const GYM = { x: -10.4, z: 32.2 }; // a waist-twister, like on every Seoul hill
const CAIRN = { x: -14.4, z: -42.4 }; // the stone tower walkers add to
const MAGPIE_SPOT = { x: -14, z: -19.7 };
const ARCH_Z = 28.3;
const BEACON = { x: -22, z: -46 };

const HOLES = [
  ...TREES.filter((t) => nearPath(t.x, t.z, 1)).map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s + 0.25 })),
  ...BENCHES.map(([x, z]) => ({ x, z, r: 1.2 })),
  { x: SHELTER.x, z: -26.2, r: 1.4 }, // the shelter's bench
  ...[-4, 2].flatMap((x) => [-26.6, -22.6].map((z) => ({ x, z, r: 0.25 }))), // its posts
  { x: BEACON.x, z: BEACON.z, r: 2.9 },
  { x: -6, z: 31, r: 1.05 }, // the trail sign
  { x: SPRING.x, z: SPRING.z, r: 1.05 },
  { x: GYM.x, z: GYM.z, r: 0.95 },
  { x: CAIRN.x, z: CAIRN.z, r: 1.0 },
  ...[-2.5, 2.5].map((x) => ({ x, z: ARCH_Z, r: 0.25 })), // the arch posts
];

// Grass along both edges of the deck, and in patches over the slope.
const TUFTS = (() => {
  const r = rand(51);
  const out: { x: number; z: number; r: number; n: number }[] = [];
  for (const q of RECTS) {
    for (let t = 0; t < 1; t += 0.12) {
      for (const [x, z] of [
        [q.x0 + (q.x1 - q.x0) * t, q.z0 - 1.6],
        [q.x0 + (q.x1 - q.x0) * t, q.z1 + 1.6],
        [q.x0 - 1.6, q.z0 + (q.z1 - q.z0) * t],
        [q.x1 + 1.6, q.z0 + (q.z1 - q.z0) * t],
      ] as const) {
        if (!nearPath(x, z, 0.7)) out.push({ x, z, r: 1.1, n: 6 });
      }
    }
  }
  for (let i = 0; i < 60; i++) {
    const x = -50 + r() * 100, z = -70 + r() * 100;
    if (!nearPath(x, z, 1.4)) out.push({ x, z, r: 2.2, n: 9 });
  }
  return out;
})();

const ROCKS: [number, number, number][] = (() => {
  const r = rand(61);
  const out: [number, number, number][] = [];
  for (let i = 0; i < 260 && out.length < 46; i++) {
    const x = -46 + r() * 92, z = -64 + r() * 92;
    const s = 0.35 + r() * 0.9;
    if (nearPath(x, z, 1.4 + s)) continue;
    out.push([x, z, s]);
  }
  // a granite outcrop just off the summit, where the old beacon keepers stood
  out.push([-30.5, -54, 1.6], [-27.6, -55.2, 1.1], [-9.6, -47, 1.2]);
  return out;
})();

function Bench({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, ground(x, z) + LIFT, z]} rotation={[0, rotation, 0]}>
      <TexBox size={[2.2, 0.1, 0.55]} position={[0, 0.48, 0]} name="wood" tile={0.8} />
      <TexBox size={[2.2, 0.45, 0.08]} position={[0, 0.78, -0.26]} name="wood" tile={0.8} />
      <TexBox size={[0.12, 0.45, 0.5]} position={[-0.9, 0.22, 0]} name="wood" tile={0.6} tint="#a88a6c" />
      <TexBox size={[0.12, 0.45, 0.5]} position={[0.9, 0.22, 0]} name="wood" tile={0.6} tint="#a88a6c" />
    </group>
  );
}

function Shelter() {
  const y = ground(SHELTER.x, SHELTER.z) + LIFT;
  return (
    <group position={[SHELTER.x, y, SHELTER.z]}>
      {[-3, 3].flatMap((dx) =>
        [-1.6, 2.4].map((dz) => (
          <mesh key={`${dx}${dz}`} position={[dx, 1.35, dz]} castShadow material={toon("#9a6c45")}>
            <cylinderGeometry args={[0.13, 0.15, 2.7, 10]} />
            <Ink />
          </mesh>
        )),
      )}
      <GableRoof length={7.6} depth={5.6} height={1.2} position={[0, 2.75, 0.4]} lift={0.25} sag={0.1} />
    </group>
  );
}

/** Ansan's beacon: a round stone mound with a chimney, on the summit. */
function Beacon() {
  const y = ground(BEACON.x, BEACON.z) + LIFT;
  return (
    <group position={[BEACON.x, y, BEACON.z]}>
      <mesh position={[0, 0.9, 0]} castShadow material={toonWith({ color: "#d9cfbf", key: "beacon-stone" })} userData={{ solid: true }}>
        <cylinderGeometry args={[1.9, 2.3, 1.8, 28]} />
        <Ink />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow material={toon("#cfc4b2")}>
        <cylinderGeometry args={[0.55, 0.75, 0.9, 16]} />
        <Ink />
      </mesh>
      <mesh position={[0, 2.7, 0]} material={toon("#4a4440")}>
        <cylinderGeometry args={[0.42, 0.42, 0.12, 16]} />
      </mesh>
    </group>
  );
}

function TrailSign() {
  const y = ground(-6, 31) + LIFT;
  return (
    <group position={[-6, y, 31]} rotation={[0, 0.3, 0]}>
      {[-0.7, 0.7].map((x) => (
        <TexBox key={x} size={[0.14, 1.9, 0.14]} position={[x, 0.95, 0]} name="wood" tile={0.8} tint="#a88a6c" />
      ))}
      <TexBox size={[1.9, 1.0, 0.1]} position={[0, 1.45, 0.02]} name="wood" tile={1} />
      <mesh position={[0, 1.45, 0.08]} material={toon("#2f5a46")}>
        <boxGeometry args={[1.6, 0.72, 0.02]} />
      </mesh>
    </group>
  );
}

/** The trailhead arch with the trail's name on it. */
function Arch() {
  const y = ground(0, ARCH_Z) + LIFT;
  return (
    <group position={[0, y, ARCH_Z]}>
      {[-2.5, 2.5].map((x) => (
        <TexBox key={x} size={[0.3, 3.4, 0.3]} position={[x, 1.7, 0]} name="wood" tile={1} tint="#9a7652" />
      ))}
      <TexBox size={[6, 0.28, 0.42]} position={[0, 3.45, 0]} name="wood" tile={1.2} tint="#8a6646" />
      <TexBox size={[6.4, 0.16, 0.6]} position={[0, 3.66, 0]} name="wood" tile={1.2} tint="#6f5038" />
      <Sign position={[0, 2.95, 0.16]} text="안산 자락길" color="#2f5a46" />
      <Sign position={[0, 2.95, -0.16]} rotation={Math.PI} text="ANSAN JARAK-GIL" color="#2f5a46" />
    </group>
  );
}

/** A mineral spring (약수터): a stone basin fed by a spout, with a gourd ladle on the rim. */
function Spring() {
  const y = ground(SPRING.x, SPRING.z) + LIFT;
  return (
    <group position={[SPRING.x, y, SPRING.z]}>
      <TexBox size={[1.5, 1.2, 0.35]} position={[0.25, 0.6, 0]} name="granite" tile={0.8} tint="#bdb5a8" />
      <mesh position={[-0.35, 0.32, 0]} castShadow material={toon("#c9c1b4")} userData={{ solid: true }}>
        <cylinderGeometry args={[0.62, 0.55, 0.64, 22]} />
        <Ink />
      </mesh>
      <mesh position={[-0.35, 0.62, 0]} material={toonWith({ color: "#7fb6d8", emissive: "#3f8fc0", emissiveIntensity: 0.15, key: "spring-water" })}>
        <cylinderGeometry args={[0.52, 0.52, 0.04, 22]} />
      </mesh>
      {/* the spout, coming out of the stone slab */}
      <mesh position={[-0.05, 0.98, 0]} rotation={[0, 0, Math.PI / 2]} material={toon("#8d9298")}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
        <Ink />
      </mesh>
      {/* the gourd ladle */}
      <group position={[-0.8, 0.68, 0.3]} rotation={[0, 0.6, 0.2]}>
        <mesh scale={[1, 0.5, 1]} material={toon("#e3c98d")}>
          <sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Ink />
        </mesh>
        <mesh position={[0.24, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} material={toon("#c9a66a")}>
          <cylinderGeometry args={[0.018, 0.018, 0.34, 6]} />
        </mesh>
      </group>
    </group>
  );
}

/** Stone towers walkers build a stone at a time. The tall one takes a stone from each visitor (Live). */
function Cairns() {
  const stones = (x: number, z: number, n: number, seed: number) => {
    const r = rand(seed);
    let h = ground(x, z) + LIFT;
    return Array.from({ length: n }, (_, i) => {
      const s = 0.5 - i * (0.32 / n) + r() * 0.06;
      const y = h + s * 0.35;
      h += s * 0.62;
      return (
        <mesh key={i} position={[x + (r() - 0.5) * 0.08, y, z + (r() - 0.5) * 0.08]} rotation={[0, r() * 3, (r() - 0.5) * 0.12]} scale={[1, 0.6, 0.9]} castShadow material={toon(i % 3 ? "#bdb6aa" : "#a9a296")}>
          <dodecahedronGeometry args={[s, 0]} />
          <Ink />
        </mesh>
      );
    });
  };
  return (
    <group>
      {stones(CAIRN.x, CAIRN.z, 7, 3)}
      {stones(-29, -49, 5, 4)}
      {stones(-26.6, -43.2, 4, 5)}
    </group>
  );
}

function Scene() {
  return (
    <group>
      <Mountains radius={260} color="#9fb48c" />
      <CityView from={[105, -70]} to={[225, 190]} tower={[170, 140]} base={-9} />
      <Terrain size={[240, 240]} hills={HILLS} name="grass" tile={5} />
      <Boardwalk rects={RECTS} hills={HILLS} lift={LIFT} />
      <TrailSign />
      <Arch />
      <Spring />
      <Cairns />
      <Rocks rocks={ROCKS} hills={HILLS} />
      <Tufts spots={TUFTS} hills={HILLS} />
      <Flowers
        hills={HILLS}
        spots={[
          { x: -11, z: 27.4, r: 1.6, n: 26 },
          { x: 11, z: 27.4, r: 1.6, n: 26 },
          { x: 13.6, z: 34, r: 1.4, n: 18 },
          { x: 32.4, z: -7, r: 1.8, n: 30 },
          { x: 24, z: -12.4, r: 1.4, n: 18 },
          { x: -11, z: -39.2, r: 1.6, n: 24 },
          { x: -33.4, z: -46, r: 1.8, n: 28 },
        ]}
      />
      <Flowers kind="aster" seed={33} hills={HILLS} spots={[{ x: 3.2, z: 16, r: 1.4, n: 18 }, { x: -3.2, z: 10, r: 1.2, n: 14 }, { x: 7, z: 1.4, r: 1.2, n: 14 }]} />
      {BENCHES.map(([x, z], i) => (
        <Bench key={i} x={x} z={z} rotation={Math.PI} />
      ))}
      <Shelter />
      <Bench x={SHELTER.x} z={-26.2} />
      <Beacon />
      <LeafLitter
        hills={HILLS}
        seed={7}
        spots={[
          { x: -10, z: -24, r: 8, n: 140 },
          { x: 12, z: -24, r: 7, n: 110 },
          { x: 0, z: 33, r: 7, n: 80 },
          { x: 24, z: -6, r: 5, n: 50 },
        ]}
      />
      <Forest trees={TREES} hills={HILLS} seed={5} />
    </group>
  );
}

/** The spring's water: a thin stream from the spout while someone drinks. */
function SpringWater() {
  const ref = useRef<THREE.Mesh>(null);
  const until = useRef(0);
  useEffect(() => on("use:spring", () => (until.current = performance.now() + 2600)), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const k = until.current - performance.now();
    m.visible = k > 0;
    m.scale.y = Math.min(1, (2600 - k) / 300);
  });
  const y = ground(SPRING.x, SPRING.z) + LIFT;
  return (
    <>
      <mesh ref={ref} position={[SPRING.x - 0.32, y + 0.8, SPRING.z]} visible={false} material={toonWith({ color: "#a9d6f2", emissive: "#5fb0e6", emissiveIntensity: 0.3, key: "spring-stream" })}>
        <cylinderGeometry args={[0.035, 0.05, 0.36, 8]} />
      </mesh>
      <Burst effect="spring" kind="drop" at={[SPRING.x - 0.35, y + 0.7, SPRING.z]} count={12} spread={0.5} rise={1.2} />
    </>
  );
}

/** The waist-twister: a turning disc between two handles. It spins when someone uses it. */
function Twister() {
  const disc = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useEffect(() => on("use:gym", () => (spin.current = Math.PI * 4)), []);
  useFrame((_, dt) => {
    const g = disc.current;
    if (!g || spin.current <= 0) return;
    const step = Math.min(spin.current, dt * 7);
    spin.current -= step;
    g.rotation.y += step;
  });
  const y = ground(GYM.x, GYM.z) + LIFT;
  return (
    <group position={[GYM.x, y, GYM.z]}>
      <mesh position={[0, 0.08, 0]} material={toon("#4f7a5c")}>
        <cylinderGeometry args={[0.7, 0.75, 0.16, 20]} />
        <Ink />
      </mesh>
      <group ref={disc} position={[0, 0.2, 0]}>
        <mesh material={toon("#e0b23c")}>
          <cylinderGeometry args={[0.42, 0.42, 0.08, 20]} />
          <Ink />
        </mesh>
        <mesh position={[0.2, 0.05, 0]} material={toon("#c8463c")}>
          <boxGeometry args={[0.2, 0.03, 0.12]} />
        </mesh>
      </group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.75, -0.45]} material={toon("#2f6aa8")} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.5, 10]} />
          <Ink />
        </mesh>
      ))}
      <mesh position={[0, 1.42, -0.45]} rotation={[0, 0, Math.PI / 2]} material={toon("#2f6aa8")}>
        <cylinderGeometry args={[0.045, 0.045, 1.2, 10]} />
        <Ink />
      </mesh>
      <Burst effect="gym" kind="spark" at={[0, 1.6, 0]} count={8} spread={0.5} rise={1} />
    </group>
  );
}

/** The cairn takes a stone from every visitor who adds one; after twelve it is cleared again. */
function CairnStones() {
  const N = 12;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const stack = useRef<{ n: number; dropAt: number[] }>({ n: 0, dropAt: [] });
  const base = ground(CAIRN.x, CAIRN.z) + LIFT + 2.32;
  useEffect(
    () =>
      on("use:cairn", () => {
        const st = stack.current;
        if (st.n >= N) st.n = 0;
        st.dropAt[st.n] = performance.now();
        st.n += 1;
      }),
    [],
  );
  useFrame(() => {
    const now = performance.now();
    const st = stack.current;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.visible = i < st.n;
      if (!m.visible) return;
      const fall = Math.min(1, (now - (st.dropAt[i] ?? 0)) / 450);
      m.position.y = base + i * 0.16 + (1 - fall * fall) * 1.6;
    });
  });
  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} position={[CAIRN.x + Math.sin(i * 2.3) * 0.03, base, CAIRN.z + Math.cos(i * 1.7) * 0.03]} rotation={[0, i * 1.3, 0]} scale={[1, 0.55, 0.85]} visible={false} material={toon(i % 2 ? "#c4bdb1" : "#aaa397")} castShadow>
          <dodecahedronGeometry args={[0.18 - i * 0.006, 0]} />
          <Ink />
        </mesh>
      ))}
      <Burst effect="cairn" kind="spark" at={[CAIRN.x, base + 0.8, CAIRN.z]} count={8} spread={0.6} rise={0.9} />
    </group>
  );
}

/** A Korean red squirrel (청설모) that darts along the slope by the rest stop and stops to look. */
function Squirrel() {
  const ref = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const route = useMemo(() => [{ x: 7.6, z: -22.8 }, { x: 10.2, z: -24.6 }, { x: 8.4, z: -26.8 }, { x: 6.2, z: -24.8 }], []);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime * 0.5;
    const leg = Math.floor(t) % route.length;
    const f = t % 1;
    const a = route[leg], b = route[(leg + 1) % route.length];
    const run = Math.min(1, f * 2.2); // dart, then sit and look about
    const x = a.x + (b.x - a.x) * run, z = a.z + (b.z - a.z) * run;
    const hop = run < 1 ? Math.abs(Math.sin(run * Math.PI * 5)) * 0.18 : 0;
    g.position.set(x, ground(x, z) + LIFT + 0.02 + hop, z);
    g.rotation.y = run < 1 ? Math.atan2(b.x - a.x, b.z - a.z) : Math.atan2(b.x - a.x, b.z - a.z) + Math.sin(state.clock.elapsedTime * 3) * 0.6;
    if (tail.current) tail.current.rotation.x = -0.6 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
  });
  return (
    <group ref={ref} scale={1.3}>
      <mesh position={[0, 0.12, 0]} scale={[0.8, 0.85, 1.15]} material={toon("#4a3f3a")}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <Ink />
      </mesh>
      <mesh position={[0, 0.22, 0.1]} material={toon("#4a3f3a")}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <Ink />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.04, 0.3, 0.09]} material={toon("#3a302c")}>
          <coneGeometry args={[0.022, 0.06, 6]} />
        </mesh>
      ))}
      <mesh ref={tail} position={[0, 0.2, -0.14]} scale={[0.7, 1.4, 0.7]} material={toon("#5a4e48")}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** Magpies circling over the forest. */
function Magpies() {
  const birds = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ r: 18 + i * 6, h: 24 + (i % 3) * 5, speed: 0.18 + i * 0.03, phase: i * 1.3, cx: -4 + i * 3, cz: -18 + i * 2 })), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const wings = useRef<(THREE.Group | null)[]>([]);
  // Called down: for a few seconds they circle low and tight over the one who whistled.
  const low = useRef(0);
  const calledUntil = useRef(0);
  useEffect(() => on("use:magpie", () => (calledUntil.current = performance.now() + 7000)), []);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const want = performance.now() < calledUntil.current ? 1 : 0;
    low.current += (want - low.current) * Math.min(1, dt * 1.4);
    const k = low.current;
    const gy = ground(MAGPIE_SPOT.x, MAGPIE_SPOT.z);
    birds.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = t * b.speed * (1 + k * 1.6) + b.phase;
      const r = b.r + (2.4 + i * 0.5 - b.r) * k;
      const cx = b.cx + (MAGPIE_SPOT.x - b.cx) * k, cz = b.cz + (MAGPIE_SPOT.z - b.cz) * k;
      const h = b.h + (gy + 4.2 + (i % 3) * 0.8 - b.h) * k;
      g.position.set(cx + Math.cos(a) * r, h + Math.sin(t * 0.7 + i) * 1.2 * (1 - k * 0.7), cz + Math.sin(a) * r);
      g.rotation.y = -a; // face along the circle
      const w = wings.current[i];
      if (w) w.children.forEach((c, k) => (c.rotation.z = (k ? -1 : 1) * Math.sin(t * 9 + i) * 0.7));
    });
  });
  return (
    <group>
      {birds.map((_, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)} scale={1.6}>
          <Part color="#22252b" scale={[0.6, 0.6, 1.2]}>
            <sphereGeometry args={[0.18, 12, 10]} />
          </Part>
          <Part color="#f4f1ea" position={[0, -0.05, 0.02]} scale={[0.5, 0.45, 0.8]} line={false}>
            <sphereGeometry args={[0.16, 10, 8]} />
          </Part>
          <Part color="#22252b" position={[0, 0.02, -0.36]} scale={[0.5, 0.15, 1]}>
            <boxGeometry args={[0.16, 0.1, 0.42]} />
          </Part>
          <group ref={(el) => void (wings.current[i] = el)}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.08, 0.05, 0]}>
                <Part color="#2c3a5a" position={[s * 0.2, 0, 0]} scale={[1, 0.12, 0.6]}>
                  <boxGeometry args={[0.4, 0.1, 0.32]} />
                </Part>
              </group>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

/** Smoke from the beacon: puffs rise, swell and thin out for a few seconds after a signal. */
function BeaconSmoke() {
  const N = 18;
  const puffs = useMemo(() => Array.from({ length: N }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, s: 0 })), []);
  const mats = useMemo(() => Array.from({ length: N }, () => new THREE.MeshToonMaterial({ color: "#f3f1ec", transparent: true, opacity: 0, depthWrite: false })), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const until = useRef(0);
  const next = useRef(0);
  useEffect(() => on("signal", () => (until.current = performance.now() + 5200)), []);
  useFrame((_, dt) => {
    const now = performance.now();
    const d = Math.min(dt, 0.05);
    if (now < until.current && now > next.current) {
      next.current = now + 230;
      const p = puffs.find((q) => q.life <= 0);
      if (p) Object.assign(p, { life: 4.5, x: (Math.random() - 0.5) * 0.2, y: 0, z: (Math.random() - 0.5) * 0.2, vx: 0.25 + Math.random() * 0.2, s: 0.35 });
    }
    puffs.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      if (p.life > 0) {
        p.life -= d;
        p.y += d * 1.5;
        p.x += d * p.vx; // a light breeze from the west
        p.s += d * 0.35;
      }
      m.visible = p.life > 0;
      m.position.set(p.x, p.y, p.z);
      m.scale.setScalar(p.s);
      mats[i].opacity = Math.min(1, p.life / 1.5) * 0.92;
    });
  });
  const y = ground(BEACON.x, BEACON.z) + LIFT + 2.75;
  return (
    <group position={[BEACON.x, y, BEACON.z]}>
      {puffs.map((_, i) => (
        <mesh key={i} ref={(el) => void (refs.current[i] = el)} material={mats[i]} visible={false}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
    </group>
  );
}

const seatOn = (walk: { x: number; z: number }, seat: { x: number; z: number }) => ({ x: seat.x, z: seat.z, y: 0.53 - 0.45 + ground(seat.x, seat.z) - ground(walk.x, walk.z) });

export const seodaemun: RoomConfig = {
  slug: "seodaemun",
  name: { en: "Seodaemun", ko: "서대문" },
  place: { en: "Ansan Jarak-gil forest boardwalk", ko: "안산 자락길 숲길" },
  hour: { en: "Autumn day", ko: "가을 낮" },
  walk: { cell: 0.5, rects: RECTS, holes: HOLES, body: 0.28 },
  spawn: { x: 0, z: 33.5 },
  spawnHeading: Math.PI,
  sky: { top: "#86bde8", bottom: "#e6f0ea" },
  sun: { position: [40, 62, 30], color: "#fff4e2", intensity: 2.1 },
  ambient: { sky: "#fff8ec", ground: "#c9d2b4", intensity: 1.05 },
  world: { hills: HILLS, fog: ["#e3ece8", 90, 340], floorLift: LIFT },
  map: {
    green: [
      [0, -24, 14],
      [-30, -10, 12],
      [10, 16, 10],
    ],
  },
  pois: [
    {
      id: "trailhead",
      at: { x: 0, z: 31 },
      radius: 3.5,
      title: { en: "Ansan Jarak-gil", ko: "안산 자락길" },
      line: {
        en: "A seven-kilometre loop of wooden boardwalk around Ansan, with no steps at all, so wheelchairs and strollers can go the whole way. Follow the deck up the hill.",
        ko: "안산을 한 바퀴 도는 약 7km의 나무 데크길이에요. 계단이 없어 휠체어와 유모차도 끝까지 갈 수 있어요. 데크를 따라 언덕을 올라 보세요.",
      },
    },
    {
      id: "lookout",
      at: { x: 27, z: -7 },
      radius: 4.5,
      action: "photo",
      title: { en: "The lookout", ko: "전망대" },
      line: {
        en: "Namsan and N Seoul Tower rise to the south-east, with the city spread out below. A good spot for a photo.",
        ko: "남동쪽으로 남산과 N서울타워가, 그 아래로 도시가 펼쳐져요. 사진 찍기 좋은 곳이에요.",
      },
    },
    {
      id: "spring",
      at: { x: 9.2, z: 30.6 },
      radius: 2,
      action: "use",
      effect: "spring",
      gesture: "bow",
      face: SPRING,
      actionLabel: { en: "Drink from the spring", ko: "약수 한 모금 마시기" },
      title: { en: "The mineral spring", ko: "약수터" },
      line: {
        en: "Seoul's hills are dotted with springs (yaksuteo) where neighbours fill bottles on their morning walk. The water is tested and the results posted beside each one.",
        ko: "서울의 산 곳곳에는 아침 산책길에 물을 받아 가는 약수터가 있어요. 수질 검사 결과가 옆에 붙어 있어요.",
      },
    },
    {
      id: "gym",
      at: { x: -10.4, z: 30.5 },
      radius: 1.6,
      action: "use",
      effect: "gym",
      gesture: "hop",
      face: GYM,
      stamp: false,
      actionLabel: { en: "Give the twister a spin", ko: "허리 돌리기 해 보기" },
      title: { en: "Outdoor gym", ko: "생활체육 운동기구" },
      line: {
        en: "Brightly painted exercise machines stand at trailheads all over Seoul. The waist-twister is the favourite.",
        ko: "서울 곳곳의 등산로 입구에는 알록달록한 운동기구가 있어요. 허리 돌리기가 가장 인기예요.",
      },
    },
    {
      id: "magpies",
      at: MAGPIE_SPOT,
      radius: 3,
      action: "use",
      effect: "magpie",
      gesture: "wave",
      actionLabel: { en: "Whistle to the magpies", ko: "까치 불러 보기" },
      title: { en: "Magpies", ko: "까치" },
      line: {
        en: "In Korea a magpie's call is said to bring good news or a welcome guest. Whistle and they may come down to see you.",
        ko: "까치가 울면 반가운 손님이나 좋은 소식이 온다고 해요. 휘파람을 불면 내려와 줄지도 몰라요.",
      },
    },
    {
      id: "cairn",
      at: { x: -15.6, z: -44.2 },
      radius: 2.2,
      action: "use",
      effect: "cairn",
      gesture: "bow",
      face: CAIRN,
      actionLabel: { en: "Add a stone to the cairn", ko: "돌탑에 돌 올리기" },
      title: { en: "Stone towers", ko: "돌탑" },
      line: {
        en: "Walkers stack small stones on mountain cairns with a quiet wish. Add yours; everyone here sees it land.",
        ko: "산길의 돌탑에는 오가는 사람들이 소원을 빌며 돌을 하나씩 올려요. 하나 올려 보세요. 여기 있는 모두가 함께 봐요.",
      },
    },
    {
      id: "grove",
      at: { x: -4, z: -19.7 },
      radius: 4,
      title: { en: "Metasequoia grove", ko: "메타세쿼이아 숲" },
      line: {
        en: "Tall metasequoias crowd this stretch of the trail. In late autumn their needles turn the colour of rust.",
        ko: "키 큰 메타세쿼이아가 늘어선 구간이에요. 늦가을이면 잎이 붉은 갈색으로 물들어요.",
      },
    },
    {
      id: "shelter",
      at: { x: -1, z: -23.4 },
      radius: 3,
      action: "sit",
      actionLabel: { en: "Sit in the shelter", ko: "쉼터에 앉기" },
      seat: { x: -1, z: -24.5, heading: 0, on: seatOn({ x: -1, z: -24.5 }, { x: -1, z: -26.15 }) },
      title: { en: "Forest rest stop", ko: "숲속 쉼터" },
      line: {
        en: "A roofed rest stop halfway up. Sit for a while and listen to the wind in the trees.",
        ko: "길 중간의 지붕 있는 쉼터예요. 잠시 앉아 숲 바람 소리를 들어 보세요.",
      },
    },
    {
      id: "beacon",
      at: { x: -22, z: -41.8 },
      radius: 4,
      action: "signal",
      title: { en: "Ansan beacon", ko: "안산 봉수대" },
      line: {
        en: "In the Joseon era, beacons carried news across the country: smoke by day, fire by night. The signal from Ansan was passed on to Namsan.",
        ko: "조선 시대에는 봉수로 소식을 전했어요. 낮에는 연기, 밤에는 불을 올렸죠. 안산 봉수대의 신호는 남산으로 이어졌어요.",
      },
    },
    ...BENCHES.map(([x, z], i) => {
      const walk = { x, z: z - 1.65 };
      return {
        id: `bench-${i}`,
        at: walk,
        radius: 2,
        action: "sit" as const,
        stamp: false,
        actionLabel: { en: "Sit on the bench", ko: "벤치에 앉기" },
        seat: { x: walk.x, z: walk.z, heading: Math.PI, on: seatOn(walk, { x, z: z - 0.05 }) },
        title: { en: "A bench", ko: "벤치" },
        line: { en: "Rest your legs before the climb.", ko: "오르기 전에 잠시 쉬어 가세요." },
      };
    }),
  ],
  Scene,
  Live: () => (
    <>
      <Magpies />
      <BeaconSmoke />
      <SpringWater />
      <Twister />
      <CairnStones />
      <Squirrel />
      <Burst effect="magpie" kind="note" at={[MAGPIE_SPOT.x, ground(MAGPIE_SPOT.x, MAGPIE_SPOT.z) + LIFT + 2.2, MAGPIE_SPOT.z]} count={6} spread={0.4} rise={1} />
    </>
  ),
};
