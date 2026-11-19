"use client";

/**
 * A traveler figure drawn entirely in code: rounded primitives, cel shading and a thin
 * outline, with a hand-built rig (hips, torso, neck, shoulders) moved procedurally. Two
 * proportions are on trial: "cozy" (about 2.5 heads, soft and round) and "sporty"
 * (about 3 heads, simpler and livelier). Original design; no game's characters are copied.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";

export type Variant = "cozy" | "sporty";
export type Outfit = "chima" | "baji" | "hoodie";
export type Hair = "bob" | "bun" | "short";
export type Action = "idle" | "walk" | "wave" | "bow" | "sit" | "hop";

export interface Palette {
  skin: string;
  hair: string;
  top: string; // jacket / hoodie
  bottom: string; // skirt / trousers
  accent: string; // ribbon, trims
  shoes: string;
}

export const PALETTES: Palette[] = [
  { skin: "#f3d3bd", hair: "#2b211d", top: "#f2c9cf", bottom: "#3f5da8", accent: "#c8473d", shoes: "#f5efe6" },
  { skin: "#e9c1a2", hair: "#3a2a22", top: "#f6ecd9", bottom: "#4f7a64", accent: "#2f3f73", shoes: "#3b3330" },
  { skin: "#f5dac6", hair: "#5a3b2b", top: "#e7a23b", bottom: "#2f3340", accent: "#f2ede3", shoes: "#f2ede3" },
];

const OUTLINE = "#2a2428";

interface Spec {
  headR: number;
  headStretch: number;
  hipY: number;
  legLen: number;
  legR: number;
  torsoH: number;
  torsoBot: number;
  torsoTop: number;
  shoulderX: number;
  armLen: number;
  armR: number;
  handR: number;
  neck: number;
  outline: number;
  eye: number;
}

const SPECS: Record<Variant, Spec> = {
  cozy: { headR: 0.25, headStretch: 0.96, hipY: 0.33, legLen: 0.27, legR: 0.062, torsoH: 0.33, torsoBot: 0.17, torsoTop: 0.135, shoulderX: 0.15, armLen: 0.25, armR: 0.048, handR: 0.058, neck: 0.03, outline: 0.012, eye: 0.05 },
  sporty: { headR: 0.185, headStretch: 1.12, hipY: 0.5, legLen: 0.44, legR: 0.05, torsoH: 0.4, torsoBot: 0.13, torsoTop: 0.15, shoulderX: 0.18, armLen: 0.37, armR: 0.04, handR: 0.062, neck: 0.05, outline: 0.011, eye: 0.024 },
};

// Three-step light ramp: lit, half, shade. Nearest filtering keeps the cel edges crisp.
function useRamp() {
  return useMemo(() => {
    const data = new Uint8Array([168, 168, 168, 255, 218, 218, 218, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  }, []);
}

function Toon({ color, ramp, outline = true, thickness, children, ...props }: {
  color: string;
  ramp: THREE.Texture;
  outline?: boolean;
  thickness: number;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "children">) {
  return (
    <mesh castShadow {...props}>
      {children}
      <meshToonMaterial color={color} gradientMap={ramp} />
      {outline && <Outlines thickness={thickness} color={OUTLINE} />}
    </mesh>
  );
}

/** A lathe from (radius, height) pairs, smooth and closed at both ends. */
function lathe(points: [number, number][], segments = 40) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

/** Places its children flat on the front of the head (an ellipsoid), facing outwards. */
function Decal({ r, stretch, x, y, children }: { r: number; stretch: number; x: number; y: number; children: React.ReactNode }) {
  const { position, quaternion } = useMemo(() => {
    const a = r, b = r * stretch, c = r * 0.97;
    const z = c * Math.sqrt(Math.max(0, 1 - (x / a) ** 2 - (y / b) ** 2));
    const n = new THREE.Vector3(x / (a * a), y / (b * b), z / (c * c)).normalize();
    const pos = new THREE.Vector3(x, y, z).addScaledVector(n, 0.003);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    return { position: pos, quaternion: q };
  }, [r, stretch, x, y]);
  return (
    <group position={position} quaternion={quaternion}>
      {children}
    </group>
  );
}

