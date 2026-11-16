"use client";

// Code-made accessories pinned to the traveler's body. They follow the bones' positions
// but keep their own upright orientation, so a hand lantern hangs straight down.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ITEMS, SCARF_COLORS, type Look } from "@/lib/metaverse/look.ts";

const RED = "#c23b32";
const GOLD = "#e0b24a";
const BLUE = "#2f4f9e";

function Lantern() {
  return (
    <group>
      <mesh position={[0, -0.02, 0.12]} rotation={[Math.PI / 2.4, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
      <group position={[0, -0.2, 0.24]}>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.07, 0.075, 0.035, 14]} />
          <meshStandardMaterial color={BLUE} roughness={0.6} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.075, 0.075, 0.17, 14]} />
          <meshStandardMaterial color={RED} emissive="#ff9a4a" emissiveIntensity={1.6} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.075, 0.07, 0.035, 14]} />
          <meshStandardMaterial color={BLUE} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Fan() {
  return (
    <group position={[0, 0.06, 0.06]} rotation={[0.2, 0, 0]}>
      <mesh position={[0, 0.07, 0]}>
        <circleGeometry args={[0.13, 20, 0, Math.PI]} />
        <meshStandardMaterial color={RED} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.07, 0.002]}>
        <circleGeometry args={[0.13, 20, Math.PI * 0.5, Math.PI * 0.5]} />
        <meshStandardMaterial color={BLUE} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
    </group>
  );
}

function Norigae() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.04, 0.035, 0.012]} />
        <meshStandardMaterial color="#6fae8f" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <coneGeometry args={[0.022, 0.1, 8, 1, true]} />
        <meshStandardMaterial color={RED} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Pouch() {
  return (
    <group>
      <mesh scale={[1, 0.85, 0.7]}>
        <sphereGeometry args={[0.06, 14, 10]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.03, 0.008, 6, 14]} />
        <meshStandardMaterial color={GOLD} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Scarf({ color }: { color: string }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.045, 10, 24]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.06, -0.12, 0.1]} rotation={[0.15, 0, -0.15]}>
        <boxGeometry args={[0.07, 0.2, 0.025]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Flower() {
  const petals = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {petals.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.028, Math.sin(a) * 0.028, 0]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial color="#f0a3b4" roughness={0.6} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color={GOLD} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Maple() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const pts = 10;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 ? 0.025 : 0.06;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    return s;
  }, []);
  return (
    <mesh rotation={[0, Math.PI / 2, 0.3]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#d2462c" side={THREE.DoubleSide} roughness={0.6} />
    </mesh>
  );
}

// Where each body spot sits relative to its bone, in the figure's own space (it faces +z).
const SPOTS = {
  hand: { bone: "RightHand", offset: [0, -0.02, 0.02] },
  fanHand: { bone: "LeftHand", offset: [0, 0, 0.02] },
  neck: { bone: "neck", offset: [0, 0.02, 0.01] },
  hip: { bone: "Hips", offset: [0.2, -0.06, 0.08] },
  head: { bone: "Head", offset: [0.2, 0.2, 0.04] },
} as const;

export function Wearables({ scene, look }: { scene: THREE.Object3D; look: Look }) {
  const holder = useRef<THREE.Group>(null);
  const groups = useRef<Record<string, THREE.Group | null>>({});
  const bones = useMemo(() => {
    const out: Record<string, THREE.Object3D | undefined> = {};
    for (const s of Object.values(SPOTS)) out[s.bone] = scene.getObjectByName(s.bone);
    return out;
  }, [scene]);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const h = holder.current;
    if (!h) return;
    for (const [key, spot] of Object.entries(SPOTS)) {
      const g = groups.current[key];
      const bone = bones[spot.bone];
      if (!g || !bone) continue;
      bone.getWorldPosition(v);
      h.worldToLocal(v);
      g.position.set(v.x + spot.offset[0], v.y + spot.offset[1], v.z + spot.offset[2]);
    }
  });

  const has = (id: string) => look.items.includes(id as never);
  const set = (key: string) => (g: THREE.Group | null) => {
    groups.current[key] = g;
  };
  return (
    <group ref={holder}>
      <group ref={set("hand")}>{has("lantern") && <Lantern />}</group>
      <group ref={set("fanHand")}>{has("fan") && <Fan />}</group>
      <group ref={set("neck")}>{has("scarf") && <Scarf color={SCARF_COLORS[look.scarf] ?? SCARF_COLORS[0]} />}</group>
      <group ref={set("hip")}>
        {has("norigae") && <Norigae />}
        {has("pouch") && <Pouch />}
      </group>
      <group ref={set("head")}>
        {has("flower") && <Flower />}
        {has("maple") && <Maple />}
      </group>
    </group>
  );
}

export const ITEM_LIST = ITEMS;
