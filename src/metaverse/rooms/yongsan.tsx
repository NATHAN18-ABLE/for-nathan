"use client";

import { Boardwalk, CityView, Forest, Mountains, SeoulTower, Stairs, TexBox, Terrain, heightAt, rand, type Hill, type TreeSpot } from "../world";
import { LeafLitter } from "../autumn";
import { toon } from "../toon/material";
import { Ink } from "../toon/part";
import type { RoomConfig } from "../types";

// Haebangchon on the southern slope of Namsan, on a bright autumn afternoon; about 70 m x 80 m.
// North is -z and uphill. From the five-way junction at the bottom, the main street climbs north
// past small shops, turns west and climbs again to the ridge street at the top. Sinheung Market sits
// under its roof off the lower street, and the 108 steps run straight up the hill to the ridge.
// N Seoul Tower stands above on Namsan; Yongsan and the Han River lie below to the south.

const LIFT = 0.06; // paving stands a touch above the ground
const HILLS: Hill[] = [
  { x: 0, z: -60, r: 95, h: 16 }, // the slope up to Namsan
  { x: 12, z: -125, r: 60, h: 34 }, // Namsan
];
const ground = (x: number, z: number) => heightAt(x, z, HILLS);

const STAIRS = { x0: 6, z0: -32, x1: 9.5, z1: -6 };
const RECTS = [
  { x0: -14, z0: 26, x1: 14, z1: 36 }, // the five-way junction
  { x0: -2.5, z0: 6, x1: 2.5, z1: 26 }, // main street, lower
  { x0: -2.5, z0: -6, x1: 2.5, z1: 6 },
  { x0: -12, z0: 0, x1: -2.5, z1: 6 }, // to the market
  { x0: -28, z0: -6, x1: -12, z1: 8 }, // Sinheung Market
  { x0: -22, z0: -10, x1: 2.5, z1: -6 }, // main street turns west
  { x0: 2.5, z0: -6, x1: 9.5, z1: -2 }, // the foot of the steps
  STAIRS, // the 108 steps
  { x0: -22, z0: -32, x1: -17.5, z1: -10 }, // main street, upper
  { x0: -24, z0: -40, x1: 22, z1: -32 }, // the ridge street
];
const PAVED = RECTS.filter((r) => r !== STAIRS);
// Sidewalks: the paving widened to the house fronts, laid a touch lower than the street.
const SIDEWALKS = PAVED.map((r) => ({ x0: r.x0 - 0.8, z0: r.z0 - 0.8, x1: r.x1 + 0.8, z1: r.z1 + 0.8 }));
const MARKET = RECTS[4];

const overlaps = (a: { x0: number; z0: number; x1: number; z1: number }, b: { x0: number; z0: number; x1: number; z1: number }, m: number) =>
  a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.z0 < b.z1 + m && a.z1 > b.z0 - m;

