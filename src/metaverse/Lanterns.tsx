"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LANTERN_COLORS, RACK, lanternSpot } from "@/lib/metaverse/lanterns.ts";
import type { Lantern } from "@/lib/metaverse/realtime.ts";

/** Paper lanterns on the wall rack; a newly hung one rises into place and lights up. */
export function LanternRack({ lanterns, fresh }: { lanterns: Lantern[]; fresh: number }) {
  return (
    <group>
      {/* ropes */}
      {Array.from({ length: RACK.rows }, (_, r) => (
        <mesh key={r} position={[RACK.x, RACK.yTop - r * RACK.rowGap, (RACK.z0 + RACK.z1) / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, RACK.z1 - RACK.z0 + 0.6, 6]} />
          <meshStandardMaterial color="#5b4636" />
        </mesh>
      ))}
      {lanterns.map((l, i) => (
        <PaperLantern key={i} index={i} color={LANTERN_COLORS[l.color] ?? LANTERN_COLORS[0]} isNew={i === fresh} />
      ))}
    </group>
  );
}

function PaperLantern({ index, color, isNew }: { index: number; color: string; isNew: boolean }) {
  const spot = lanternSpot(index);
  const g = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshStandardMaterial>(null);
  const born = useRef(isNew ? performance.now() : 0);
  const sway = useRef(index * 1.7);
  useFrame((_, dt) => {
    sway.current += dt;
    const t = born.current ? Math.min(1, (performance.now() - born.current) / 1600) : 1;
    const e = 1 - Math.pow(1 - t, 3);
    if (g.current) {
      g.current.position.set(spot.x, spot.y - 0.9 * (1 - e), spot.z);
      g.current.rotation.x = Math.sin(sway.current * 1.3) * 0.05;
      g.current.scale.setScalar(0.6 + 0.4 * e);
    }
    if (body.current) body.current.emissiveIntensity = 0.4 + 1.2 * e + Math.sin(sway.current * 3) * 0.05;
  });
  return (
    <group ref={g} position={[spot.x, spot.y, spot.z]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
        <meshStandardMaterial color="#5b4636" />
      </mesh>
      <mesh scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.13, 14, 10]} />
        <meshStandardMaterial ref={body} color={color} emissive="#ffb36b" emissiveIntensity={1.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 10]} />
        <meshStandardMaterial color="#2f2a26" />
      </mesh>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.07, 0.05, 0.04, 10]} />
        <meshStandardMaterial color="#2f2a26" />
      </mesh>
    </group>
  );
}
