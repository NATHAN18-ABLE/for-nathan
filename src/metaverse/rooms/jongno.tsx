"use client";

import { useMemo } from "react";
import { Forest, GableRoof, Hanok, Mountains, Pavement, TexBox, Terrain, TiledWall, heightAt, rand, type Hill, type TreeSpot } from "../world";
import type { RoomConfig } from "../types";

// Seosulla-gil and its neighbourhood, about 90 m x 80 m.
// North is -z. The lane runs north-south along the west wall of Jongmyo (east side, x = 20);
// hanok workshops line its west side, two alleys lead west to a small hill with a pavilion,
// and an entrance plaza sits at the south end. Beyond the wall, the long roof of Jongmyo's
// main hall rises over the shrine's woods. Real shop names and signs are left out.

const HILLS: Hill[] = [
  { x: -37, z: -12, r: 14, h: 3.6 },
  { x: -40, z: 18, r: 10, h: 1.6 },
];

function useTrees(): TreeSpot[] {
  return useMemo(() => {
    const r = rand(11);
    const out: TreeSpot[] = [];
    // Jongmyo woods beyond the wall
    for (let i = 0; i < 140; i++) {
      const x = 23 + r() * 24;
      const z = -42 + r() * 80;
      if (x > 28 && x < 44 && z > -34 && z < 18) continue; // keep the hall's courtyard open
      out.push({ x, z, s: 1 + r() * 0.5, kind: r() > 0.85 ? "pine" : "green" });
    }
    // pines on the hill
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2;
      const d = 4 + r() * 10;
      out.push({ x: -37 + Math.cos(a) * d, z: -12 + Math.sin(a) * d, s: 0.8 + r() * 0.4, kind: r() > 0.3 ? "pine" : "green" });
    }
    // ginkgo along the plaza and west road
    for (const [x, z] of [[-34, 33], [-24, 36.5], [-12, 36.5], [0, 36.5], [-31, 24], [-31, 5], [-27, -26]] as const) out.push({ x, z, s: 0.95, kind: "ginkgo" });
    out.push({ x: 8.2, z: 4.6, s: 0.8, kind: "persimmon" });
    // a far ring of trees so the town does not end at a cliff
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      out.push({ x: Math.cos(a) * (52 + r() * 6), z: Math.sin(a) * (48 + r() * 6), s: 1.1 + r() * 0.4, kind: r() > 0.6 ? "pine" : "green" });
    }
    return out;
  }, []);
}

function MainHall() {
  // A long hall on a stone terrace, roof running north-south (like Jongmyo Jeongjeon).
  const posts = 22;
  return (
    <group position={[36, 0, -8]}>
      <TexBox size={[16, 1.3, 50]} position={[0, 0.65, 0]} name="granite" tile={1.6} tint="#d6d0c4" />
      <TexBox size={[7.5, 4.4, 44]} position={[0.8, 1.3 + 2.2, 0]} name="plaster" tile={3} tint="#c9c1b3" />
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={i} position={[-3.3, 1.3 + 2.2, -21 + (42 / (posts - 1)) * i]} castShadow>
          <cylinderGeometry args={[0.28, 0.3, 4.4, 12]} />
          <meshStandardMaterial color="#7b3b2c" roughness={0.75} />
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
          <mesh key={`${x}${z}`} position={[x, 2.1, z]} castShadow>
            <cylinderGeometry args={[0.15, 0.17, 3.2, 12]} />
            <meshStandardMaterial color="#8a4a33" roughness={0.75} />
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

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.8, 8]} />
        <meshStandardMaterial color="#2c2f35" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.95, 0]}>
        <boxGeometry args={[0.42, 0.5, 0.42]} />
        <meshStandardMaterial color="#fff4de" emissive="#ffd08a" emissiveIntensity={0.6} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <coneGeometry args={[0.36, 0.22, 4]} />
        <meshStandardMaterial color="#2c2f35" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A wooden rack on the wall where travelers hang wish lanterns. */
