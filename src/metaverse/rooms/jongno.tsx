"use client";

import { Forest, GableRoof, Hanok, JarTerrace, Mountains, Pavement, TexBox, Terrain, TiledWall, heightAt, rand, type Hill, type TreeSpot } from "../world";
import { LeafLitter } from "../autumn";
import { Workshop } from "../Workshop";
import type { RoomConfig } from "../types";
import { toon } from "../toon/material";
import { Ink } from "../toon/part";

// Seosulla-gil and its neighbourhood, about 90 m x 80 m.
// North is -z. The lane runs north-south along the west wall of Jongmyo (east side, x = 20);
// hanok workshops line its west side, two alleys lead west to a small hill with a pavilion,
// and an entrance plaza sits at the south end. Beyond the wall, the long roof of Jongmyo's
// main hall rises over the shrine's woods. Real shop names and signs are left out.

const HILLS: Hill[] = [
  { x: -37, z: -12, r: 14, h: 3.6 },
  { x: -40, z: 18, r: 10, h: 1.6 },
];

// Trees are laid out once so the walk map can keep travelers out of their trunks.
const TREES: TreeSpot[] = (() => {
  {
    const r = rand(11);
    const out: TreeSpot[] = [];
    // Jongmyo woods beyond the wall
    for (let i = 0; i < 140; i++) {
      const x = 23 + r() * 24;
      const z = -42 + r() * 80;
      if (x > 28 && x < 44 && z > -34 && z < 18) continue; // keep the hall's courtyard open
      const k = r();
      out.push({ x, z, s: 1 + r() * 0.5, kind: k < 0.38 ? "maple" : k < 0.55 ? "ginkgo" : k < 0.78 ? "green" : "pine" });
    }
    // pines on the hill
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2;
      const d = 4 + r() * 10;
      out.push({ x: -37 + Math.cos(a) * d, z: -12 + Math.sin(a) * d, s: 0.8 + r() * 0.4, kind: r() > 0.5 ? "pine" : "maple" });
    }
    // ginkgo along the plaza and west road
    for (const [x, z] of [[-34, 33], [-24, 36.5], [-12, 36.5], [0, 36.5], [-31, 24], [-31, 5], [-27, -26]] as const) out.push({ x, z, s: 0.95, kind: "ginkgo" });
    out.push({ x: 8.2, z: 4.6, s: 0.8, kind: "persimmon" });
    // maples along the lane, between the workshops
    for (const z of [-36.5, -26.8, -13.9, 14, 24.3, 31.2]) out.push({ x: 9.3, z, s: 0.75, kind: "maple" });
    // a far ring of trees so the town does not end at a cliff
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      const k = r();
      out.push({ x: Math.cos(a) * (52 + r() * 6), z: Math.sin(a) * (48 + r() * 6), s: 1.1 + r() * 0.4, kind: k < 0.35 ? "maple" : k < 0.5 ? "ginkgo" : k < 0.7 ? "green" : "pine" });
    }
    return out;
  }
})();

function MainHall() {
  // A long hall on a stone terrace, roof running north-south (like Jongmyo Jeongjeon).
  const posts = 22;
  return (
    <group position={[36, 0, -8]}>
      <TexBox size={[16, 1.3, 50]} position={[0, 0.65, 0]} name="granite" tile={1.6} tint="#d6d0c4" />
      <TexBox size={[7.5, 4.4, 44]} position={[0.8, 1.3 + 2.2, 0]} name="plaster" tile={3} tint="#c9c1b3" />
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={i} position={[-3.3, 1.3 + 2.2, -21 + (42 / (posts - 1)) * i]} castShadow material={toon("#a24a38")}>
          <cylinderGeometry args={[0.28, 0.3, 4.4, 12]} />
          <Ink />
        </mesh>
      ))}
      <group position={[0, 1.3 + 4.4 + 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof length={48} depth={13} height={4} lift={0.6} sag={0.35} />
      </group>
    </group>
  );
}

function Pavilion() {
  const y = heightAt(-37, -12, HILLS);
  return (
    <group position={[-37, y, -12]}>
      <TexBox size={[5.2, 0.5, 5.2]} position={[0, 0.25, 0]} name="granite" tile={1.2} />
      <TexBox size={[4.6, 0.12, 4.6]} position={[0, 0.9, 0]} name="wood" tile={1} />
      {[-2, 2].flatMap((x) =>
        [-2, 2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 2.1, z]} castShadow material={toon("#a85a3e")}>
            <cylinderGeometry args={[0.15, 0.17, 3.2, 12]} />
            <Ink />
          </mesh>
        )),
      )}
      <GableRoof length={6.6} depth={6.6} height={1.9} position={[0, 3.7, 0]} lift={0.55} />
    </group>
  );
}

