"use client";

// A jeweller's bench set out in front of a workshop. When someone watches, the hammer
// rises and falls in rhythm; each strike rings and throws a few sparks.

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { asset } from "@/lib/base-path.ts";
import { prepareFigure } from "./Avatar";
import { on } from "./bus";
import { tap } from "./sound";
import { TexBox } from "./world";

const STRIKES = 9;
const BEAT = 0.42; // seconds between strikes

/** The craftsperson: the traveler figure seated on a stool behind the bench. */
function Maker() {
  const gltf = useGLTF(asset("/metaverse/chars/traveler-a.glb"));
  const { scene, mixer } = useMemo(() => {
    const scene = cloneSkinned(gltf.scene);
    prepareFigure(scene);
    const mixer = new THREE.AnimationMixer(scene);
    const sit = gltf.animations.find((c) => c.name === "Chair_Sit_Idle_F");
    if (sit) mixer.clipAction(sit).play();
    return { scene, mixer };
  }, [gltf]);
  useEffect(() => () => void mixer.stopAllAction(), [mixer]);
  useFrame((_, dt) => mixer.update(Math.min(dt, 0.05) * 0.5));
  return <primitive object={scene} position={[0, 0.12, -0.75]} />;
}

export function Workshop({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const arm = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const sparks = useRef<THREE.InstancedMesh>(null);
  const start = useRef(-1);
  const struck = useRef(0);
  const STRIKE = 1.36;
  const parts = useMemo(() => Array.from({ length: 24 }, () => ({ v: new THREE.Vector3(), p: new THREE.Vector3(), life: 0 })), []);
  const o = useMemo(() => new THREE.Object3D(), []);

  useEffect(
    () =>
      on("workshop", () => {
        start.current = performance.now();
        struck.current = 0;
      }),
    [],
  );

  useFrame((state, dt) => {
    const t = start.current < 0 ? -1 : (performance.now() - start.current) / 1000;
    const active = t >= 0 && t < STRIKES * BEAT + 0.4;
    // Hammer angle about its hinge: 0 is upright, STRIKE rests the head on the anvil.
    const STRIKE = 1.36;
    let angle = STRIKE;
    if (active) {
      const ph = (t % BEAT) / BEAT;
      if (ph < 0.55) angle = STRIKE - 1.15 * Math.sin((ph / 0.55) * (Math.PI / 2)); // lift
      else if (ph < 0.72) angle = 0.21 + (STRIKE - 0.21) * ((ph - 0.55) / 0.17) ** 2; // fall
      const n = Math.floor(t / BEAT);
      if (n >= struck.current && n < STRIKES && ph >= 0.72) {
        struck.current = n + 1;
        tap();
        for (const s of parts)
          if (s.life <= 0 && Math.random() < 0.45) {
            s.life = 0.35 + Math.random() * 0.35;
            s.p.set(0, 0.9, 0.05);
            s.v.set((Math.random() - 0.5) * 1.6, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 1.6);
          }
      }
    }
    if (arm.current) arm.current.rotation.x = active ? angle : arm.current.rotation.x + (STRIKE - arm.current.rotation.x) * (1 - Math.exp(-dt * 4));
    if (glow.current) glow.current.emissiveIntensity = active ? 1.6 + Math.sin(state.clock.elapsedTime * 9) * 0.3 : 0.7;
    const m = sparks.current;
    if (!m) return;
    parts.forEach((s, i) => {
      if (s.life > 0) {
        s.life -= dt;
        s.v.y -= 4 * dt;
        s.p.addScaledVector(s.v, dt);
      }
      o.position.copy(s.p);
      o.scale.setScalar(s.life > 0 ? 0.02 : 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={1.25}>
      <TexBox size={[0.45, 0.42, 0.45]} position={[0, 0.21, -0.78]} name="wood" tile={0.8} />
      <Suspense fallback={null}>
        <Maker />
      </Suspense>
      {/* bench */}
      <TexBox size={[1.5, 0.08, 0.7]} position={[0, 0.78, 0]} name="wood" tile={0.8} />
      {[-0.65, 0.65].map((x) => (
        <TexBox key={x} size={[0.08, 0.76, 0.6]} position={[x, 0.38, 0]} name="wood" tile={0.8} />
      ))}
      {/* small anvil and a ring being shaped */}
      <mesh position={[0, 0.85, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.08, 0.12]} />
        <meshStandardMaterial color="#3b3e44" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.9, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.008, 8, 20]} />
        <meshStandardMaterial ref={glow} color="#f2d38a" emissive="#ffb14d" emissiveIntensity={0.7} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* hammer on a hinge at the back of the bench */}
      <group ref={arm} position={[0.02, 0.92, -0.22]} rotation={[1.36, 0, 0]}>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
          <meshStandardMaterial color="#7a5a3c" />
        </mesh>
        <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.11, 10]} />
          <meshStandardMaterial color="#5b5f66" metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
      {/* a work lamp */}
      <mesh position={[0.55, 1.15, -0.15]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#fff2d6" emissive="#ffcf8a" emissiveIntensity={1.4} />
      </mesh>
      <instancedMesh ref={sparks} args={[undefined, undefined, parts.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffb04a" emissiveIntensity={4} />
      </instancedMesh>
    </group>
  );
}
