"use client";

import { useEffect, useMemo, useRef } from "react";
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
const BEACON = { x: -22, z: -46 };

const HOLES = [
  ...TREES.filter((t) => nearPath(t.x, t.z, 1)).map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s + 0.25 })),
  ...BENCHES.map(([x, z]) => ({ x, z, r: 1.2 })),
  { x: SHELTER.x, z: -26.2, r: 1.4 }, // the shelter's bench
  ...[-4, 2].flatMap((x) => [-26.6, -22.6].map((z) => ({ x, z, r: 0.25 }))), // its posts
  { x: BEACON.x, z: BEACON.z, r: 2.7 },
  { x: -6, z: 31, r: 1.05 }, // the trail sign
];

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

function Scene() {
  return (
    <group>
      <Mountains radius={260} color="#9fb48c" />
      <CityView from={[105, -70]} to={[225, 190]} tower={[170, 140]} base={-9} />
      <Terrain size={[240, 240]} hills={HILLS} name="grass" tile={5} />
      <Boardwalk rects={RECTS} hills={HILLS} lift={LIFT} />
      <TrailSign />
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

/** Magpies circling over the forest. */
function Magpies() {
  const birds = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ r: 18 + i * 6, h: 24 + (i % 3) * 5, speed: 0.18 + i * 0.03, phase: i * 1.3, cx: -4 + i * 3, cz: -18 + i * 2 })), []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const wings = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    birds.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = t * b.speed + b.phase;
      g.position.set(b.cx + Math.cos(a) * b.r, b.h + Math.sin(t * 0.7 + i) * 1.2, b.cz + Math.sin(a) * b.r);
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
      id: "grove",
      at: { x: -8, z: -19.7 },
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
    </>
  ),
};
