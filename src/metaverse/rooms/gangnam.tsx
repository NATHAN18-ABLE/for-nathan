"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Boardwalk, CityView, Forest, GableRoof, Mountains, TexBox, rand, worldBox, type Hill, type TreeSpot } from "../world";
import { toon, toonVertex, toonWith } from "../toon/material";
import { Ink, Part } from "../toon/part";
import { StreetLight, towerMaterial } from "./props";
import type { RoomConfig } from "../types";

// Samseong-dong on an autumn night, about 120 m x 120 m and flat. Yeongdong-daero runs east-west
// through the middle (x). North of it: the plaza in front of COEX with the Gangnam Style statue,
// Starfield Library under its glass roof, and a corner tower wrapped in a giant wave screen.
// South of it: the gate of Bongeunsa and the temple grounds, lotus lanterns lit overhead and the
// great stone Maitreya Buddha. A crosswalk joins the two; cars and buses keep to the lights.

const HILLS: Hill[] = [];
const LIFT = 0.05;

const ROAD = { z0: -8, z1: 8 };
const CROSS = { x0: -4, z0: -8, x1: 4, z1: 8 };
const LIBRARY = { x0: -12, z0: -62, x1: 12, z1: -34 };
const RECTS = [
  { x0: -60, z0: 8, x1: 60, z1: 16 }, // south sidewalk
  CROSS, // the crosswalk
  { x0: -60, z0: -16, x1: 60, z1: -8 }, // north sidewalk
  { x0: -30, z0: -34, x1: 30, z1: -16 }, // COEX plaza
  { x0: -4, z0: -36, x1: 4, z1: -34 }, // library doors
  { x0: -9.6, z0: -60.4, x1: 9.6, z1: -36 }, // inside the library, clear of the wall shelves
  { x0: -3, z0: 16, x1: 3, z1: 22 }, // through the temple gate
  { x0: -26, z0: 22, x1: 26, z1: 42.5 }, // temple courtyard
  { x0: -26, z0: 42.5, x1: -9.2, z1: 58 }, // round the main hall's terrace
  { x0: 9.2, z0: 42.5, x1: 26, z1: 58 },
];
const PAVED = RECTS.filter((r) => r !== CROSS);

const STATUE = { x: -18, z: -25 };
const SCREEN = { x0: 32, z0: -36, x1: 52, z1: -16 }; // the corner tower with the wave screen
const HALL = { x: 0, z: 49 };
const BUDDHA = { x: 18, z: 50 };
const TABLE = { x: 0, z: -40 };

// Towers around the plaza: glass, lit from inside.
const TOWERS: { x0: number; z0: number; x1: number; z1: number; h: number; glass: string }[] = [
  { x0: -60, z0: -64, x1: -40, z1: -42, h: 104, glass: "#8fa3c4" }, // the trade tower
  { x0: 38, z0: -64, x1: 58, z1: -44, h: 82, glass: "#9fb0c8" },
  { x0: -58, z0: -36, x1: -38, z1: -20, h: 56, glass: "#a7b4c6" },
  { x0: -30, z0: -64, x1: -14, z1: -36, h: 14, glass: "#b8c2d0" }, // COEX mall, west of the library
  { x0: 14, z0: -64, x1: 30, z1: -36, h: 14, glass: "#b8c2d0" }, // and east
  { x0: 62, z0: 18, x1: 82, z1: 40, h: 48, glass: "#94a6bf" },
  { x0: -82, z0: 18, x1: -62, z1: 38, h: 40, glass: "#a2b0c4" },
];

