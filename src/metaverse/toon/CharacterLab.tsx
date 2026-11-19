"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { ToonFigure, PALETTES, type Action, type Outfit, type Hair, type Variant } from "./ToonFigure";
import styles from "./CharacterLab.module.css";

const ACTIONS: { id: Action; ko: string }[] = [
  { id: "idle", ko: "가만히" },
  { id: "walk", ko: "걷기" },
  { id: "wave", ko: "손 흔들기" },
  { id: "bow", ko: "인사" },
  { id: "sit", ko: "앉기" },
  { id: "hop", ko: "점프" },
];

const CAST: { outfit: Outfit; hair: Hair; palette: number }[] = [
  { outfit: "chima", hair: "bun", palette: 0 },
  { outfit: "baji", hair: "short", palette: 1 },
  { outfit: "hoodie", hair: "bob", palette: 2 },
];

/** Not linked from the site: a place to compare the two figure proportions side by side. */
export function CharacterLab() {
  const [action, setAction] = useState<Action>("idle");
  const [variant, setVariant] = useState<Variant | "both">("both");
  const rows: Variant[] = variant === "both" ? ["cozy", "sporty"] : [variant];
  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <h1>캐릭터 시안</h1>
        <div className={styles.group} role="group" aria-label="시안">
          {(["both", "cozy", "sporty"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={variant === v} onClick={() => setVariant(v)}>
              {v === "both" ? "A·B 같이" : v === "cozy" ? "A 아늑한 생활형" : "B 스포티형"}
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
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.25, 4.3], fov: 30 }}>
          <color attach="background" args={["#efe9df"]} />
          <hemisphereLight args={["#fff7ea", "#d8c9b8", 1.5]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[2.5, 4, 3]} intensity={1.9} castShadow shadow-mapSize={[1024, 1024]} />
          {rows.map((v, ri) =>
            CAST.map((c, ci) => (
              <ToonFigure
                key={`${v}-${ci}`}
                variant={v}
                outfit={c.outfit}
                hair={c.hair}
                palette={PALETTES[c.palette]}
                action={action}
                seed={ri * 3 + ci}
                position={[(ci - 1) * 0.95 + (rows.length > 1 ? (ri === 0 ? -0.2 : 0.2) : 0), 0, rows.length > 1 ? (ri === 0 ? 0.35 : -0.6) : 0]}
                rotation={[0, (ci - 1) * -0.25, 0]}
              />
            )),
          )}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.6, 64]} />
            <meshToonMaterial color="#f6f1e8" />
          </mesh>
          <ContactShadows position={[0, 0.002, 0]} opacity={0.35} scale={6} blur={2.4} far={1.4} />
          <OrbitControls target={[0, 0.55, 0]} enablePan={false} minDistance={2} maxDistance={7} />
        </Canvas>
      </div>
      <p className={styles.note}>위: A 아늑한 생활형 · 아래: B 스포티형 · 왼쪽부터 한복(치마), 한복(바지·두루마기풍), 후드티. 드래그해서 돌려 볼 수 있습니다.</p>
    </div>
  );
}