function Pyeongsang({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <TexBox size={[2.4, 0.14, 1.8]} position={[0, 0.5, 0]} name="wood" tile={0.9} />
      {[-1.05, 1.05].flatMap((x) => [-0.75, 0.75].map((z) => <TexBox key={`${x}${z}`} size={[0.14, 0.45, 0.14]} position={[x, 0.22, z]} name="wood" tile={0.8} />))}
    </group>
  );
}

/** A wooden rack on the wall where travelers hang wish lanterns. */
function WishRack() {
  // Posts and a top beam; the ropes and lanterns are drawn by the room (shared, live).
  return (
    <group position={[19.15, 0, 3]}>
      {[-11, 0, 11].map((z) => (
        <TexBox key={z} size={[0.2, 3.05, 0.2]} position={[0, 1.52, z]} name="wood" tile={1} />
      ))}
      <TexBox size={[0.16, 0.16, 22.6]} position={[0, 2.95, 0]} name="wood" tile={1} />
    </group>
  );
}

const BENCHES: [number, number, number][] = [
  [-20, 33.5, 0],
  [-6, 33.5, 0],
  [-37, -3.5, Math.PI / 2],
];

const LAMPS: [number, number][] = [
  [-36, 30.6],
  [-24, 30.6],
  [-12, 30.6],
  [-2, 30.6],
  [18.9, -34],
  [18.9, -22.5],
  [18.9, -11],
  [18.9, 17.5],
  [18.9, 29],
  [9.9, 6.8],
];

const RECTS = [
  { x0: 10, z0: -38, x1: 19.2, z1: 34 }, // the lane
  { x0: -31.5, z0: 30.5, x1: 19.2, z1: 39 }, // entrance plaza
  { x0: -30, z0: -15.6, x1: 10, z1: -12.4 }, // north alley
  { x0: -30, z0: 12.4, x1: 10, z1: 15.6 }, // south alley
  { x0: 0.6, z0: -4, x1: 10, z1: -0.4 }, // courtyard, around the platform
  { x0: 0.6, z0: 2.4, x1: 10, z1: 6 },
  { x0: 5.2, z0: -0.4, x1: 10, z1: 2.4 },
  { x0: -32, z0: -16, x1: -28, z1: 39 }, // west road
  { x0: -48, z0: -28, x1: -32, z1: 4 }, // the hill
];

const near = (x: number, z: number) => RECTS.some((r) => x > r.x0 - 1 && x < r.x1 + 1 && z > r.z0 - 1 && z < r.z1 + 1);

// Everything solid that stands on walkable ground: trunks, lamps, rack posts, benches,
// the workshop bench and the pavilion's posts.
const HOLES = [
  ...TREES.filter((t) => near(t.x, t.z)).map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s + 0.25 })),
  ...LAMPS.map(([x, z]) => ({ x, z, r: 0.4 })),
  ...[-8, 3, 14].map((z) => ({ x: 19.15, z, r: 0.35 })),
  ...BENCHES.map(([x, z]) => ({ x, z, r: 1.2 })),
  { x: 10.8, z: -28.6, r: 1.15 },
  // the pavilion's stone platform stands up off the hill: walk around it, not through it
  { x: -37, z: -12, r: 3.5 },
  { x: 1.6, z: 4.8, r: 1.5 },
  { x: 3.6, z: 4.8, r: 1.3 },
  ...[-2, 2].flatMap((dx) => [-2, 2].map((dz) => ({ x: -37 + dx, z: -12 + dz, r: 0.35 }))),
];

function Benches() {
  const spots = BENCHES;
  return (
    <>
      {spots.map(([x, z, r], i) => (
        <group key={i} position={[x, heightAt(x, z, HILLS), z]} rotation={[0, r, 0]}>
          <TexBox size={[2.2, 0.1, 0.55]} position={[0, 0.48, 0]} name="wood" tile={0.8} />
          <TexBox size={[0.12, 0.45, 0.5]} position={[-0.9, 0.22, 0]} name="granite" tile={0.6} />
          <TexBox size={[0.12, 0.45, 0.5]} position={[0.9, 0.22, 0]} name="granite" tile={0.6} />
        </group>
      ))}
    </>
  );
}