export function ToonFigure({ variant, outfit, hair, palette, action, seed = 0, ...group }: {
  variant: Variant;
  outfit: Outfit;
  hair: Hair;
  palette: Palette;
  action: Action;
  seed?: number;
} & React.ComponentProps<"group">) {
  const s = SPECS[variant];
  const ramp = useRamp();
  const o = s.outline;

  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const state = useRef({ t: seed * 1.7, blinkAt: 2 + seed, since: 0 });

  const geo = useMemo(() => {
    const h = s.torsoH;
    const torsoShape = lathe([
      [0, 0],
      [s.torsoBot * 0.9, 0.005],
      [s.torsoBot, h * 0.18],
      [s.torsoBot * 0.98, h * 0.5],
      [s.torsoTop * 1.06, h * 0.82],
      [s.torsoTop * 0.8, h * 0.97],
      [0, h],
    ]);
    // Chima: from high on the chest, a soft bell down to the ankles.
    const skirtTop = h * 0.72;
    const skirt = lathe([
      [0, -s.legLen + 0.035],
      [s.torsoBot * 1.7, -s.legLen + 0.035],
      [s.torsoBot * 1.78, -s.legLen + 0.06],
      [s.torsoBot * 1.62, -s.legLen * 0.55],
      [s.torsoBot * 1.28, h * 0.2],
      [s.torsoTop * 1.12, skirtTop],
      [0, skirtTop + 0.01],
    ]);
    // Jeogori: a short jacket over the chest.
    const jacket = lathe([
      [0, h * 0.5],
      [s.torsoBot * 1.04, h * 0.5],
      [s.torsoTop * 1.18, h * 0.82],
      [s.torsoTop * 0.86, h * 0.98],
      [0, h * 1.0],
    ]);
    const coat = lathe([
      [0, -0.02],
      [s.torsoBot * 1.12, -0.02],
      [s.torsoBot * 1.08, h * 0.4],
      [s.torsoTop * 1.12, h * 0.84],
      [s.torsoTop * 0.84, h * 0.98],
      [0, h],
    ]);
    return { torsoShape, skirt, jacket, coat };
  }, [s]);

  useFrame((_, dt) => {
    const st = state.current;
    st.t += Math.min(dt, 0.05);
    const t = st.t;
    const b = body.current, tr = torso.current, hd = head.current;
    const al = armL.current, ar = armR.current, ll = legL.current, lr = legR.current;
    if (!b || !tr || !hd || !al || !ar || !ll || !lr) return;

    // Defaults: standing, arms resting slightly out.
    let bob = 0, lean = 0, sway = 0, squash = 1;
    let aL = -0.12, aR = 0.12, aLx = 0, aRx = 0, lL = 0, lR = 0, headTilt = 0, headNod = 0, sit = 0;
    const breathe = Math.sin(t * 2.2) * 0.012;

    if (action === "idle") {
      sway = Math.sin(t * 0.9) * 0.03;
      headTilt = Math.sin(t * 0.7 + 1) * 0.06;
      aLx = Math.sin(t * 2.2) * 0.04;
      aRx = -aLx;
    } else if (action === "walk") {
      const f = t * 7.5; // steps
      lL = Math.sin(f) * 0.55;
      lR = -lL;
      aLx = -Math.sin(f) * 0.6;
      aRx = -aLx;
      bob = Math.abs(Math.cos(f)) * 0.045;
      squash = 1 - (1 - Math.abs(Math.cos(f))) * 0.04;
      lean = 0.08;
      sway = Math.sin(f) * 0.05;
      headNod = Math.sin(f * 2) * 0.03;
    } else if (action === "wave") {
      aR = 2.6 + Math.sin(t * 9) * 0.28;
      aRx = 0;
      headTilt = 0.12;
      sway = Math.sin(t * 4.5) * 0.04;
    } else if (action === "bow") {
      const k = (1 - Math.cos(Math.min(1, (t % 3) / 1.2) * Math.PI)) / 2;
      const back = (t % 3) > 1.9 ? 1 - Math.min(1, ((t % 3) - 1.9) / 0.8) : 1;
      lean = 0.55 * k * back;
      headNod = 0.25 * k * back;
      aLx = 0.25 * k * back;
      aRx = 0.25 * k * back;
      aL = -0.02;
      aR = 0.02;
    } else if (action === "sit") {
      sit = 1;
      lL = -1.45;
      lR = -1.45;
      aLx = -0.35;
      aRx = -0.35;
      headTilt = Math.sin(t * 0.8) * 0.05;
    } else if (action === "hop") {
      const p = (t % 1.1) / 1.1;
      const up = Math.max(0, Math.sin(p * Math.PI * 1.25));
      bob = up * 0.32;
      squash = p < 0.08 ? 0.88 : p > 0.82 ? 0.9 : 1 + up * 0.06;
      aL = -0.12 - up * 1.1;
      aR = 0.12 + up * 1.1;
      lL = -up * 0.25;
      lR = -up * 0.25;
    }

    b.position.y = bob - sit * (s.legLen * 0.62);
    b.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    b.rotation.z = sway * 0.4;
    tr.rotation.x = lean;
    tr.scale.y = 1 + breathe;
    hd.rotation.z = headTilt + sway * 0.3;
    hd.rotation.x = headNod;
    al.rotation.z = aL;
    ar.rotation.z = aR;
    al.rotation.x = aLx;
    ar.rotation.x = aRx;
    ll.rotation.x = lL;
    lr.rotation.x = lR;

    // Blink every few seconds.
    st.since += dt;
    const e = eyes.current;
    if (e) {
      if (st.since > st.blinkAt) {
        st.since = 0;
        st.blinkAt = 2.4 + ((seed * 7 + t) % 3);
      }
      e.scale.y = st.since < 0.12 ? 0.12 : 1;
    }
  });

  const p = palette;
  const r = s.headR;
  const headY = s.torsoH + s.neck + r * s.headStretch * 0.92;
  const legColor = outfit === "chima" ? p.skin : outfit === "baji" ? p.bottom : "#3a3d4a";
  const sleeve = outfit === "hoodie" ? p.top : outfit === "chima" ? p.top : p.top;

  return (
    <group {...group}>
      <group ref={body}>
        {/* legs, pivoting at the hips */}
        {[-1, 1].map((side) => (
          <group key={side} ref={side < 0 ? legL : legR} position={[side * s.torsoBot * 0.5, s.hipY, 0]}>
            <Toon ramp={ramp} thickness={o} color={legColor} position={[0, -s.legLen / 2, 0]}>
              <capsuleGeometry args={[outfit === "baji" ? s.legR * 1.35 : s.legR, s.legLen - s.legR * 2, 6, 16]} />
            </Toon>
            <Toon ramp={ramp} thickness={o} color={p.shoes} position={[0, -s.legLen + 0.02, 0.035]} scale={[1, 0.62, 1.45]}>
              <sphereGeometry args={[s.legR * 1.25, 20, 14]} />
            </Toon>
          </group>
        ))}

        <group ref={torso} position={[0, s.hipY, 0]}>
          {/* torso */}
          <Toon ramp={ramp} thickness={o} color={outfit === "chima" ? p.top : outfit === "baji" ? p.top : p.top} geometry={outfit === "baji" ? geo.coat : geo.torsoShape} />
          {outfit === "chima" && (
            <>
              <Toon ramp={ramp} thickness={o} color={p.bottom} geometry={geo.skirt} />
              <Toon ramp={ramp} thickness={o} color={p.top} geometry={geo.jacket} />
              {/* goreum: the long ribbon tied at the chest */}
              <Toon ramp={ramp} thickness={o * 0.7} color={p.accent} position={[0.03, s.torsoH * 0.66, s.torsoTop * 1.12]} rotation={[0.12, 0, 0.18]}>
                <boxGeometry args={[0.028, s.torsoH * 0.5, 0.012]} />
              </Toon>
              <Toon ramp={ramp} thickness={o * 0.7} color={p.accent} position={[0.0, s.torsoH * 0.8, s.torsoTop * 1.13]}>
                <sphereGeometry args={[0.026, 12, 10]} />
              </Toon>
            </>
          )}
          {outfit === "baji" && (
            <Toon ramp={ramp} thickness={o * 0.7} color={p.accent} position={[0, s.torsoH * 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[s.torsoBot * 1.07, 0.016, 8, 32]} />
            </Toon>
          )}
          {outfit === "hoodie" && (
            <>
              <Toon ramp={ramp} thickness={o * 0.7} color={p.top} position={[0, s.torsoH * 0.98, -0.05]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
                <torusGeometry args={[s.torsoTop * 0.86, 0.04, 10, 28]} />
              </Toon>
              <Toon ramp={ramp} thickness={o * 0.7} color={p.accent} position={[0, s.torsoH * 0.34, s.torsoBot * 0.96]} scale={[1, 0.7, 0.3]}>
                <sphereGeometry args={[s.torsoBot * 0.6, 18, 12]} />
              </Toon>
            </>
          )}
          {/* white collar (dongjeong) for hanbok */}
          {outfit !== "hoodie" && (
            <mesh position={[0, s.torsoH * 0.95, 0.012]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
              <torusGeometry args={[s.torsoTop * 0.74, 0.014, 8, 28]} />
              <meshToonMaterial color="#fbf8f2" gradientMap={ramp} />
            </mesh>
          )}

          {/* arms, pivoting at the shoulders */}
          {[-1, 1].map((side) => (
            <group key={side} ref={side < 0 ? armL : armR} position={[side * s.shoulderX, s.torsoH * 0.86, 0]}>
              <Toon ramp={ramp} thickness={o} color={sleeve} position={[0, -s.armLen / 2, 0]}>
                <capsuleGeometry args={[s.armR, s.armLen - s.armR * 2, 6, 14]} />
              </Toon>
              <Toon ramp={ramp} thickness={o} color={p.skin} position={[0, -s.armLen - s.handR * 0.4, 0]}>
                <sphereGeometry args={[s.handR, 20, 14]} />
              </Toon>
            </group>
          ))}

          {/* head */}
          <group ref={head} position={[0, headY, 0]}>
            <Toon ramp={ramp} thickness={o} color={p.skin} scale={[1, s.headStretch, 0.97]}>
              <sphereGeometry args={[r, 40, 30]} />
            </Toon>
            {/* ears */}
            {[-1, 1].map((side) => (
              <Toon key={side} ramp={ramp} thickness={o * 0.8} color={p.skin} position={[side * r * 0.97, -r * 0.05, 0]} scale={[0.5, 1, 0.8]}>
                <sphereGeometry args={[r * 0.18, 14, 10]} />
              </Toon>
            ))}
            {/* face: flat shapes laid on the head's surface, like a painted toy */}
            <group ref={eyes}>
              {[-1, 1].map((side) => (
                <Decal key={side} r={r} stretch={s.headStretch} x={side * r * (variant === "cozy" ? 0.36 : 0.3)} y={r * (variant === "cozy" ? 0.02 : 0.08)}>
                  <mesh scale={variant === "cozy" ? [1, 1.32, 1] : [1, 1.15, 1]}>
                    <circleGeometry args={[s.eye, 24]} />
                    <meshBasicMaterial color="#231c1e" />
                  </mesh>
                  {variant === "cozy" && (
                    <mesh position={[s.eye * 0.3, s.eye * 0.5, 0.001]}>
                      <circleGeometry args={[s.eye * 0.34, 14]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  )}
                </Decal>
              ))}
            </group>
            {variant === "cozy" && [-1, 1].map((side) => (
              <Decal key={side} r={r} stretch={s.headStretch} x={side * r * 0.56} y={-r * 0.24}>
                <mesh scale={[1.25, 0.8, 1]}>
                  <circleGeometry args={[r * 0.11, 20]} />
                  <meshBasicMaterial color="#f08a8a" transparent opacity={0.55} depthWrite={false} />
                </mesh>
              </Decal>
            ))}
            <Decal r={r} stretch={s.headStretch} x={0} y={-r * 0.28}>
              <mesh rotation={[0, 0, Math.PI]}>
                <torusGeometry args={[r * 0.085, r * 0.02, 6, 16, Math.PI]} />
                <meshBasicMaterial color="#7a3a36" />
              </mesh>
            </Decal>

            {/* hair */}
            <Toon ramp={ramp} thickness={o} color={p.hair} position={[0, r * 0.04, -r * 0.02]} scale={[1.05, s.headStretch * 1.04, 1.04]}>
              <sphereGeometry args={[r, 40, 24, 0, Math.PI * 2, 0, Math.PI * (hair === "short" ? 0.42 : 0.5)]} />
            </Toon>
            {/* fringe */}
            <Toon ramp={ramp} thickness={o} color={p.hair} position={[0, r * 0.44, r * 0.5]} rotation={[0.9, 0, 0]} scale={[1, 0.55, 0.6]}>
              <sphereGeometry args={[r * 0.62, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </Toon>
            {hair === "bob" && (
              <Toon ramp={ramp} thickness={o} color={p.hair} position={[0, -r * 0.08, -r * 0.18]} scale={[1.1, 0.9, 0.95]}>
                <sphereGeometry args={[r * 0.98, 32, 20, 0, Math.PI * 2, Math.PI * 0.2, Math.PI * 0.55]} />
              </Toon>
            )}
            {hair === "bun" && (
              <>
                <Toon ramp={ramp} thickness={o} color={p.hair} position={[0, r * 0.95, -r * 0.42]}>
                  <sphereGeometry args={[r * 0.36, 22, 16]} />
                </Toon>
                <Toon ramp={ramp} thickness={o * 0.7} color={p.accent} position={[r * 0.3, r * 0.98, -r * 0.3]} rotation={[0, 0, 0.7]}>
                  <capsuleGeometry args={[r * 0.04, r * 0.5, 4, 8]} />
                </Toon>
              </>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
