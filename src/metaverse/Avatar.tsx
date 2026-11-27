"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { positionAt, WALK_SPEED, RUN_SPEED, type P } from "@/lib/metaverse/path.ts";
import type { Look } from "@/lib/metaverse/look.ts";
import { paletteOf, type Avatar as AvatarLook } from "@/lib/metaverse/outfit.ts";
import { ToonFigure, type Action } from "./toon/ToonFigure";
import { Detail } from "./toon/part";
import styles from "./Metaverse.module.css";

export { WALK_SPEED, RUN_SPEED };
// The toon figure is drawn about 1.15 m tall; in the street it stands a little larger.
const FIGURE_SCALE = 1.35;
// Seats were placed for a taller figure; a seated toon's hips sit lower, so lift it onto the seat.
const SEAT_LIFT = 0.26;
const FULL = { lines: true, shadows: true };
const LIGHT = { lines: false, shadows: false };

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
  speed: number; // metres per second of the current walk; above walking pace is a run
  steerAt: number; // performance.now() of the last joystick or key step (no path while steering)
  // Where to sit when sitting on furniture: a spot off the walkable floor, and its height.
  seat?: { x: number; z: number; y: number } | null;
}

export function newMotion(x: number, z: number, heading = 0): Motion {
  return { x, z, heading, path: null, start: 0, emote: null, emoteAt: 0, sitting: false, speed: WALK_SPEED, steerAt: 0 };
}

type Props = {
  motion: Motion;
  look: Look;
  avatar: AvatarLook;
  name: string;
  type: string | null;
  sameType: boolean;
  isMe: boolean;
  bubble: string | null;
  meLabel?: string; // small badge on your own name tag ("Me" / "나")
  // Where the network last said this person stands; used to settle drift when idle.
  rest?: { x: number; z: number };
  onArrive?: () => void;
  ground?: (x: number, z: number) => number;
  // First-person view: the figure still walks (and reports arriving) but is not drawn.
  hidden?: boolean;
};

const shortestAngle = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** One traveler. Memoized: it only re-renders when its own props change, not on every room update. */
export const Avatar = memo(function Avatar({ motion, look, avatar, name, type, sameType, isMe, bubble, meLabel, rest, onArrive, ground, hidden = false }: Props) {
  const root = useRef<THREE.Group>(null);
  const tag = useRef<HTMLDivElement>(null);
  const seatBlend = useRef(0);
  const camera = useThree((s) => s.camera);
  const facing = useRef(motion.heading);
  const pose = useRef<Action>("idle");
  // Others far from the camera draw without outlines and shadows; your own figure always has them.
  const [near, setNear] = useState(true);
  const nearRef = useRef(true);
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
      const p = positionAt(m.path, (now - m.start) / 1000, m.speed);
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
    if (walking) {
      m.sitting = false;
      m.seat = null;
    }

    const t = (now - m.emoteAt) / 1000;
    if (now - m.steerAt < 150) walking = true;
    const running = m.speed > (WALK_SPEED + RUN_SPEED) / 2;
    let next: Action = walking ? (running ? "run" : "walk") : "idle";
    if (!walking && m.emote) {
      if (m.emote === "wave" && t < 2.6) next = "wave";
      else if (m.emote === "bow" && t < 3) next = "bow";
      else if (m.emote === "hop" && t < 1.1) next = "hop";
      else if (m.emote === "jegi" && t < 4.4) next = "jegi";
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
    if (m.sitting && m.seat) {
      // Slide onto the seat and up to its height.
      const k = 1 - Math.exp(-dt * 6);
      seatBlend.current += (1 - seatBlend.current) * k;
    } else seatBlend.current += (0 - seatBlend.current) * (1 - Math.exp(-dt * 8));
    if (m.seat && seatBlend.current > 0.001) {
      const b = seatBlend.current;
      g.position.x += (m.seat.x - m.x) * b;
      g.position.z += (m.seat.z - m.z) * b;
      g.position.y += (m.seat.y + SEAT_LIFT) * b;
    }
    // Name tags keep one small size and fade out with distance.
    if (tag.current) {
      const d = camera.position.distanceTo(g.position);
      const o = d > 32 ? 0 : d > 22 ? (32 - d) / 10 : 1;
      tag.current.style.opacity = String(o);
      // Switch with a margin so a traveler at the edge does not flicker between the two.
      if (!isMe && (nearRef.current ? d > 16 : d < 13)) {
        nearRef.current = !nearRef.current;
        setNear(nearRef.current);
      }
    }
    facing.current += shortestAngle(facing.current, m.heading) * (1 - Math.exp(-dt * 10));
    g.rotation.y = facing.current;
  });

  return (
    <group ref={root} visible={!hidden}>
      <Detail.Provider value={near ? FULL : LIGHT}>
      <ToonFigure
        scale={FIGURE_SCALE}
        outfit={avatar.outfit}
        hair={avatar.hair}
        palette={paletteOf(avatar)}
        lashes={avatar.gender === "f"}
        look={look}
        actionRef={pose}
      />
      </Detail.Provider>
      {labels && !hidden && (
        <Html position={[0, 1.78, 0]} center pointerEvents="none" zIndexRange={[6, 1]}>
          <div ref={tag} className={styles.tag} data-me={isMe} data-same={sameType}>
            {isMe && meLabel && <span className={styles.tagMe}>{meLabel}</span>}
            <span>{name}</span>
            {type && <span className={styles.tagType}>{type}</span>}
          </div>
        </Html>
      )}
      {labels && !hidden && bubble && (
        <Html position={[0, 2.12, 0]} center pointerEvents="none" zIndexRange={[8, 7]}>
          <div className={styles.bubble}>{bubble}</div>
        </Html>
      )}
    </group>
  );
});

