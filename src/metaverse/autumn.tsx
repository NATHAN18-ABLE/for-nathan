"use client";

// Autumn touches: leaves drifting down around the traveler and fallen leaves on the ground.

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rand, heightAt, type Hill } from "./world";
import type { Motion } from "./Avatar";

const LEAF_COLORS = ["#d24a2a", "#e0782f", "#e9a73a", "#c93b30", "#b95a2c", "#e8c14b"];

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.06);
  s.quadraticCurveTo(0.06, -0.01, 0, 0.07);
  s.quadraticCurveTo(-0.06, -0.01, 0, -0.06);
  return new THREE.ShapeGeometry(s);
}

/** Leaves falling in a box that follows the traveler; recycled when they land. */
export function FallingLeaves({ motions, meId, count = 140 }: { motions: React.RefObject<Map<string, Motion>>; meId: string; count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(leafGeometry, []);
  const leaves = useMemo(() => {
    const r = rand(5);
    return Array.from({ length: count }, () => ({ x: (r() - 0.5) * 30, y: r() * 9, z: (r() - 0.5) * 30, spin: r() * 6, speed: 0.4 + r() * 0.5, phase: r() * 6 }));
  }, [count]);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    const r = rand(9);
    for (let i = 0; i < count; i++) ref.current?.setColorAt(i, c.set(LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)]));
    if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, dt) => {
    const m = motions.current?.get(meId);
    const mesh = ref.current;
    if (!m || !mesh) return;
    const t = state.clock.elapsedTime;
    leaves.forEach((l, i) => {
      l.y -= l.speed * dt;
      if (l.y < 0) {
        l.y = 8 + Math.random() * 2;
        l.x = m.x + (Math.random() - 0.5) * 30;
        l.z = m.z + (Math.random() - 0.5) * 30;
      }
      o.position.set(l.x + Math.sin(t * 0.9 + l.phase) * 0.6, l.y, l.z + Math.cos(t * 0.7 + l.phase) * 0.4);
      o.rotation.set(t * l.speed * 2 + l.spin, t * 0.8 + l.phase, Math.sin(t + l.phase) * 0.8);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geom, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
    </instancedMesh>
  );
}

/** Fallen leaves scattered in drifts along kerbs and under trees. */
export function LeafLitter({ spots, hills = [], seed = 3 }: { spots: { x: number; z: number; r: number; n: number }[]; hills?: Hill[]; seed?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(leafGeometry, []);
  const items = useMemo(() => {
    const r = rand(seed);
    return spots.flatMap((s) =>
      Array.from({ length: s.n }, () => {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * s.r;
        return { x: s.x + Math.cos(a) * d, z: s.z + Math.sin(a) * d, rot: r() * Math.PI * 2, c: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)], s: 0.8 + r() * 0.6 };
      }),
    );
  }, [spots, seed]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.x, heightAt(it.x, it.z, hills) + 0.025, it.z);
      o.rotation.set(-Math.PI / 2, 0, it.rot);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, hills]);
  return (
    <instancedMesh ref={ref} args={[geom, undefined, items.length]} receiveShadow>
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.9} />
    </instancedMesh>
  );
}