function Scene() {
  const trees = TREES;
  return (
    <group>
      <Mountains />
      <Terrain size={[130, 120]} hills={HILLS} name="grass" tile={5} />
      {/* lane, plaza, alleys, courtyard and the path up the hill */}
      <Pavement from={[9.6, -40]} to={[19.6, 34]} name="granite" tile={1.6} gain={1.85} />
      <Pavement from={[-32, 30]} to={[19.6, 39.5]} name="granite" tile={1.6} gain={1.85} />
      <Pavement from={[-30, -16]} to={[9.6, -12]} name="granite" tile={1.4} gain={1.75} />
      <Pavement from={[-30, 12]} to={[9.6, 16]} name="granite" tile={1.4} gain={1.75} />
      <Pavement from={[-1, -4.5]} to={[9.6, 6.5]} name="ground" tile={3} />
      <Pavement from={[-32, -16]} to={[-28, 39.5]} name="ground" tile={3} y={0.008} />

      <TiledWall from={[20.45, 0, -42]} length={76} />
      <MainHall />

      {/* workshops along the lane (facing east) */}
      <Hanok position={[5.6, 0, -31.5]} rotation={Math.PI / 2} width={9} depth={6} seed={1} />
      <Hanok position={[5.6, 0, -21.6]} rotation={Math.PI / 2} width={8} depth={6} seed={2} />
      <Hanok position={[5.6, 0, -8.6]} rotation={Math.PI / 2} width={6.4} depth={6} seed={3} />
      <Hanok position={[5.6, 0, 9.4]} rotation={Math.PI / 2} width={5} depth={6} seed={4} />
      <Hanok position={[5.6, 0, 20.4]} rotation={Math.PI / 2} width={7.6} depth={6} seed={5} />
      <Hanok position={[5.6, 0, 27.2]} rotation={Math.PI / 2} width={4.6} depth={6} seed={6} />
      {/* courtyard house */}
      <Hanok position={[-4.2, 0, 1]} rotation={Math.PI / 2} width={10} depth={6.5} glow={0.5} seed={7} />
      {/* second rows along the alleys */}
      <Hanok position={[-7, 0, -20.6]} rotation={Math.PI} width={9} depth={6.5} seed={8} />
      <Hanok position={[-18, 0, -20.6]} rotation={Math.PI} width={9} depth={6.5} seed={9} />
      <Hanok position={[-14.5, 0, -8.4]} rotation={Math.PI} width={9} depth={6.5} seed={10} />
      <Hanok position={[-24, 0, -8.4]} rotation={Math.PI} width={7} depth={6.5} seed={11} />
      <Hanok position={[-14.5, 0, 8.4]} rotation={0} width={9} depth={6.5} seed={12} />
      <Hanok position={[-24, 0, 8.4]} rotation={0} width={7} depth={6.5} seed={13} />
      <Hanok position={[-7, 0, 20.6]} rotation={Math.PI} width={9} depth={6.5} seed={14} />
      <Hanok position={[-18, 0, 20.6]} rotation={Math.PI} width={9} depth={6.5} seed={15} />

      <Pyeongsang position={[3.6, 0, 1]} rotation={Math.PI / 2} />
      <JarTerrace position={[2.6, 0, 5.2]} rotation={0} />
      <WishRack />
      <Pavilion />
      <Benches />
      <LeafLitter
        hills={HILLS}
        spots={[
          ...[-34, -24, -14, -4, 6, 16, 26].map((z) => ({ x: 18.6, z, r: 1.6, n: 34 })),
          ...[-36.5, -26.8, -13.9, 14, 24.3, 31.2].map((z) => ({ x: 10.4, z, r: 1.8, n: 40 })),
          { x: 6, z: 3, r: 3, n: 70 },
          { x: -37, z: -12, r: 9, n: 160 },
          { x: -10, z: 34, r: 6, n: 90 },
        ]}
      />
      <Forest trees={trees} hills={HILLS} />
    </group>
  );
}

