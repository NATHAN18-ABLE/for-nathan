"use client";

/**
 * Street furniture for city rooms, all made in code and static (so the scene bakes them into a
 * few meshes): utility poles with sagging wires, convex traffic mirrors, flower pots, red rubber
 * basins, scooters, air-conditioner units, rooftop laundry lines and painted signs.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toon, toonWith } from "../toon/material";
import { Ink } from "../toon/part";

type V3 = [number, number, number];

/** Concrete poles and the wires strung between them (and off to the houses). */
export function Poles({ poles, wires }: { poles: V3[]; wires: [V3, V3][] }) {
  const wireGeo = useMemo(() => {
    const parts = wires.map(([a, b]) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const mid = A.clone().lerp(B, 0.5);
      mid.y -= A.distanceTo(B) * 0.06; // sag
      return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, mid, B), 16, 0.018, 4, false);
    });
    const g = parts.length ? mergeGeometries(parts, false) : null;
    parts.forEach((p) => p.dispose());
    return g;
  }, [wires]);
  return (
    <group>
      {poles.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 4, 0]} material={toon("#b9b4ab")} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 8, 8]} />
            <Ink />
          </mesh>
          <mesh position={[0, 7.4, 0]} material={toon("#8f8a82")}>
            <boxGeometry args={[1.4, 0.1, 0.1]} />
          </mesh>
          {i % 3 === 0 && (
            <mesh position={[0.25, 6.6, 0]} material={toon("#7d8a93")} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.7, 10]} />
              <Ink />
            </mesh>
          )}
        </group>
      ))}
      {wireGeo && <mesh geometry={wireGeo} material={toon("#2f3238")} />}
    </group>
  );
}

/** An orange-framed convex mirror on a pole, at a blind corner. */
export function CornerMirror({ position, facing = 0 }: { position: V3; facing?: number }) {
  return (
    <group position={position} rotation={[0, facing, 0]}>
      <mesh position={[0, 1.4, 0]} material={toon("#d9692c")} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 6]} />
        <Ink />
      </mesh>
      <mesh position={[0, 2.9, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={toon("#e0702e")}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 20]} />
        <Ink />
      </mesh>
      <mesh position={[0, 2.9, 0.17]} scale={[1, 1, 0.3]} material={toon("#cfe0ea")}>
        <sphereGeometry args={[0.36, 16, 10]} />
      </mesh>
    </group>
  );
}