const TREES: TreeSpot[] = (() => {
  const r = rand(41);
  const out: TreeSpot[] = [];
  for (let x = -56; x <= 56; x += 8) {
    if (Math.abs(x) < 8) continue;
    // keep the line of sight from the road to the statue and the wave screen clear
    const open = Math.abs(x - STATUE.x) < 7 || (x > SCREEN.x0 - 4 && x < SCREEN.x1 + 4);
    if (!open) out.push({ x, z: -16.8, s: 0.75, kind: "ginkgo" });
    out.push({ x, z: 16.8, s: 0.75, kind: "ginkgo" });
  }
  // the temple's pines and maples, round its edges
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const x = Math.cos(a) * (28 + r() * 8), z = 40 + Math.sin(a) * (20 + r() * 6);
    if (z < 21) continue;
    out.push({ x, z, s: 0.9 + r() * 0.4, kind: r() < 0.6 ? "pine" : "maple" });
  }
  return out;
})();

const LIGHTS: [number, number, number][] = [];
for (let x = -54; x <= 54; x += 12) LIGHTS.push([x, -8.6, Math.PI], [x + 6, 8.6, 0]);

const HOLES = [
  { x: STATUE.x, z: STATUE.z, r: 3.1 },
  { x: TABLE.x, z: TABLE.z, r: 1.6 },
  ...[-4.5, 4.5].flatMap((x) => [-54.6, -52, -49.4].map((z) => ({ x, z, r: 1.35 }))), // the free-standing shelves
  { x: BUDDHA.x, z: BUDDHA.z, r: 3.2 },
  ...[-2.6, 2.6].map((x) => ({ x, z: 19, r: 0.35 })), // gate posts
  ...LIGHTS.map(([x, z]) => ({ x, z, r: 0.3 })),
  ...TREES.filter((t) => Math.abs(t.z) < 20).map((t) => ({ x: t.x, z: t.z, r: 0.5 })),
];

/** A glass tower lit from inside, with a slim crown. */
function Tower({ t, i }: { t: (typeof TOWERS)[number]; i: number }) {
  const w = t.x1 - t.x0, d = t.z1 - t.z0;
  const geo = useMemo(() => worldBox(w, t.h, d), [w, d, t.h]);
  return (
    <group>
      <mesh geometry={geo} material={towerMaterial(t.glass, i)} position={[(t.x0 + t.x1) / 2, t.h / 2, (t.z0 + t.z1) / 2]} castShadow userData={{ solid: true }}>
        <Ink />
      </mesh>
      <mesh position={[(t.x0 + t.x1) / 2, t.h + 1.2, (t.z0 + t.z1) / 2]} material={toon("#5d6573")}>
        <boxGeometry args={[w * 0.7, 2.4, d * 0.7]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** The road: dark asphalt, white lane lines, a zebra crossing and stop lines. */
function Road() {
  const marks = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let x = -90; x < 90; x += 6) {
      if (x > -7 && x < 6) continue;
      for (const z of [-4, 4]) parts.push(new THREE.BoxGeometry(3, 0.02, 0.15).translate(x + 1.5, 0.03, z));
    }
    for (const z of [-0.12, 0.12]) parts.push(new THREE.BoxGeometry(180, 0.02, 0.12).translate(0, 0.03, z)); // centre lines
    for (let z = ROAD.z0 + 0.6; z < ROAD.z1 - 0.4; z += 1.1) parts.push(new THREE.BoxGeometry(7.6, 0.025, 0.6).translate(0, 0.035, z + 0.3)); // zebra
    parts.push(new THREE.BoxGeometry(0.35, 0.02, 8).translate(-5.2, 0.03, 4), new THREE.BoxGeometry(0.35, 0.02, 8).translate(5.2, 0.03, -4)); // stop lines
    const g = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());
    return g;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={toon("#3b3e47")} receiveShadow>
        <planeGeometry args={[200, ROAD.z1 - ROAD.z0]} />
      </mesh>
      <mesh geometry={marks} material={toon("#eceae4")} />
      {/* kerbs */}
      {[ROAD.z0, ROAD.z1].map((z) => (
        <mesh key={z} position={[0, 0.08, z]} material={toon("#b5b1aa")}>
          <boxGeometry args={[200, 0.16, 0.3]} />
        </mesh>
      ))}
    </group>
  );
}

