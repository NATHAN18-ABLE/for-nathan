"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LANTERN_COLORS, RACK, lanternSpot, ropeY } from "@/lib/metaverse/lanterns.ts";
import type { Lantern } from "@/lib/metaverse/realtime.ts";

/** Paper lanterns on the wall rack; a newly hung one rises into place and lights up. */
export function LanternRack({ lanterns, fresh }: { lanterns: Lantern[]; fresh: number }) {
  return (
    <group>
      {Array.from({ length: RACK.rows }, (_, r) => (
        <Rope key={r} row={r} />
      ))}
      {lanterns.map((l, i) => (
        <PaperLantern key={i} index={i} color={LANTERN_COLORS[l.color] ?? LANTERN_COLORS[0]} isNew={i === fresh} />
      ))}
    </group>
  );
}

/** A rope that sags between the posts. */
function Rope({ row }: { row: number }) {
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const [z0, , z1] = [RACK.posts[0], RACK.posts[1], RACK.posts[RACK.posts.length - 1]];
    for (let i = 0; i <= 80; i++) {
      const z = z0 + ((z1 - z0) * i) / 80;
      pts.push(new THREE.Vector3(RACK.x, ropeY(row, z), z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.018, 5, false);
  }, [row]);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#6b5240" roughness={0.9} />
    </mesh>
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
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 4]} />
        <meshStandardMaterial color="#5b4636" />
      </mesh>
      <mesh scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshStandardMaterial ref={body} color={color} emissive="#ffb36b" emissiveIntensity={1.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.05, 10]} />
        <meshStandardMaterial color="#2f2a26" />
      </mesh>
      <mesh position={[0, -0.21, 0]}>
        <cylinderGeometry args={[0.09, 0.06, 0.05, 10]} />
        <meshStandardMaterial color="#2f2a26" />
      </mesh>
    </group>
  );
}