// Houses fill the slope between the streets: two or three storeys, flat roofs, many with a green
// water tank on top. Near the ridge they stay low so the view south is open.
const PALETTE = ["#f2e6d0", "#e8d5c4", "#d9e4e8", "#f4dccf", "#e3e8d4", "#f1efe8", "#cfdde8", "#e9cfc9", "#c98b70", "#d8a48a"];
interface Lot {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  floors: number;
  color: string;
  tank: string | null;
  // a shop awning over the face toward the street: dx/dz is the way that face looks
  awning: { dx: number; dz: number; color: string } | null;
}
const AWNINGS = ["#c8463c", "#3e7d5b", "#2f5aa8", "#e0a53a", "#7a4f8c"];
const inView = (l: { x0: number; z0: number; x1: number; z1: number }) => overlaps(l, { x0: 11, z0: -31, x1: 24, z1: -14 }, 0);
const LOTS: Lot[] = (() => {
  const r = rand(31);
  const out: Lot[] = [];
  // The view south from the ridge stays open.
  const free = (lot: Omit<Lot, "floors" | "color" | "tank" | "awning">, m = 0.45) => !inView(lot) && !RECTS.some((q) => overlaps(lot, q, m)) && !out.some((q) => overlaps(lot, q, 0.2));
  const dress = (lot: Omit<Lot, "floors" | "color" | "tank" | "awning">, facing: { dx: number; dz: number } | null): Lot => {
    const cz = (lot.z0 + lot.z1) / 2;
    return {
      ...lot,
      floors: cz < -18 ? 1 + (r() < 0.4 ? 1 : 0) : 2 + (r() < 0.4 ? 1 : 0),
      color: PALETTE[Math.floor(r() * PALETTE.length)],
      tank: r() < 0.55 ? (r() < 0.7 ? "#4f9a77" : "#4c7fb8") : null,
      awning: facing && r() < 0.65 ? { ...facing, color: AWNINGS[Math.floor(r() * AWNINGS.length)] } : null,
    };
  };
  // First a row of houses right along every street, shopfronts facing it.
  const GAP = 0.6;
  for (const q of PAVED) {
    if (q === MARKET || q === RECTS[0]) continue;
    const tall = q.z1 - q.z0 > q.x1 - q.x0;
    for (const side of [-1, 1]) {
      let t = tall ? q.z0 : q.x0;
      const end = tall ? q.z1 : q.x1;
      while (t < end - 3) {
        const len = 4.4 + r() * 1.8, depth = 5 + r() * 1.4;
        const lot = tall
          ? side < 0
            ? { x0: q.x0 - GAP - depth, x1: q.x0 - GAP, z0: t, z1: t + len }
            : { x0: q.x1 + GAP, x1: q.x1 + GAP + depth, z0: t, z1: t + len }
          : side < 0
            ? { z0: q.z0 - GAP - depth, z1: q.z0 - GAP, x0: t, x1: t + len }
            : { z0: q.z1 + GAP, z1: q.z1 + GAP + depth, x0: t, x1: t + len };
        if (free(lot)) out.push(dress(lot, tall ? { dx: -side, dz: 0 } : { dx: 0, dz: -side }));
        t += len + 0.35;
      }
    }
  }
  // Then fill the slope between the streets.
  for (let z = -48; z < 24; z += 6.4)
    for (let x = -38; x < 34; x += 6.6) {
      const w = 5 + r() * 1.5, d = 5 + r() * 1.5;
      const cx = x + (r() - 0.5) * 1.2, cz = z + (r() - 0.5) * 1.2;
      const lot = { x0: cx - w / 2, z0: cz - d / 2, x1: cx + w / 2, z1: cz + d / 2 };
      if (!free(lot, 0.7)) continue;
      out.push(dress(lot, null));
    }
  return out;
})();

const TREES: TreeSpot[] = (() => {
  const r = rand(17);
  const out: TreeSpot[] = [];
  for (let i = 0; i < 900 && out.length < 260; i++) {
    const x = -90 + r() * 180;
    const z = -160 + r() * 116;
    const spot = { x0: x - 1.5, z0: z - 1.5, x1: x + 1.5, z1: z + 1.5 };
    if (RECTS.some((q) => overlaps(spot, q, 2)) || LOTS.some((q) => overlaps(spot, q, 0.5))) continue;
    if (Math.hypot(x - 12, z + 125) < 8) continue; // the tower's plaza
    const k = r();
    out.push({ x, z, s: 1 + r() * 0.5, kind: k < 0.4 ? "green" : k < 0.6 ? "maple" : k < 0.8 ? "pine" : "ginkgo" });
  }
  for (const [x, z] of [[-16, 27], [16, 27], [-16, 35], [16, 35]] as const) out.push({ x, z, s: 0.9, kind: "ginkgo" });
  return out;
})();

const TABLE = { x: -20, z: 0 };
const CAFE = { x: -14, z: -39 };

