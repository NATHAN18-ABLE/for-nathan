"use client";

/**
 * Things a traveler can carry or wear, drawn in the same toon style as the figure: a
 * cheongsachorong lantern on a short pole, a taegeuk fan, a norigae tassel, a lucky pouch,
 * a scarf, and a flower or maple-leaf pin. Each is built around its own pin point; the figure
 * decides where that point sits on the body.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { toon, toonMapped } from "./material";
import { Part, Ink } from "./part";

const RED = "#c8413a";
const BLUE = "#2f4f9e";
const GOLD = "#e2b44e";
const WOOD = "#8a5a36";
const JADE = "#8fc4ac";

const lathe = (pts: [number, number][], segments = 28) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments, Math.PI);

// The lantern's red silk glows: it is unlit, so it reads as light even in shade.
let glow: THREE.MeshBasicMaterial | null = null;
const glowMaterial = () => (glow ??= new THREE.MeshBasicMaterial({ color: "#ff7a52" }));

/** Cheongsachorong: red silk between blue bands, hanging from a short pole held in the hand. */
export function Lantern({ moving }: { moving: boolean }) {
  const swing = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 6);
  const body = useMemo(() => lathe([[0, -0.06], [0.05, -0.058], [0.062, -0.02], [0.062, 0.03], [0.05, 0.062], [0, 0.064]]), []);
  useFrame((_, dt) => {
    t.current += Math.min(dt, 0.05);
    if (swing.current) swing.current.rotation.x = Math.sin(t.current * (moving ? 7 : 1.7)) * (moving ? 0.16 : 0.05);
  });
  return (
    <group>
      {/* the pole, from the fist forward and a little up */}
      <Part color={WOOD} position={[0, 0.025, 0.09]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.21, 8]} />
      </Part>
      <group ref={swing} position={[0, 0.06, 0.19]}>
        <Part color={GOLD} line={false} position={[0, -0.03, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.06, 6]} />
        </Part>
        <group position={[0, -0.13, 0]}>
          <Part color={BLUE} position={[0, 0.072, 0]}>
            <cylinderGeometry args={[0.04, 0.056, 0.026, 20]} />
          </Part>
          <mesh geometry={body} material={glowMaterial()}>
            <Ink />
          </mesh>
          <Part color={BLUE} position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.054, 0.042, 0.024, 20]} />
          </Part>
          <Part color={RED} position={[0, -0.105, 0]}>
            <coneGeometry args={[0.016, 0.05, 10]} />
          </Part>
        </group>
      </group>
    </group>
  );
}

// The taegeuk: red above, blue below, turning into each other.
let fanFace: THREE.MeshToonMaterial | null = null;
function fanMaterial() {
  if (fanFace) return fanFace;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const disc = (x: number, y: number, r: number, color: string, from = 0, to = Math.PI * 2) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, r, from, to);
    g.fill();
  };
  g.fillStyle = "#f3e6c8";
  g.fillRect(0, 0, 256, 256);
  disc(128, 128, 112, BLUE);
  disc(128, 128, 112, RED, Math.PI, Math.PI * 2);
  disc(72, 128, 56, RED);
  disc(184, 128, 56, BLUE);
  g.strokeStyle = "#f3e6c8";
  g.lineWidth = 14;
  g.beginPath();
  g.arc(128, 128, 116, 0, Math.PI * 2);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  fanFace = toonMapped(tex);
  return fanFace;
}

/** Taegeukseon: a round fan on a wooden handle, fanned gently while standing. */
export function TaegeukFan({ moving }: { moving: boolean }) {
  const face = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * 6);
  const materials = useMemo(() => [toon("#f3e6c8"), fanMaterial(), fanMaterial()], []);
  useFrame((_, dt) => {
    t.current += Math.min(dt, 0.05);
    if (face.current) face.current.rotation.y = moving ? 0 : Math.sin(t.current * 5) * 0.35;
  });
  return (
    <group ref={face} rotation={[0, 0, 0.2]}>
      <Part color={WOOD} position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.008, 0.009, 0.1, 8]} />
      </Part>
      <mesh material={materials} position={[0, 0.17, 0.004]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.008, 40]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** Norigae: a knot, a jade piece and a long silk tassel. */