/** Two crossed bronze wrists doing the horse-riding dance, on a dark stone base. */
function GangnamStyle() {
  const bronze = "#c08a45";
  return (
    <group position={[STATUE.x, 0, STATUE.z]}>
      <TexBox size={[4.6, 0.8, 4.6]} position={[0, 0.4, 0]} name="granite" tile={1.5} tint="#8d8c94" />
      {/* two forearms rising from the base and crossing at the wrists, fists up */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.1, 0.8, side * 0.25]} rotation={[0, 0, side * 0.36]}>
          <Part color={bronze} position={[0, 2.9, 0]} userData={{ solid: true }}>
            <capsuleGeometry args={[0.72, 4.4, 8, 16]} />
          </Part>
          <Part color={bronze} position={[0, 6, 0]} scale={[1.15, 1.25, 1]} userData={{ solid: true }}>
            <sphereGeometry args={[1.05, 22, 16]} />
          </Part>
          {/* the thumb over the knuckles */}
          <Part color={bronze} position={[side * -0.5, 6.4, 0.75]} rotation={[0, 0, side * 0.6]}>
            <capsuleGeometry args={[0.28, 0.8, 6, 10]} />
          </Part>
        </group>
      ))}
    </group>
  );
}

/** Starfield Library: glass walls, a glass roof, and shelves of books rising to it. */
function Library() {
  const L = LIBRARY;
  const H = 16;
  const glass = useMemo(() => toonWith({ color: "#bcd3f0", key: "glass" }), []);
  useEffect(() => {
    glass.transparent = true;
    glass.opacity = 0.28;
    glass.depthWrite = false;
  }, [glass]);
  const w = L.x1 - L.x0, d = L.z1 - L.z0;
  const cx = (L.x0 + L.x1) / 2, cz = (L.z0 + L.z1) / 2;
  return (
    <group>
      {/* glass walls on three sides and the front, with a doorway */}
      <mesh position={[L.x0, H / 2, cz]} material={glass} userData={{ solid: true }}>
        <boxGeometry args={[0.2, H, d]} />
      </mesh>
      <mesh position={[L.x1, H / 2, cz]} material={glass} userData={{ solid: true }}>
        <boxGeometry args={[0.2, H, d]} />
      </mesh>
      <mesh position={[cx, H / 2, L.z0]} material={glass} userData={{ solid: true }}>
        <boxGeometry args={[w, H, 0.2]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (4 + (w / 2 - 4) / 2), H / 2, L.z1]} material={glass} userData={{ solid: true }}>
          <boxGeometry args={[w / 2 - 4, H, 0.2]} />
        </mesh>
      ))}
      <mesh position={[0, H - 3, L.z1]} material={glass}>
        <boxGeometry args={[8, 6, 0.2]} />
      </mesh>
      {/* frame: posts and the roof grid */}
      {[L.x0, L.x0 + w / 3, L.x0 + (2 * w) / 3, L.x1].flatMap((x) =>
        [L.z0, L.z1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, H / 2, z]} material={toon("#d9dde4")}>
            <boxGeometry args={[0.35, H, 0.35]} />
            <Ink />
          </mesh>
        )),
      )}
      <mesh position={[cx, H, cz]} material={glass}>
        <boxGeometry args={[w, 0.15, d]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <mesh key={k} position={[cx, H + 0.1, L.z0 + (d / 6) * k]} material={toon("#d9dde4")}>
          <boxGeometry args={[w, 0.3, 0.25]} />
          <Ink />
        </mesh>
      ))}
      {/* the great shelves: along both side walls and two standing in the middle */}
      <TexBox size={[1.4, 13, d - 4]} position={[L.x0 + 1, 6.5, cz]} name="books" tile={3.2} />
      <TexBox size={[1.4, 13, d - 4]} position={[L.x1 - 1, 6.5, cz]} name="books" tile={3.2} />
      {[-4.5, 4.5].map((x) => (
        <TexBox key={x} size={[2, 13, 7]} position={[x, 6.5, -52]} name="books" tile={3.2} />
      ))}
      {/* a long reading table with stools */}
      <group position={[TABLE.x, 0, TABLE.z]}>
        <TexBox size={[4, 0.1, 1.2]} position={[0, 0.76, 0]} name="wood" tile={1} tint="#e8d9c2" />
        {[-1.6, 1.6].map((x) => (
          <TexBox key={x} size={[0.12, 0.74, 1]} position={[x, 0.37, 0]} name="wood" tile={1} tint="#c9b8a0" />
        ))}
        {[-1.2, 0, 1.2].flatMap((x) =>
          [-0.95, 0.95].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.23, z]} material={toon("#4a6fa8")}>
              <cylinderGeometry args={[0.2, 0.18, 0.46, 12]} />
              <Ink />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

