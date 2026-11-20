"use client";

import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ToonFigure, PALETTES, type Action, type Outfit, type Hair } from "./ToonFigure";
import styles from "./CharacterLab.module.css";

const ACTIONS: { id: Action; ko: string }[] = [
  { id: "idle", ko: "가만히" },
  { id: "walk", ko: "걷기" },
  { id: "wave", ko: "손 흔들기" },
  { id: "bow", ko: "인사" },
  { id: "sit", ko: "앉기" },
  { id: "hop", ko: "점프" },
];

const CAST: { outfit: Outfit; hair: Hair; palette: number; lashes?: boolean }[] = [
  { outfit: "chima", hair: "bun", palette: 0, lashes: true },
  { outfit: "baji", hair: "short", palette: 1 },
  { outfit: "hoodie", hair: "bob", palette: 2 },
];

type View = "all" | "close" | "back";
const VIEWS: Record<View, { pos: [number, number, number]; target: [number, number, number] }> = {
  all: { pos: [0, 1.15, 4.1], target: [0, 0.55, 0] },
  close: { pos: [0, 0.98, 2.2], target: [0, 0.78, 0] },
  back: { pos: [-2.4, 1.2, -3.2], target: [0, 0.6, 0] },
};

function Camera({ view }: { view: View }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(...VIEWS[view].pos);
  }, [camera, view]);
  return <OrbitControls key={view} target={VIEWS[view].target} enablePan={false} minDistance={1.4} maxDistance={7} />;
}

/** Not linked from the site: a place to check the figures before they move into the world. */
export function CharacterLab() {
  const [action, setAction] = useState<Action>("idle");
  const [view, setView] = useState<View>("all");
  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <h1>캐릭터 시안</h1>
        <div className={styles.group} role="group" aria-label="보기">
          {(["all", "close", "back"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "all" ? "전신" : v === "close" ? "가까이" : "뒤에서"}
            </button>
          ))}
        </div>
        <div className={styles.group} role="group" aria-label="동작">
          {ACTIONS.map((a) => (
            <button key={a.id} type="button" aria-pressed={action === a.id} onClick={() => setAction(a.id)}>
              {a.ko}
            </button>
          ))}
        </div>
      </header>
      <div className={styles.stage}>
        <Canvas flat shadows dpr={[1, 2]} camera={{ position: VIEWS.all.pos, fov: 30 }}>
          <color attach="background" args={["#efe8dc"]} />
          <hemisphereLight args={["#fff6e8", "#d9c8b6", 1.05]} />
          <directionalLight position={[1.6, 2.6, 4.2]} intensity={2.1} color="#fff3e2" castShadow shadow-mapSize={[1024, 1024]} />
          {CAST.map((c, i) => (
            <ToonFigure
              key={i}
              outfit={c.outfit}
              hair={c.hair}
              palette={PALETTES[c.palette]}
              lashes={c.lashes}
              action={action}
              seed={i}
              position={[(i - 1) * 0.82, 0, i === 1 ? -0.15 : 0]}
              rotation={[0, (i - 1) * -0.28, 0]}
            />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.6, 64]} />
            <shadowMaterial opacity={0.12} />
          </mesh>
          <ContactShadows position={[0, 0.002, 0]} opacity={0.3} scale={6} blur={2.2} far={1.2} />
          <Camera view={view} />
        </Canvas>
      </div>
      <p className={styles.note}>왼쪽부터 한복(치마·저고리), 한복(바지·조끼), 후드티. 드래그해서 돌려 볼 수 있습니다.</p>
    </div>
  );
}
