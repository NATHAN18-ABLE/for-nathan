"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { positionAt, type P } from "@/lib/metaverse/path.ts";
import { asset } from "@/lib/base-path.ts";
import { Wearables } from "./Wearables";
import type { Look } from "@/lib/metaverse/look.ts";
import styles from "./Metaverse.module.css";

export const WALK_SPEED = 1.8; // metres per second, matched to the walk cycle below
const MODEL = "/metaverse/chars/traveler-a.glb";
const CLIP = {
  walk: "Casual_Walk",
  idle: "Idle",
  wave: "Big_Wave_Hello",
  bow: "Formal_Bow",
  sit: "Chair_Sit_Idle_F",
} as const;

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
  look: Look;
  name: string;
  type: string | null;
  sameType: boolean;
  isMe: boolean;
  bubble: string | null;
  // Where the network last said this person stands; used to settle drift when idle.
  rest?: { x: number; z: number };
  onArrive?: () => void;
  ground?: (x: number, z: number) => number;
};

const shortestAngle = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/**
 * The generated idle shifts its weight a lot. Keep only its calmest stretch: measure how
 * far the bones turn in each tenth of a second and loop the quietest two seconds back and forth.
 */
function calmIdle(clip: THREE.AnimationClip, span = 2): THREE.AnimationClip {
  const bins = Math.ceil(clip.duration * 10);
  const energy = new Float32Array(bins);
  const q0 = new THREE.Quaternion();
  const q1 = new THREE.Quaternion();
  for (const track of clip.tracks) {
    if (!track.name.endsWith(".quaternion")) continue;
    const { times, values } = track;
    for (let i = 1; i < times.length; i++) {
      q0.fromArray(values, (i - 1) * 4);
      q1.fromArray(values, i * 4);
      const bin = Math.min(bins - 1, Math.floor(times[i] * 10));
      energy[bin] += q0.angleTo(q1);
    }
  }
  const w = Math.max(1, Math.round(span * 10));
  let best = 0;
  let bestSum = Infinity;
  for (let i = 0; i + w <= bins; i++) {
    let sum = 0;
    for (let k = i; k < i + w; k++) sum += energy[k];
    if (sum < bestSum) (bestSum = sum), (best = i);
  }
  const fps = 30;
  return THREE.AnimationUtils.subclip(clip, "IdleCalm", Math.round((best / 10) * fps), Math.round(((best + w) / 10) * fps), fps);
}

type Pose = "walk" | "idle" | "wave" | "bow" | "sit";

/** The rigged traveler figure, with its own copy of the skeleton and a mixer. */
function Figure({ pose, hop, look }: { pose: React.RefObject<Pose>; hop: React.RefObject<number>; look: Look }) {
  const gltf = useGLTF(asset(MODEL));
  const { scene, mixer, actions } = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = false;
      }
    });
    const mixer = new THREE.AnimationMixer(scene);
    const actions = Object.fromEntries(
      (Object.keys(CLIP) as Pose[]).map((k) => {
        const found = gltf.animations.find((c) => c.name === CLIP[k]);
        const clip = found && k === "idle" ? calmIdle(found) : found;
        const a = clip ? mixer.clipAction(clip) : null;
        if (a && k === "idle") a.setLoop(THREE.LoopPingPong, Infinity);
        if (a && (k === "wave" || k === "bow")) {
          a.setLoop(THREE.LoopOnce, 1);
          a.clampWhenFinished = true;
        }
        return [k, a];
      }),
    ) as Record<Pose, THREE.AnimationAction | null>;
    return { scene, mixer, actions };
  }, [gltf]);

  const current = useRef<Pose | null>(null);
  const holder = useRef<THREE.Group>(null);

  useEffect(() => () => void mixer.stopAllAction(), [mixer]);

  useFrame((_, dt) => {
    const next = pose.current ?? "idle";
    if (next !== current.current) {
      const from = current.current ? actions[current.current] : null;
      const to = actions[next];
      if (to) {
        to.reset();
        to.setEffectiveWeight(1);
        to.timeScale = next === "walk" ? 1.35 : next === "idle" ? 0.6 : 1;
        to.play();
        if (from && from !== to) from.crossFadeTo(to, 0.25, false);
      }
      current.current = next;
    }
    mixer.update(Math.min(dt, 0.05));
    if (holder.current) holder.current.position.y = hop.current ?? 0;
  });

  return (
    <group ref={holder}>
      <primitive object={scene} />
      <Wearables scene={scene} look={look} />
    </group>
  );
}

export function Avatar({ motion, look, name, type, sameType, isMe, bubble, rest, onArrive, ground }: Props) {
  const root = useRef<THREE.Group>(null);
  const facing = useRef(motion.heading);
  const pose = useRef<Pose>("idle");
  const hop = useRef(0);
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

    const t = (now - m.emoteAt) / 1000;
    hop.current = 0;
    let next: Pose = walking ? "walk" : "idle";
    if (!walking && m.emote) {
      if (m.emote === "wave" && t < 2.6) next = "wave";
      else if (m.emote === "bow" && t < 3) next = "bow";
      else if (m.emote === "hop" && t < 1.1) hop.current = Math.abs(Math.sin(t * Math.PI * 2)) * 0.32;
      else if (m.emote === "sit") {
        m.sitting = true;
        m.emote = null;
      } else if (t > 3) m.emote = null;
    }
    if (m.sitting && !walking) next = "sit";
    pose.current = next;

    const g = root.current;
    if (!g) return;
    g.position.set(m.x, ground ? ground(m.x, m.z) : 0, m.z);
    facing.current += shortestAngle(facing.current, m.heading) * (1 - Math.exp(-dt * 10));
    g.rotation.y = facing.current;
  });

  return (
    <group ref={root}>
      <Suspense fallback={null}>
        <Figure pose={pose} hop={hop} look={look} />
      </Suspense>
      {labels && (
        <Html position={[0, 1.5, 0]} center distanceFactor={7} pointerEvents="none" zIndexRange={[6, 1]}>
          <div className={styles.tag} data-me={isMe} data-same={sameType}>
            <span>{name}</span>
            {type && <span className={styles.tagType}>{type}</span>}
          </div>
        </Html>
      )}
      {labels && bubble && (
        <Html position={[0, 1.95, 0]} center distanceFactor={7} pointerEvents="none" zIndexRange={[8, 7]}>
          <div className={styles.bubble}>{bubble}</div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(asset(MODEL));