export const jongno: RoomConfig = {
  slug: "jongno",
  name: { en: "Jongno", ko: "종로" },
  place: { en: "Seosulla-gil, along the Jongmyo wall", ko: "서순라길, 종묘 돌담길" },
  hour: { en: "Autumn afternoon", ko: "가을 오후" },
  walk: { cell: 0.5, rects: RECTS, holes: HOLES, body: 0.28 },
  spawn: { x: 13, z: 35 },
  spawnHeading: Math.PI,
  // A clear autumn sky over warm haze at the horizon.
  sky: { top: "#a9cbe6", bottom: "#f4e6cf" },
  // A low, warm sun from the south-west: late afternoon in October.
  sun: { position: [-42, 30, 34], color: "#ffe8c8", intensity: 2.2 },
  ambient: { sky: "#fff3e2", ground: "#d8c6ae", intensity: 1.05 },
  world: {
    hills: HILLS,
    fog: ["#f1e3cd", 48, 200],
  },
  lanterns: true,
  map: {
    blocks: [
      [2.3, -36.5, 8.9, -17], // workshops along the lane
      [2.3, -12, 8.9, -5],
      [2.3, 6.6, 8.9, 30],
      [-23, -24.5, -2, -16.6],
      [-29, -12, -9, -5],
      [-29, 5, -9, 12],
      [-23, 16.6, -2, 24.5],
      [-8, -3, -1, 5], // courtyard house
      [28, -33, 44, 17], // Jongmyo main hall terrace
    ],
    walls: [[20.4, -42, 20.4, 34]],
    green: [
      [-37, -12, 12],
      [34, 25, 10],
      [34, -38, 8],
    ],
  },
  lamps: LAMPS,
  pois: [
    {
      id: "entrance",
      at: { x: 13, z: 33 },
      radius: 3,
      title: { en: "Seosulla-gil", ko: "서순라길" },
      line: {
        en: "A quiet lane along the west wall of Jongmyo. Walk north with the wall on your right.",
        ko: "종묘 서쪽 돌담을 따라 난 조용한 길이에요. 돌담을 오른쪽에 두고 북쪽으로 걸어 보세요.",
      },
    },
    {
      id: "wall",
      at: { x: 17.5, z: 3 },
      radius: 5.5,
      action: "lantern",
      title: { en: "The wish wall", ko: "소원 담장" },
      line: {
        en: "Travelers hang a wish lantern on the wall here. It stays lit for a day. Behind the wall stands Jongmyo, the shrine of the Joseon kings.",
        ko: "여행자들이 이곳 담장에 소원 등을 달아요. 등은 하루 동안 켜져 있어요. 담 너머에는 조선 왕실의 사당, 종묘가 있어요.",
      },
    },
    {
      id: "workshop",
      at: { x: 12, z: -28.6 },
      radius: 3.5,
      action: "watch",
      title: { en: "Jewelry workshops", ko: "귀금속 공방" },
      line: {
        en: "Craftspeople work in narrow hanok shops along this lane. Some leave the doors open so you can watch.",
        ko: "이 길의 좁은 한옥 가게에서 장인들이 일해요. 문을 열어 두어 작업을 구경할 수 있는 곳도 있어요.",
      },
    },
    {
      id: "courtyard",
      at: { x: 6, z: 1 },
      radius: 3.2,
      action: "sit",
      seat: { x: 5.3, z: 1, heading: Math.PI / 2, on: { x: 4.25, z: 1, y: 0.16 } },
      title: { en: "A courtyard and a pyeongsang", ko: "마당과 평상" },
      line: {
        en: "Neighbors rest on a wooden platform under the persimmon tree. Sit down for a while.",
        ko: "이웃들이 감나무 아래 나무 평상에서 쉬어 가요. 잠시 앉아 쉬어 보세요.",
      },
    },
    {
      id: "pavilion",
      at: { x: -37, z: -8 },
      radius: 4,
      action: "sit",
      actionLabel: { en: "Sit in the pavilion", ko: "정자에 앉기" },
      // Sit on the edge of the pavilion floor, legs over the side, facing down the hill.
      seat: { x: -37, z: -7.9, heading: 0, on: { x: -37, z: -9.75, y: heightAt(-37, -9.75, HILLS) + 0.96 - 0.45 - heightAt(-37, -7.9, HILLS) } },
      title: { en: "The hill pavilion", ko: "언덕 위 정자" },
      line: {
        en: "From up here you can see the hanok roofs and the long roof of Jongmyo's main hall.",
        ko: "여기서는 한옥 지붕들과 종묘 정전의 긴 지붕이 내려다보여요.",
      },
    },
    // Benches: a place to sit, not a stamp.
    ...BENCHES.map(([x, z, r], i) => {
      const along = Math.abs(r) < 0.1; // bench runs east-west, sit facing south
      const walk = along ? { x, z: z + 1.6 } : { x: x + 1.6, z };
      const on = along ? { x, z: z + 0.05, y: 0.53 - 0.45 } : { x: x + 0.05, z, y: 0.53 - 0.45 };
      return {
        id: `bench-${i}`,
        at: walk,
        radius: 2,
        action: "sit" as const,
        stamp: false,
        actionLabel: { en: "Sit on the bench", ko: "벤치에 앉기" },
        seat: { x: walk.x, z: walk.z, heading: along ? 0 : Math.PI / 2, on },
        title: { en: "A bench", ko: "벤치" },
        line: { en: "Sit for a while and watch the street.", ko: "잠시 앉아 거리를 바라보세요." },
      };
    }),
  ],
  Scene,
  // The workbench sits in front of the southern workshop, facing the lane.
  Live: () => <Workshop position={[10.8, 0, -28.6]} rotation={Math.PI / 2} />,
};