/** The corner tower whose wrap-around screen shows a wave rolling as if it might break out. */
function WaveTower() {
  const S = SCREEN;
  const h = 34;
  const w = S.x1 - S.x0, d = S.z1 - S.z0;
  const geo = useMemo(() => worldBox(w, h, d), [w, d]);
  return (
    <mesh geometry={geo} material={towerMaterial("#7f8ea6", 5)} position={[(S.x0 + S.x1) / 2, h / 2, (S.z0 + S.z1) / 2]} castShadow userData={{ solid: true }}>
      <Ink />
    </mesh>
  );
}

/** The screen itself, redrawn a few times a second: deep blue water, a curling wave, foam. */
function WaveScreen() {
  const S = SCREEN;
  const { tex, mat } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, fog: false });
    return { tex: t, mat: m };
  }, []);
  const last = useRef(0);
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (time - last.current < 0.08) return;
    last.current = time;
    const c = tex.image as HTMLCanvasElement;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#0b2a6b");
    grad.addColorStop(1, "#1aa4d8");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 256);
    // three rolling crests, the front one rising and curling
    for (let k = 0; k < 3; k++) {
      const phase = (time * 0.35 + k / 3) % 1;
      const y = 230 - phase * 170;
      g.fillStyle = `rgba(${170 + k * 20}, ${225}, 255, ${0.35 + phase * 0.5})`;
      g.beginPath();
      g.moveTo(0, 256);
      for (let x = 0; x <= 512; x += 8) g.lineTo(x, y + Math.sin(x / 40 + time * 2 + k) * (10 + phase * 26));
      g.lineTo(512, 256);
      g.fill();
      g.strokeStyle = `rgba(255,255,255,${0.4 + phase * 0.6})`;
      g.lineWidth = 3 + phase * 5;
      g.beginPath();
      for (let x = 0; x <= 512; x += 8) g.lineTo(x, y + Math.sin(x / 40 + time * 2 + k) * (10 + phase * 26));
      g.stroke();
    }
    tex.needsUpdate = true;
  });
  return (
    <group>
      {/* on the tower's west face (towards the plaza) and its south face (towards the road) */}
      <mesh position={[S.x0 - 0.06, 15, (S.z0 + S.z1) / 2]} rotation={[0, -Math.PI / 2, 0]} material={mat}>
        <planeGeometry args={[S.z1 - S.z0 - 2, 16]} />
      </mesh>
      <mesh position={[(S.x0 + S.x1) / 2, 15, S.z1 + 0.06]} material={mat}>
        <planeGeometry args={[S.x1 - S.x0 - 2, 16]} />
      </mesh>
    </group>
  );
}