function WishRack() {
  return (
    <group position={[19.1, 0, 3]}>
      {[-5, 0, 5].map((z) => (
        <TexBox key={z} size={[0.2, 2.6, 0.2]} position={[0, 1.3, z]} name="wood" tile={1} />
      ))}
      <TexBox size={[0.16, 0.16, 10.4]} position={[0, 2.5, 0]} name="wood" tile={1} />
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i} position={[-0.05, 2.05, -4.4 + i * 1.1]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.42, 12]} />
            <meshStandardMaterial color={["#e8a0a0", "#f1d38a", "#a8c8b6", "#a9b9e6"][i % 4]} emissive="#ffcf8a" emissiveIntensity={0.25} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Benches() {
  const spots: [number, number, number][] = [
    [-20, 33.5, 0],
    [-6, 33.5, 0],
    [-37, -3.5, Math.PI / 2],
  ];
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
  const trees = useTrees();
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
      <WishRack />
      <Pavilion />
      <Benches />
      {[-36, -24, -12, -2, 14, 14, 14, 14, 14, 14].map((v, i) =>
        i < 4 ? <Lamp key={i} position={[v, 0, 30.6]} /> : <Lamp key={i} position={[18.9, 0, -34 + (i - 4) * 11.5]} />,
      )}
      <Forest trees={trees} hills={HILLS} />
    </group>
  );
}

export const jongno: RoomConfig = {
  slug: "jongno",
  name: { en: "Jongno", ko: "종로" },
  place: { en: "Seosulla-gil, along the Jongmyo wall", ko: "서순라길, 종묘 돌담길" },
  hour: { en: "Morning", ko: "오전" },
  walk: {
    cell: 0.5,
    rects: [
      { x0: 10, z0: -38, x1: 19.2, z1: 34 }, // the lane
      { x0: -31.5, z0: 30.5, x1: 19.2, z1: 39 }, // entrance plaza
      { x0: -30, z0: -15.6, x1: 10, z1: -12.4 }, // north alley
      { x0: -30, z0: 12.4, x1: 10, z1: 15.6 }, // south alley
      { x0: 0.6, z0: -4, x1: 10, z1: -0.4 }, // courtyard, around the platform
      { x0: 0.6, z0: 2.4, x1: 10, z1: 6 },
      { x0: 5.2, z0: -0.4, x1: 10, z1: 2.4 },
      { x0: -32, z0: -16, x1: -28, z1: 39 }, // west road
      { x0: -48, z0: -28, x1: -32, z1: 4 }, // the hill
    ],
  },
  spawn: { x: 13, z: 35 },
  spawnHeading: Math.PI,
  sky: { top: "#bcd3ea", bottom: "#eef1f0" },
  sun: { position: [-30, 42, 22], color: "#fff1dc", intensity: 2.6 },
  ambient: { sky: "#dfe9f4", ground: "#b9ab8f", intensity: 0.7 },
  world: {
    hills: HILLS,
    hdr: "/metaverse/tex/sky_morning.hdr",
    fog: ["#dfe6ea", 45, 190],
  },
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
      radius: 3.2,
      title: { en: "The wish wall", ko: "소원 담장" },
      line: {
        en: "Travelers hang small lanterns on the wall here. Behind it stands Jongmyo, the shrine of the Joseon kings.",
        ko: "여행자들이 이곳 담장에 작은 등을 걸어요. 담 너머에는 조선 왕실의 사당, 종묘가 있어요.",
      },
    },
    {
      id: "workshop",
      at: { x: 11, z: -26 },
      radius: 3.5,
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
      title: { en: "A courtyard and a pyeongsang", ko: "마당과 평상" },
      line: {
        en: "Neighbors rest on a wooden platform under the persimmon tree. Try the Sit gesture.",
        ko: "이웃들이 감나무 아래 나무 평상에서 쉬어 가요. 앉기 동작을 해 보세요.",
      },
    },
    {
      id: "pavilion",
      at: { x: -37, z: -8 },
      radius: 4,
      title: { en: "The hill pavilion", ko: "언덕 위 정자" },
      line: {
        en: "From up here you can see the hanok roofs and the long roof of Jongmyo's main hall.",
        ko: "여기서는 한옥 지붕들과 종묘 정전의 긴 지붕이 내려다보여요.",
      },
    },
  ],
  Scene,
};