export function Norigae() {
  const tassel = useMemo(() => lathe([[0, -0.15], [0.026, -0.15], [0.02, -0.08], [0.008, -0.03], [0.006, 0], [0, 0.004]], 16), []);
  return (
    <group>
      <Part color={RED} scale={[1, 0.8, 0.7]}>
        <sphereGeometry args={[0.018, 12, 10]} />
      </Part>
      <Part color={JADE} position={[0, -0.04, 0]} scale={[1, 1.15, 0.5]}>
        <sphereGeometry args={[0.022, 16, 12]} />
      </Part>
      <Part color={GOLD} line={false} position={[0, -0.066, 0]}>
        <sphereGeometry args={[0.007, 8, 6]} />
      </Part>
      <Part color={RED} geometry={tassel} position={[0, -0.068, 0]} />
    </group>
  );
}

/** Bokjumeoni: a round lucky pouch, cinched with a gold cord. */
export function Pouch() {
  const bag = useMemo(
    () => lathe([[0, -0.1], [0.03, -0.098], [0.052, -0.075], [0.056, -0.05], [0.042, -0.025], [0.02, -0.012], [0.03, 0], [0.024, 0.008], [0, 0.006]]),
    [],
  );
  return (
    <group rotation={[0, 0, 0]}>
      <Part color={RED} geometry={bag} scale={[1, 1, 0.78]} />
      <Part color={GOLD} position={[0, -0.014, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.021, 0.004, 6, 20]} />
      </Part>
      {/* a gold medallion on the front */}
      <Part color={GOLD} line={false} position={[0, -0.058, 0.043]} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.004, 18]} />
      </Part>
    </group>
  );
}

/** A soft knitted scarf around the neck, its ends falling to one side. */
export function Scarf({ color, neckR }: { color: string; neckR: number }) {
  return (
    <group>
      <Part color={color} rotation={[Math.PI / 2 + 0.2, 0, 0]} scale={[1, 1, 0.85]}>
        <torusGeometry args={[neckR, 0.034, 12, 36]} />
      </Part>
      <Part color={color} position={[-0.05, -0.075, neckR * 0.95]} rotation={[-0.25, 0, 0.12]} scale={[1, 1, 0.45]}>
        <capsuleGeometry args={[0.03, 0.1, 4, 12]} />
      </Part>
      <Part color={color} position={[-0.02, -0.055, neckR * 0.98]} rotation={[-0.2, 0, -0.08]} scale={[1, 1, 0.45]}>
        <capsuleGeometry args={[0.028, 0.06, 4, 12]} />
      </Part>
    </group>
  );
}

/** A five-petal flower pin. */
export function FlowerPin() {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <Part key={i} color="#f4a3b8" position={[Math.cos(a) * 0.026, Math.sin(a) * 0.026, 0]} scale={[1, 1, 0.45]}>
            <sphereGeometry args={[0.021, 12, 10]} />
          </Part>
        );
      })}
      <Part color={GOLD} position={[0, 0, 0.008]}>
        <sphereGeometry args={[0.014, 12, 10]} />
      </Part>
    </group>
  );
}

/** A maple leaf pin: five pointed lobes, cut from a flat shape. */
export function MaplePin() {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const n = 5;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      // lobes fan upward; the bottom gap leaves room for the stem
      const a = Math.PI / 2 + ((i - 2) / 2) * 1.2;
      const tip = i === 2 ? 0.07 : i === 1 || i === 3 ? 0.062 : 0.045;
      pts.push([Math.cos(a - 0.22) * 0.024, Math.sin(a - 0.22) * 0.024]);
      pts.push([Math.cos(a) * tip, Math.sin(a) * tip]);
      pts.push([Math.cos(a + 0.22) * 0.024, Math.sin(a + 0.22) * 0.024]);
    }
    s.moveTo(0, -0.012);
    for (const [x, y] of pts.reverse()) s.lineTo(x, y);
    s.lineTo(0, -0.012);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 });
    g.translate(0, -0.012, 0);
    return g;
  }, []);
  return (
    <group>
      <Part color="#dd5a30" geometry={geo} />
      <Part color={WOOD} position={[0, -0.04, 0.003]} line={false}>
        <cylinderGeometry args={[0.003, 0.003, 0.04, 6]} />
      </Part>
    </group>
  );
}