const HOLES = [
  ...TREES.filter((t) => RECTS.some((q) => t.x > q.x0 - 1 && t.x < q.x1 + 1 && t.z > q.z0 - 1 && t.z < q.z1 + 1)).map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s + 0.25 })),
  { x: TABLE.x, z: TABLE.z, r: 1.05 }, // the market table and its stools
  { x: CAFE.x, z: CAFE.z, r: 1.2 }, // the café bench
  ...[-26.5, -13.5].flatMap((x) => [-5.2, 7.2].map((z) => ({ x, z, r: 0.3 }))), // market roof posts
  ...[-25, -21, -17].map((x) => ({ x, z: -4.6, r: 1.1 })), // stalls along the market's north side
];

function House({ lot }: { lot: Lot }) {
  const corners = [ground(lot.x0, lot.z0), ground(lot.x1, lot.z0), ground(lot.x0, lot.z1), ground(lot.x1, lot.z1)];
  const base = Math.min(...corners) - 0.8;
  const top = Math.max(...corners) + lot.floors * 3;
  const w = lot.x1 - lot.x0, d = lot.z1 - lot.z0;
  const cx = (lot.x0 + lot.x1) / 2, cz = (lot.z0 + lot.z1) / 2;
  return (
    <group>
      <TexBox size={[w, top - base, d]} position={[cx, (top + base) / 2, cz]} name="facade" tile={3} tint={lot.color} />
      <TexBox size={[w + 0.3, 0.3, d + 0.3]} position={[cx, top + 0.15, cz]} name="plaster" tile={2} tint="#ddd6ca" />
      {lot.tank && (
        <mesh position={[cx + w * 0.22, top + 1, cz - d * 0.2]} material={toon(lot.tank)} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 1.4, 16]} />
          <Ink />
        </mesh>
      )}
      {lot.awning && (
        <mesh
          position={[cx + lot.awning.dx * (w / 2 + 0.5), Math.min(...corners) + 2.6, cz + lot.awning.dz * (d / 2 + 0.5)]}
          rotation={lot.awning.dx ? [0, 0, lot.awning.dx * -0.35] : [lot.awning.dz * 0.35, 0, 0]}
          material={toon(lot.awning.color)}
          castShadow
        >
          <boxGeometry args={lot.awning.dx ? [1.2, 0.08, d * 0.75] : [w * 0.75, 0.08, 1.2]} />
          <Ink />
        </mesh>
      )}
    </group>
  );
}