/** Bongeunsa: the gate, the main hall on its stone terrace, and the standing Maitreya. */
function Temple() {
  const red = "#a8382c";
  const green = "#3f7d6b";
  return (
    <group>
      {/* low tiled walls either side of the gate */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <TexBox size={[34, 2.2, 0.8]} position={[s * 21, 1.1, 20.4]} name="plaster" tile={2} tint="#ece4d6" />
          <TexBox size={[34.4, 0.35, 1.3]} position={[s * 21, 2.4, 20.4]} name="roof" tile={1.4} />
        </group>
      ))}
      {/* Jinyeomun, the gate */}
      <group position={[0, 0, 19]}>
        {[-2.6, 2.6].flatMap((x) =>
          [-1.2, 1.2].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 2.2, z]} material={toon(red)} castShadow>
              <cylinderGeometry args={[0.22, 0.24, 4.4, 12]} />
              <Ink />
            </mesh>
          )),
        )}
        <mesh position={[0, 4.6, 0]} material={toon(green)}>
          <boxGeometry args={[6.4, 0.5, 3]} />
          <Ink />
        </mesh>
        <GableRoof length={9} depth={6} height={1.6} position={[0, 4.85, 0]} lift={0.55} />
      </group>
      {/* the main hall */}
      <group position={[HALL.x, 0, HALL.z]}>
        <TexBox size={[16, 1.4, 11]} position={[0, 0.7, 0]} name="granite" tile={1.4} tint="#d9d2c4" />
        {[-6, -2, 2, 6].map((x) => (
          <mesh key={x} position={[x, 3.6, -4]} material={toon(red)} castShadow>
            <cylinderGeometry args={[0.3, 0.32, 4.4, 12]} />
            <Ink />
          </mesh>
        ))}
        <TexBox size={[13.5, 4.4, 7.5]} position={[0, 3.6, 0.6]} name="plaster" tile={2} tint="#e9d9b8" />
        <mesh position={[0, 6.1, -4]} material={toon(green)}>
          <boxGeometry args={[14.5, 0.7, 0.6]} />
          <Ink />
        </mesh>
        <GableRoof length={19} depth={14} height={3.2} position={[0, 6.3, 0]} lift={0.8} sag={0.3} />
      </group>
      <Maitreya />
    </group>
  );
}

/** The Maitreya Buddha: a tall stone figure on a lotus base, gazing over the city. */
function Maitreya() {
  const robe = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, 0],
          [2.2, 0],
          [2.1, 3],
          [1.9, 8],
          [1.95, 12],
          [1.7, 14.5],
          [0.9, 15.4],
          [0, 15.6],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        32,
      ),
    [],
  );
  const stone = "#d6d1c6";
  return (
    <group position={[BUDDHA.x, 0, BUDDHA.z]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.6, 0]} material={toon("#c9c2b4")} castShadow>
        <cylinderGeometry args={[3, 3.2, 1.2, 24]} />
        <Ink />
      </mesh>
      <mesh position={[0, 1.6, 0]} material={toon("#e3c7c0")} castShadow>
        <cylinderGeometry args={[2.6, 2.4, 0.9, 16]} />
        <Ink />
      </mesh>
      <mesh geometry={robe} position={[0, 2, 0]} material={toon(stone)} castShadow>
        <Ink />
      </mesh>
      <mesh position={[0, 19.2, 0]} material={toon(stone)} castShadow>
        <sphereGeometry args={[1.6, 24, 18]} />
        <Ink />
      </mesh>
      <mesh position={[0, 20.9, 0]} material={toon(stone)}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <Ink />
      </mesh>
      {/* hands: one raised, one held low */}
      <mesh position={[1.6, 11, -1.4]} material={toon(stone)}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <Ink />
      </mesh>
      <mesh position={[-1.5, 7.5, -1.5]} material={toon(stone)}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <Ink />
      </mesh>
    </group>
  );
}

/** Rows of lotus lanterns strung over the temple courtyard, glowing at night. */
function LotusLanterns() {
  const geos = useMemo(() => {
    const colors = ["#f29bb3", "#f6d26b", "#8fd0a8", "#f6f1e7"];
    const byColor = colors.map(() => [] as THREE.BufferGeometry[]);
    const wires: THREE.BufferGeometry[] = [];
    const r = rand(77);
    for (let z = 26; z <= 40; z += 3.5) {
      // high enough to walk and look under
      const A = new THREE.Vector3(-22, 7.6, z), B = new THREE.Vector3(22, 7.6, z);
      const mid = A.clone().lerp(B, 0.5);
      mid.y -= 1;
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      wires.push(new THREE.TubeGeometry(curve, 24, 0.015, 4, false));
      for (let k = 1; k < 22; k++) {
        const p = curve.getPoint(k / 22);
        const g = new THREE.SphereGeometry(0.26, 10, 8);
        g.scale(1, 0.85, 1);
        g.translate(p.x, p.y - 0.45, p.z);
        byColor[Math.floor(r() * colors.length)].push(g);
      }
    }
    return {
      colors,
      lanterns: byColor.map((list) => mergeGeometries(list, false)!),
      wire: mergeGeometries(wires, false)!,
    };
  }, []);
  return (
    <group>
      <mesh geometry={geos.wire} material={toon("#3a3438")} />
      {geos.lanterns.map((g, i) => (
        <mesh key={i} geometry={g} material={toonWith({ color: geos.colors[i], emissive: geos.colors[i], emissiveIntensity: 0.85, key: `lotus-${i}` })} />
      ))}
    </group>
  );
}