/** A clay pot with a round green shrub. */
export function Pot({ position, size = 1 }: { position: V3; size?: number }) {
  return (
    <group position={position} scale={size}>
      <mesh position={[0, 0.2, 0]} material={toon("#b8693f")} castShadow>
        <cylinderGeometry args={[0.24, 0.18, 0.4, 12]} />
        <Ink />
      </mesh>
      <mesh position={[0, 0.58, 0]} scale={[1, 0.85, 1]} material={toon("#5f9a55")} castShadow>
        <icosahedronGeometry args={[0.34, 1]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** The red rubber basin (고무대야) every Seoul alley has, sometimes with greens growing in it. */
export function Basin({ position, greens = false }: { position: V3; greens?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} material={toon("#c8372f")} castShadow>
        <cylinderGeometry args={[0.42, 0.34, 0.32, 16]} />
        <Ink />
      </mesh>
      {greens && (
        <mesh position={[0, 0.36, 0]} scale={[1, 0.4, 1]} material={toon("#6ea85a")}>
          <icosahedronGeometry args={[0.36, 1]} />
        </mesh>
      )}
    </group>
  );
}

/** A delivery scooter. */
export function Scooter({ position, rotation = 0, color = "#e8e3d8" }: { position: V3; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[0, 0.25, z]} rotation={[0, 0, Math.PI / 2]} material={toon("#2b2d33")}>
          <torusGeometry args={[0.2, 0.07, 8, 16]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -0.1]} material={toon(color)} castShadow>
        <boxGeometry args={[0.38, 0.32, 1.1]} />
        <Ink />
      </mesh>
      <mesh position={[0, 0.82, -0.28]} material={toon("#2b2d33")}>
        <boxGeometry args={[0.3, 0.12, 0.5]} />
      </mesh>
      <mesh position={[0, 0.95, 0.5]} material={toon("#8f949c")}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
      </mesh>
      <mesh position={[0, 1.4, 0.52]} rotation={[0, 0, Math.PI / 2]} material={toon("#2b2d33")}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
      </mesh>
      <mesh position={[0, 0.85, -0.7]} material={toon("#c8463c")} castShadow>
        <boxGeometry args={[0.42, 0.4, 0.4]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** An air-conditioner unit on a wall bracket; `facing` turns its grille outward. */
export function AcUnit({ position, facing }: { position: V3; facing: number }) {
  return (
    <group position={position} rotation={[0, facing, 0]}>
      <mesh material={toon("#e6e4df")} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.32]} />
        <Ink />
      </mesh>
      <mesh position={[0.1, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]} material={toon("#8e9298")}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
      </mesh>
    </group>
  );
}

/** A laundry line between two poles on a roof, with a few shirts and towels. */
export function LaundryLine({ position, rotation = 0, length = 3 }: { position: V3; rotation?: number; length?: number }) {
  const cloth = ["#f4f1ea", "#7aa5d6", "#e8b04a", "#e57a7c"];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-length / 2, length / 2].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]} material={toon("#8f949c")}>
          <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} material={toon("#d8d4cc")}>
        <cylinderGeometry args={[0.012, 0.012, length, 4]} />
      </mesh>
      {[-0.9, -0.2, 0.55].map((x, i) => (
        <mesh key={x} position={[x * (length / 3), 1.25, 0]} material={toonWith({ color: cloth[i % cloth.length], side: THREE.DoubleSide, key: `cloth-${cloth[i % cloth.length]}` })} castShadow>
          <planeGeometry args={[0.55, 0.6]} />
        </mesh>
      ))}
    </group>
  );
}

const signs = new Map<string, THREE.MeshToonMaterial>();
/** A painted signboard material: Korean shop words on a coloured board. */
export function signMaterial(text: string, bg: string, fg = "#fbf8f1", vertical = false) {
  const key = `${text}|${bg}|${fg}|${vertical}`;
  let m = signs.get(key);
  if (m) return m;
  const c = document.createElement("canvas");
  c.width = vertical ? 128 : 512;
  c.height = vertical ? 512 : 160;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = fg;
  g.lineWidth = 8;
  g.strokeRect(10, 10, c.width - 20, c.height - 20);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  if (vertical) {
    const chars = [...text];
    const size = Math.min(92, 440 / chars.length);
    g.font = `700 ${size}px ${font}`;
    chars.forEach((ch, i) => g.fillText(ch, 64, 256 + (i - (chars.length - 1) / 2) * size * 1.1));
  } else {
    g.font = `700 ${Math.min(96, 900 / [...text].length)}px ${font}`;
    g.fillText(text, 256, 84);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  m = toonWith({ color: "#ffffff", map: tex, key: `sign|${key}` });
  signs.set(key, m);
  return m;
}

/** A signboard: flat on a wall, or a vertical blade sticking out of it. */
export function Sign({ position, rotation = 0, text, color, vertical = false }: { position: V3; rotation?: number; text: string; color: string; vertical?: boolean }) {
  const mats = useMemo(() => {
    const face = signMaterial(text, color, "#fbf8f1", vertical);
    const edge = toon(color);
    return vertical ? [edge, edge, edge, edge, face, face] : [edge, edge, edge, edge, face, edge];
  }, [text, color, vertical]);
  return (
    <mesh position={position} rotation={[0, rotation, 0]} material={mats} castShadow>
      <boxGeometry args={vertical ? [0.12, 1.6, 0.5] : [2.2, 0.68, 0.1]} />
    </mesh>
  );
}