/** Sinheung Market under its new roof: posts, a long light roof, stalls and a shared table. */
function Market() {
  const m = MARKET;
  const y = (x: number, z: number) => ground(x, z) + LIFT;
  const roofY = Math.max(y(m.x0, m.z0), y(m.x1, m.z1), y(m.x0, m.z1), y(m.x1, m.z0)) + 4.2;
  return (
    <group>
      {[-26.5, -13.5].flatMap((x) =>
        [-5.2, 7.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, (roofY + y(x, z)) / 2, z]} material={toon("#5d6873")} castShadow>
            <cylinderGeometry args={[0.15, 0.15, roofY - y(x, z), 10]} />
            <Ink />
          </mesh>
        )),
      )}
      <mesh position={[(m.x0 + m.x1) / 2, roofY, (m.z0 + m.z1) / 2]} material={toon("#eef2f1")} castShadow>
        <boxGeometry args={[m.x1 - m.x0 + 1, 0.2, m.z1 - m.z0 + 1]} />
        <Ink />
      </mesh>
      {[-25, -21, -17].map((x, i) => (
        <group key={x} position={[x, y(x, -4.6), -4.6]}>
          <TexBox size={[2, 0.95, 1]} position={[0, 0.48, 0]} name="wood" tile={0.8} />
          <mesh position={[0, 2.1, 0.6]} rotation={[0.4, 0, 0]} material={toon(["#c8463c", "#e0a53a", "#3e7d5b"][i])} castShadow>
            <boxGeometry args={[2.2, 0.06, 1.1]} />
            <Ink />
          </mesh>
        </group>
      ))}
      <group position={[TABLE.x, y(TABLE.x, TABLE.z), TABLE.z]}>
        <TexBox size={[1.4, 0.06, 0.8]} position={[0, 0.74, 0]} name="wood" tile={0.8} />
        <TexBox size={[0.1, 0.72, 0.1]} position={[0, 0.36, 0]} name="wood" tile={0.8} tint="#9b8064" />
        {[-0.55, 0.55].flatMap((sx) =>
          [-0.6, 0.6].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx, 0.22, sz]} material={toon("#c8463c")}>
              <cylinderGeometry args={[0.18, 0.16, 0.45, 12]} />
              <Ink />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function CafeBench() {
  return (
    <group position={[CAFE.x, ground(CAFE.x, CAFE.z) + LIFT, CAFE.z]}>
      <TexBox size={[2.2, 0.1, 0.55]} position={[0, 0.48, 0]} name="wood" tile={0.8} />
      <TexBox size={[2.2, 0.45, 0.08]} position={[0, 0.78, -0.26]} name="wood" tile={0.8} />
      {[-0.9, 0.9].map((x) => (
        <TexBox key={x} size={[0.12, 0.45, 0.5]} position={[x, 0.22, 0]} name="wood" tile={0.6} tint="#9b8064" />
      ))}
      {/* a parasol */}
      <mesh position={[1.6, 1.2, 0.4]} material={toon("#5d6873")}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 6]} />
      </mesh>
      <mesh position={[1.6, 2.4, 0.4]} material={toon("#e8665b")} castShadow>
        <coneGeometry args={[1.3, 0.5, 8]} />
        <Ink />
      </mesh>
    </group>
  );
}

function Scene() {
  const towerY = ground(12, -125);
  return (
    <group>
      <Mountains radius={300} color="#a8b994" />
      <CityView from={[-160, 72]} to={[160, 230]} seed={9} />
      <Terrain size={[340, 340]} hills={HILLS} name="grass" tile={6} step={3} />
      <Boardwalk rects={SIDEWALKS} hills={HILLS} lift={0.03} paving={{ name: "granite", tile: 1.1, tint: "#c9c2b6" }} />
      <Boardwalk rects={PAVED} hills={HILLS} lift={LIFT} paving={{ name: "granite", tile: 1.4, tint: "#d8d2c8" }} />
      <Stairs rect={STAIRS} hills={HILLS} />
      {LOTS.map((lot, i) => (
        <House key={i} lot={lot} />
      ))}
      <Market />
      <CafeBench />
      <SeoulTower position={[12, towerY - 1, -125]} scale={1.5} />
      <LeafLitter
        hills={HILLS}
        seed={11}
        spots={[
          { x: 0, z: 31, r: 7, n: 80 },
          { x: -20, z: -36, r: 6, n: 60 },
          { x: 8, z: -18, r: 3, n: 30 },
        ]}
      />
      <Forest trees={TREES} hills={HILLS} seed={13} />
    </group>
  );
}

const seatOn = (walk: { x: number; z: number }, seat: { x: number; z: number }, height: number) => ({
  x: seat.x,
  z: seat.z,
  y: height - 0.45 + ground(seat.x, seat.z) - ground(walk.x, walk.z),
});