function Scene() {
  return (
    <group>
      <Mountains radius={300} color="#2a3150" />
      <CityView from={[-220, -220]} to={[220, -90]} seed={21} />
      <CityView from={[-220, 80]} to={[220, 220]} seed={22} />
      {/* the pavement under everything off the road */}
      <Boardwalk rects={[{ x0: -100, z0: -100, x1: 100, z1: -8 }, { x0: -100, z0: 8, x1: 100, z1: 100 }]} hills={HILLS} lift={0.02} paving={{ name: "granite", tile: 2, tint: "#a9a6ae" }} />
      <Boardwalk rects={PAVED} hills={HILLS} lift={LIFT} paving={{ name: "granite", tile: 1.2, tint: "#c9c4c2" }} />
      <Road />
      {TOWERS.map((t, i) => (
        <Tower key={i} t={t} i={i} />
      ))}
      <WaveTower />
      <Library />
      <GangnamStyle />
      <Temple />
      <LotusLanterns />
      {LIGHTS.map(([x, z, f], i) => (
        <StreetLight key={i} position={[x, 0, z]} facing={f} />
      ))}
      <Forest trees={TREES} hills={HILLS} seed={3} />
    </group>
  );
}

/* ---------- traffic ---------- */

/** One car (or bus) as a single mesh: body, cabin, dark windows and wheels, coloured per vertex. */
function vehicleGeometry(bus: boolean, color: string) {
  const parts: [THREE.BufferGeometry, string][] = [];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, c: string) => parts.push([new THREE.BoxGeometry(w, h, d).translate(x, y, z), c]);
  if (bus) {
    box(2.5, 2.6, 11, 0, 1.75, 0, "#3f9a5e");
    box(2.54, 0.9, 10.2, 0, 2.2, 0, "#253040"); // window band
    box(2.52, 0.35, 11.02, 0, 0.75, 0, "#2f7a4a");
  } else {
    box(1.8, 0.7, 4.3, 0, 0.65, 0, color);
    box(1.6, 0.6, 2.3, 0, 1.25, -0.2, color);
    box(1.64, 0.42, 2.0, 0, 1.25, -0.2, "#253040"); // windows
  }
  const len = bus ? 11 : 4.3;
  for (const z of [-len * 0.33, len * 0.33])
    for (const x of [-0.92, 0.92]) parts.push([new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14).rotateZ(Math.PI / 2).translate(bus ? x * 1.3 : x, 0.38, z), "#1f2126"]);
  const coloured = parts.map(([g, c]) => {
    const flat = g.index ? g.toNonIndexed() : g;
    const col = new THREE.Color(c);
    const n = flat.getAttribute("position").count;
    const arr = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) arr.set([col.r, col.g, col.b], k * 3);
    flat.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    flat.deleteAttribute("uv");
    return flat;
  });
  const out = mergeGeometries(coloured, false)!;
  coloured.forEach((g) => g.dispose());
  return out;
}

const LANES = [
  { z: -6, dir: -1 },
  { z: -2.6, dir: -1 },
  { z: 2.6, dir: 1 },
  { z: 6, dir: 1 },
];
const CYCLE = 22; // seconds: cars go for 14, then stop for 8 while people cross

