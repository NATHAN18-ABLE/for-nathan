"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { positionAt, type P } from "@/lib/metaverse/path.ts";
import { GLAZE, OUTFITS, glaze } from "./glaze";
import styles from "./Metaverse.module.css";

export const WALK_SPEED = 2.2; // metres per second

/** Mutable per-person motion, written by the network and read every frame. */
export interface Motion {
  x: number;
  z: number;
  heading: number;
  path: P[] | null;
  start: number; // performance.now() when the current path began
  emote: string | null;
  emoteAt: number;
  sitting: boolean;
}

export function newMotion(x: number, z: number, heading = 0): Motion {
  return { x, z, heading, path: null, start: 0, emote: null, emoteAt: 0, sitting: false };
}

type Props = {
  motion: Motion;
  outfit: number;
  hat: number;
  name: string;
  type: string | null;
  sameType: boolean;
  isMe: boolean;
  bubble: string | null;
  // Where the network last said this person stands; used to settle drift when idle.
  rest?: { x: number; z: number };
  onArrive?: () => void;
};

const shortestAngle = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export function Avatar({ motion, outfit, hat, name, type, sameType, isMe, bubble, rest, onArrive }: Props) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const facing = useRef(motion.heading);
  const walkPhase = useRef(0);
  // Labels attach to the canvas's parent, which may not exist on the very first frame.
  const [labels, setLabels] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLabels(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useFrame((_, dt) => {
    const m = motion;
    const now = performance.now();
    let walking = false;
    if (m.path) {
      const p = positionAt(m.path, (now - m.start) / 1000, WALK_SPEED);
      m.x = p.x;
      m.z = p.z;
      m.heading = p.heading;
      walking = !p.done;
      if (p.done) {
        m.path = null;
        onArrive?.();
      }
    } else if (rest && !isMe) {
      // Gently settle onto the last reported spot (covers missed messages).
      const k = 1 - Math.exp(-dt * 3);
      m.x += (rest.x - m.x) * k;
      m.z += (rest.z - m.z) * k;
    }
    if (walking) m.sitting = false;

    const g = root.current;
    const b = body.current;
    if (!g || !b) return;
    g.position.set(m.x, 0, m.z);
    facing.current += shortestAngle(facing.current, m.heading) * (1 - Math.exp(-dt * 10));
    g.rotation.y = facing.current;

    // Walking: a small bob and sway; standing: a slow breath.
    walkPhase.current += dt * (walking ? 11 : 1.6);
    const ph = walkPhase.current;
    let y = walking ? Math.abs(Math.sin(ph)) * 0.07 : Math.sin(ph) * 0.008;
    let tilt = walking ? Math.sin(ph) * 0.05 : 0;
    let pitch = 0;
    let rArm = walking ? Math.sin(ph) * 0.5 : 0;
    let lArm = walking ? -Math.sin(ph) * 0.5 : 0;

    const t = (now - m.emoteAt) / 1000;
    if (m.emote && !walking) {
      if (m.emote === "wave" && t < 1.8) {
        rArm = -2.6 + Math.sin(t * 12) * 0.35;
      } else if (m.emote === "bow" && t < 1.6) {
        pitch = Math.sin(Math.min(1, t / 1.6) * Math.PI) * 0.55;
      } else if (m.emote === "hop" && t < 1.1) {
        y = Math.abs(Math.sin(t * Math.PI * 2)) * 0.35;
        rArm = lArm = -0.9 * Math.abs(Math.sin(t * Math.PI * 2));
      } else if (m.emote === "sit") {
        m.sitting = true;
        m.emote = null;
      } else if (t > 2) {
        m.emote = null;
      }
    }
    if (m.sitting) {
      y = -0.24;
      rArm = lArm = -0.4;
    }
    b.position.y = y;
    b.rotation.z = tilt;
    b.rotation.x = pitch;
    if (armR.current) armR.current.rotation.x = rArm;
    if (armL.current) armL.current.rotation.x = lArm;
  });

  const cloth = glaze(OUTFITS[outfit % OUTFITS.length], { gloss: 0.8 });
  const skin = glaze(GLAZE.white, { gloss: 0.9 });
  const dark = glaze(GLAZE.ink, { gloss: 0.9 });

  return (
    <group ref={root}>
      <group ref={body}>
        {/* feet */}
        <mesh position={[-0.11, 0.07, 0.04]} castShadow material={dark} scale={[1, 0.7, 1.3]}>
          <sphereGeometry args={[0.09, 14, 10]} />
        </mesh>
        <mesh position={[0.11, 0.07, 0.04]} castShadow material={dark} scale={[1, 0.7, 1.3]}>
          <sphereGeometry args={[0.09, 14, 10]} />
        </mesh>
        {/* body: a rounded glazed figure, coloured like a garment */}
        <mesh position={[0, 0.5, 0]} castShadow material={cloth}>
          <capsuleGeometry args={[0.27, 0.3, 8, 20]} />
        </mesh>
        <mesh position={[0, 0.74, 0]} material={skin}>
          <torusGeometry args={[0.17, 0.035, 10, 24]} />
        </mesh>
        {/* arms hang from the shoulders and swing */}
        <group ref={armR} position={[0.31, 0.72, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow material={cloth}>
            <capsuleGeometry args={[0.065, 0.2, 6, 12]} />
          </mesh>
        </group>
        <group ref={armL} position={[-0.31, 0.72, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow material={cloth}>
            <capsuleGeometry args={[0.065, 0.2, 6, 12]} />
          </mesh>
        </group>
        {/* head: white porcelain, two quiet dots for eyes */}
        <mesh position={[0, 1.08, 0]} castShadow material={skin}>
          <sphereGeometry args={[0.27, 28, 22]} />
        </mesh>
        <mesh position={[-0.085, 1.1, 0.245]} material={dark}>
          <sphereGeometry args={[0.024, 10, 8]} />
        </mesh>
        <mesh position={[0.085, 1.1, 0.245]} material={dark}>
          <sphereGeometry args={[0.024, 10, 8]} />
        </mesh>
        {hat === 1 && (
          <group position={[0, 1.24, 0]}>
            <mesh material={cloth} castShadow>
              <sphereGeometry args={[0.235, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.01, 0.02]} material={cloth}>
              <cylinderGeometry args={[0.32, 0.32, 0.025, 24]} />
            </mesh>
          </group>
        )}
        {labels && (
        <Html position={[0, 1.62, 0]} center distanceFactor={11} pointerEvents="none" zIndexRange={[20, 0]}>
          <div className={styles.tag} data-me={isMe} data-same={sameType}>
            <span>{name}</span>
            {type && <span className={styles.tagType}>{type}</span>}
          </div>
        </Html>
        )}
        {labels && bubble && (
          <Html position={[0, 2.05, 0]} center distanceFactor={11} pointerEvents="none" zIndexRange={[30, 21]}>
            <div className={styles.bubble}>{bubble}</div>
          </Html>
        )}
      </group>
    </group>
  );
}