export const yongsan: RoomConfig = {
  slug: "yongsan",
  name: { en: "Yongsan", ko: "용산" },
  place: { en: "Haebangchon, the hillside village", ko: "해방촌 언덕 마을" },
  hour: { en: "Autumn afternoon", ko: "가을 오후" },
  walk: { cell: 0.5, rects: RECTS, holes: HOLES, body: 0.28 },
  spawn: { x: 0, z: 33 },
  spawnHeading: Math.PI,
  // A warm, clear afternoon: a little lower and more golden than the forest's noon.
  sky: { top: "#7fb2e0", bottom: "#f6dcb8" },
  sun: { position: [-50, 34, 24], color: "#ffe2b8", intensity: 2.05 },
  ambient: { sky: "#fff0dc", ground: "#cdb9a0", intensity: 1.05 },
  world: { hills: HILLS, fog: ["#f0e2cc", 90, 380], floorLift: LIFT },
  map: {
    blocks: LOTS.map((l): [number, number, number, number] => [l.x0, l.z0, l.x1, l.z1]),
    green: [[10, -70, 26]],
  },
  pois: [
    {
      id: "junction",
      at: { x: 0, z: 31 },
      radius: 3.5,
      title: { en: "Haebangchon", ko: "해방촌" },
      line: {
        en: "Haebangchon, 'Liberation Village', grew on the southern slope of Namsan after 1945, when people coming south built homes here. Today its alleys hold small cafés, shops and rooftop views.",
        ko: "해방촌은 1945년 광복 뒤 남쪽으로 내려온 사람들이 남산 남쪽 비탈에 집을 지으며 생긴 동네예요. 지금은 골목마다 작은 카페와 가게, 옥상 풍경이 이어져요.",
      },
    },
    {
      id: "market",
      at: { x: -20, z: 2.4 },
      radius: 3.4,
      action: "sit",
      actionLabel: { en: "Sit at the market table", ko: "시장 테이블에 앉기" },
      // on the stool at the table's south-east corner, facing the table
      seat: { x: -19.45, z: 1.95, heading: Math.PI, on: seatOn({ x: -19.45, z: 1.95 }, { x: -19.45, z: 0.6 }, 0.45) },
      title: { en: "Sinheung Market", ko: "신흥시장" },
      line: {
        en: "An old neighbourhood market, renewed under a new roof, where small restaurants and workshops sit side by side.",
        ko: "오래된 동네 시장이 새 지붕 아래 다시 태어났어요. 작은 식당과 공방이 나란히 있어요.",
      },
    },
    {
      id: "steps",
      at: { x: 7.75, z: -4 },
      radius: 3,
      title: { en: "The 108 steps", ko: "108계단" },
      line: {
        en: "Built in the 1940s to reach a shrine of the colonial government on Namsan. The shrine is long gone; the steps now carry neighbours up the hill, with a small slope lift beside them.",
        ko: "1940년대에 남산의 일제 신사로 오르려고 만든 계단이에요. 신사는 사라졌고, 지금은 이웃들이 언덕을 오르내리는 길이 되었어요. 옆에는 경사형 엘리베이터도 있어요.",
      },
    },
    {
      id: "cafe",
      at: { x: -14, z: -36.6 },
      radius: 3,
      action: "sit",
      actionLabel: { en: "Sit at the café", ko: "카페에 앉기" },
      seat: { x: -14, z: -37.3, heading: 0, on: seatOn({ x: -14, z: -37.3 }, { x: -14, z: -38.95 }, 0.53) },
      title: { en: "A café on the ridge", ko: "언덕 위 카페" },
      line: {
        en: "Cafés line the ridge street at the top of the village. Take a seat and watch the city below.",
        ko: "마을 꼭대기 길에는 카페가 늘어서 있어요. 자리에 앉아 아래 도시를 내려다보세요.",
      },
    },
    {
      id: "view",
      at: { x: 17, z: -35 },
      radius: 4,
      action: "photo",
      title: { en: "View over Yongsan", ko: "용산 전망" },
      line: {
        en: "Yongsan and the Han River spread out to the south, and N Seoul Tower stands right above you on Namsan.",
        ko: "남쪽으로 용산과 한강이 펼쳐지고, 바로 위 남산에는 N서울타워가 서 있어요.",
      },
    },
  ],
  Scene,
};