/** Cars and buses on Yeongdong-daero, stopping at the crossing when its light is red for them. */
function Traffic() {
  const cars = useMemo(() => {
    const r = rand(9);
    return LANES.flatMap((lane, li) =>
      Array.from({ length: 4 }, (_, k) => ({
        lane: li,
        offset: k * 45 + r() * 12,
        speed: 9 + r() * 4,
        bus: r() < 0.2,
        color: ["#f2f0ea", "#2b2f38", "#c8463c", "#3e5aa8", "#9aa3ad"][Math.floor(r() * 5)],
      })),
    ).map((c) => ({ ...c, geo: vehicleGeometry(c.bus, c.color) })
    );
  }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const lights = useRef<(THREE.Mesh | null)[]>([]);
  const signals = useMemo(() => ["#3be07a", "#ff4b3e"].map((c, k) => toonWith({ color: c, emissive: c, emissiveIntensity: 0.05, key: `signal-${k}` })), []);
  // Distance travelled along the lane (0..200, the lane runs from -100 to 100 in its direction).
  const pos = useMemo(() => cars.map((c) => c.offset), [cars]);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const red = state.clock.elapsedTime % CYCLE > 14; // red for cars, green for people
    LANES.forEach((lane, li) => {
      // front car first; each one keeps a gap behind the car ahead
      const order = cars.map((_, i) => i).filter((i) => cars[i].lane === li).sort((a, b) => pos[b] - pos[a]);
      let rear = Infinity;
      for (const i of order) {
        const c = cars[i];
        const len = c.bus ? 11 : 4.3;
        let along = pos[i] - 100 + c.speed * d;
        // at a red light, stop before the stop line (6 m short of the middle) if not past it yet
        if (red && pos[i] - 100 + len / 2 <= -6 + 0.01) along = Math.min(along, -6 - len / 2);
        along = Math.min(along, rear - 2.5 - len / 2);
        rear = along - len / 2;
        pos[i] = along + 100 > 200 ? along + 100 - 200 : Math.max(pos[i], along + 100);
        const g = refs.current[i];
        if (g) {
          g.position.set(lane.dir * (pos[i] - 100), 0, lane.z);
          g.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      }
    });
    signals[0].emissiveIntensity = red ? 0.05 : 1.6;
    signals[1].emissiveIntensity = red ? 1.6 : 0.05;
  });
  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <mesh geometry={c.geo} material={toonVertex()} castShadow>
            <Ink />
          </mesh>
          <mesh position={[0, c.bus ? 1 : 0.7, c.bus ? 5.55 : 2.18]} material={toonWith({ color: "#fff6dc", emissive: "#fff1c2", emissiveIntensity: 1.5, key: "headlight" })}>
            <boxGeometry args={[1.5, 0.18, 0.06]} />
          </mesh>
          <mesh position={[0, c.bus ? 1 : 0.7, c.bus ? -5.55 : -2.18]} material={toonWith({ color: "#ff5a4a", emissive: "#ff3b2e", emissiveIntensity: 1.2, key: "taillight" })}>
            <boxGeometry args={[1.5, 0.15, 0.06]} />
          </mesh>
        </group>
      ))}
      {/* the traffic light by the crossing */}
      <group position={[-5, 0, -8.8]}>
        <mesh position={[0, 2.6, 0]} material={toon("#3d424c")}>
          <cylinderGeometry args={[0.08, 0.08, 5.2, 8]} />
        </mesh>
        {signals.map((m, k) => (
          <mesh key={k} ref={(el) => void (lights.current[k] = el)} position={[0, 4.9 - k * 0.5, 0.15]} material={m}>
            <sphereGeometry args={[0.18, 12, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export const gangnam: RoomConfig = {
  slug: "gangnam",
  name: { en: "Gangnam", ko: "강남" },
  place: { en: "Yeongdong-daero, COEX and Bongeunsa", ko: "영동대로, 코엑스와 봉은사" },
  hour: { en: "Autumn night", ko: "가을 밤" },
  walk: { cell: 0.5, rects: RECTS, holes: HOLES, body: 0.28 },
  spawn: { x: 0, z: -12 },
  spawnHeading: 0, // facing south, across the road to Bongeunsa
  // Night: a deep blue sky, moonlight, and the city doing the rest.
  sky: { top: "#0d1534", bottom: "#2d2f5e" },
  sun: { position: [30, 55, -40], color: "#aab8ff", intensity: 0.95 },
  ambient: { sky: "#6670b0", ground: "#34303f", intensity: 1.3 },
  world: { hills: HILLS, fog: ["#1f2549", 70, 300], floorLift: LIFT },
  map: {
    blocks: [...TOWERS.map((t): [number, number, number, number] => [t.x0, t.z0, t.x1, t.z1]), [SCREEN.x0, SCREEN.z0, SCREEN.x1, SCREEN.z1], [HALL.x - 8, HALL.z - 5.5, HALL.x + 8, HALL.z + 5.5]],
    green: [[0, 40, 18]],
  },
  pois: [
    {
      id: "daero",
      at: { x: 0, z: -12 },
      radius: 3.5,
      title: { en: "Yeongdong-daero", ko: "영동대로" },
      line: {
        en: "One of Gangnam's great avenues. COEX and its towers stand to the north; across the road to the south is Bongeunsa, a temple older than Seoul itself. Cross when the light turns green.",
        ko: "강남의 큰길 가운데 하나예요. 북쪽엔 코엑스와 빌딩들이, 길 건너 남쪽엔 서울보다 오래된 절 봉은사가 있어요. 신호가 초록불일 때 건너세요.",
      },
    },
    {
      id: "statue",
      at: { x: -18, z: -20.5 },
      radius: 3.5,
      action: "photo",
      title: { en: "The Gangnam Style statue", ko: "강남스타일 동상" },
      line: {
        en: "Two giant crossed wrists doing the horse-riding dance from PSY's 2012 hit. Strike the pose for a photo.",
        ko: "2012년 싸이의 히트곡 '강남스타일'의 말춤 손목을 크게 만든 동상이에요. 같은 포즈로 사진을 찍어 보세요.",
      },
    },
    {
      id: "library",
      at: { x: 0, z: -38 },
      radius: 3,
      action: "sit",
      actionLabel: { en: "Sit at the reading table", ko: "열람 테이블에 앉기" },
      seat: { x: 0, z: -38.3, heading: Math.PI, on: { x: 0, z: -39.05, y: 0.46 - 0.45 } },
      title: { en: "Starfield Library", ko: "별마당 도서관" },
      line: {
        en: "In the middle of COEX Mall, bookshelves rise thirteen metres under a glass roof. Anyone can sit and read, for free.",
        ko: "코엑스몰 한가운데, 유리 지붕 아래로 13m 높이의 책장이 솟아 있어요. 누구나 무료로 앉아 책을 읽을 수 있어요.",
      },
    },
    {
      id: "wave",
      at: { x: 26, z: -20 },
      radius: 5,
      title: { en: "The wave screen", ko: "파도 미디어 파사드" },
      line: {
        en: "A giant screen wraps round the corner of the tower, and the sea inside it seems ready to spill onto the street.",
        ko: "빌딩 모서리를 감싼 커다란 화면 속 파도가 금방이라도 거리로 쏟아질 것 같아요.",
      },
    },
    {
      id: "bongeunsa",
      at: { x: 0, z: 28 },
      radius: 5,
      title: { en: "Bongeunsa", ko: "봉은사" },
      line: {
        en: "Founded in 794, this temple sits across the road from COEX. Lotus lanterns glow over the courtyard, and a 23-metre stone Maitreya Buddha looks out over the city.",
        ko: "794년에 세워진 절로, 코엑스 길 건너편에 있어요. 마당 위로 연등이 빛나고, 23m 높이의 미륵대불이 도시를 내려다봐요.",
      },
    },
  ],
  Scene,
  Live: () => (
    <>
      <WaveScreen />
      <Traffic />
    </>
  ),
};
