"use client";

import { Base, Curb, Hanok, Lantern, LowWall, Paving, Planter, Pyeongsang, StoneWall, Tree } from "../parts";
import { GLAZE } from "../glaze";
import type { RoomConfig } from "../types";

// Seosulla-gil: a lane along the stone wall of Jongmyo, with small workshops and a courtyard.
// Only the character of the place is kept (the wall, hanok fronts, a platform to sit on);
// no real shop names or signs.
function Scene() {
  return (
    <group>
      <Base size={[30, 19]} position={[0, 0, 1.5]} />
      <Paving from={[-14, -2.4]} to={[14, 2.3]} />
      <Paving from={[2.8, 2.3]} to={[9.2, 7.2]} color={GLAZE.warmWhite} />

      {/* Jongmyo wall and the trees of the shrine behind it */}
      <StoneWall from={[-14, 0, -2.75]} length={16.2} seed={3} />
      {[-12.5, -9.6, -6.4, -3.1, 0.2].map((x, i) => (
        <Tree key={x} position={[x, 0, -4.8 - (i % 2) * 1.1]} scale={1.15 + (i % 3) * 0.12} seed={10 + i} />
      ))}

      {/* Workshops on the east side of the lane */}
      <Hanok position={[4.9, 0, -4.35]} width={4.8} depth={3} glow={0.25} />
      <Hanok position={[10.6, 0, -4.35]} width={4.8} depth={3} glow={0.18} />
      <Lantern position={[2.35, 0, -2.2]} glow={0.25} />
      <Lantern position={[7.75, 0, -2.2]} glow={0.25} />
      <Lantern position={[13.2, 0, -2.2]} glow={0.25} />
      {[-11, -7, -3].map((x) => (
        <Lantern key={x} position={[x, 0, -2.1]} glow={0.2} />
      ))}

      {/* South side: a kerb, pots, and a courtyard with a platform and a persimmon tree */}
      <Curb from={[-14, 2.4]} to={[2.8, 2.4]} />
      <Curb from={[9.2, 2.4]} to={[14, 2.4]} />
      {[-12, -9, -6, -3, 0.5, 11.5].map((x, i) => (
        <Planter key={x} position={[x, 0, 3.1]} scale={0.9 + (i % 2) * 0.15} />
      ))}
      <LowWall from={[2.8, 2.4]} to={[2.8, 7.2]} />
      <LowWall from={[9.2, 2.4]} to={[9.2, 7.2]} />
      <LowWall from={[2.8, 7.2]} to={[9.2, 7.2]} />
      <Pyeongsang position={[5.2, 0, 4.6]} />
      <Tree position={[8.3, 0, 6.5]} scale={0.85} seed={31} fruit />
      <Planter position={[3.5, 0, 6.6]} scale={0.8} />
      {[-10.5, -4.5, 12.6].map((x, i) => (
        <Tree key={x} position={[x, 0, 8 + (i % 2) * 0.6]} scale={0.7} seed={40 + i} />
      ))}
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
      { x0: -13.4, z0: -2.0, x1: 13.4, z1: 1.9 },
      { x0: 3.3, z0: 1.9, x1: 8.7, z1: 3.6 },
      { x0: 3.3, z0: 3.6, x1: 3.9, z1: 6.1 },
      { x0: 6.5, z0: 3.6, x1: 7.7, z1: 6.1 },
      { x0: 3.3, z0: 5.6, x1: 7.7, z1: 6.1 },
    ],
  },
  spawn: { x: -2, z: 0 },
  sky: { top: "#c9dcee", bottom: "#f7f2e8" },
  sun: { position: [-9, 15, 10], color: "#fff0d8", intensity: 2.4 },
  ambient: { sky: "#eef3f9", ground: "#dccfb8", intensity: 1.15 },
  pois: [
    {
      id: "wall",
      at: { x: -6, z: -1.6 },
      radius: 2.2,
      title: { en: "The Jongmyo wall", ko: "종묘 돌담" },
      line: {
        en: "This lane follows the stone wall of Jongmyo, the shrine of the Joseon royal family.",
        ko: "이 골목은 조선 왕실의 사당, 종묘의 돌담을 따라 이어집니다.",
      },
    },
    {
      id: "workshop",
      at: { x: 6, z: -1.6 },
      radius: 2.2,
      title: { en: "Small workshops", ko: "작은 공방" },
      line: {
        en: "Jewelers and craftspeople work in narrow hanok shops. Some leave the window open so you can watch.",
        ko: "좁은 한옥 가게에서 장인들이 일합니다. 창을 열어 두어 작업을 구경할 수 있는 곳도 있어요.",
      },
    },
    {
      id: "pyeongsang",
      at: { x: 5.2, z: 3.3 },
      radius: 1.8,
      title: { en: "A pyeongsang", ko: "평상" },
      line: {
        en: "On warm days neighbors sit on a wooden platform like this to rest and talk. Try the Sit emote.",
        ko: "날이 좋으면 이웃들이 이런 나무 평상에 앉아 쉬며 이야기를 나눠요. 앉기 동작을 해 보세요.",
      },
    },
  ],
  Scene,
};
