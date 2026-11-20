"use client";

/**
 * A traveler figure drawn entirely in code, about two and a half heads tall: soft toon shading,
 * a painted face, a sculpted hair shell and outfits built from lathed shells that follow the
 * body. A hand-built rig (hips, torso, neck, shoulders) is moved procedurally. Original design;
 * no game's characters are copied.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { toon, toonMapped, shadeOf } from "./material";
import { faceTextures, type Expression } from "./face";
import { hairGeometry, hairShineGeometry, onHead, type HairStyle } from "./hair";

export type Outfit = "chima" | "baji" | "hoodie";
export type Hair = HairStyle;
export type Action = "idle" | "walk" | "wave" | "bow" | "sit" | "hop";

export interface Palette {
  skin: string;
  hair: string;
  top: string; // jeogori / hoodie
  bottom: string; // chima / baji / trousers
  accent: string; // goreum and sleeve ends, vest, soles
  trim: string; // collar band, buttons, pins
  shoes: string;
}

export const PALETTES: Palette[] = [
  { skin: "#f7dac7", hair: "#2f2421", top: "#f7d5d8", bottom: "#4462b0", accent: "#d4475b", trim: "#d4475b", shoes: "#f4c9d0" },
  { skin: "#eec8ab", hair: "#33261f", top: "#f7f0e2", bottom: "#5d8b70", accent: "#2f4270", trim: "#d9a843", shoes: "#463935" },
  { skin: "#f7dfcc", hair: "#6b4532", top: "#f1b546", bottom: "#3b4459", accent: "#e8665b", trim: "#f6f1e7", shoes: "#f8f4ec" },
];

const LINE = "#3d2d2f";
const BINYEO = "#d8b25c";
const LINE_PX = 1.7;

// Proportions, in metres of a figure about 1.15 tall.
const R = 0.25; // head radius
const HEAD: [number, number, number] = [1.05, 0.95, 1]; // a little wide, like a toy
const HIP = 0.3;
const SHOE_H = 0.042;
const LEG = HIP - SHOE_H; // hip to the top of the shoe
const LEG_R = 0.058;
const TORSO = 0.33;
const T_BOT = 0.165;
const T_TOP = 0.13;
const SHOULDER = 0.135;
const ARM = 0.235;
const ARM_R = 0.045;
const HAND = 0.05;

const lathe = (pts: [number, number][], segments = 48, phiStart = Math.PI, phiLength = Math.PI * 2) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments, phiStart, phiLength);

// The torso's silhouette; clothes are shells that follow it.
const TORSO_PTS: [number, number][] = [
  [0, 0],
  [T_BOT * 0.92, 0.004],
  [T_BOT, TORSO * 0.16],
  [T_BOT * 0.99, TORSO * 0.48],
  [T_TOP * 1.07, TORSO * 0.8],
  [T_TOP * 0.82, TORSO * 0.96],
  [0, TORSO],
];
function torsoAt(y: number) {
  for (let i = 1; i < TORSO_PTS.length; i++) {
    const [r1, y1] = TORSO_PTS[i];
    if (y <= y1) {
      const [r0, y0] = TORSO_PTS[i - 1];
      return r0 + ((r1 - r0) * (y - y0)) / Math.max(1e-6, y1 - y0);
    }
  }
  return 0;
}
/** A band of cloth over the torso between two heights, standing `pad` off the body. */
function shell(y0: number, y1: number, pad: number, flare = 0, arc?: [number, number]) {
  const pts: [number, number][] = [[torsoAt(y0) * 0.85, y0]];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const y = y0 + ((y1 - y0) * i) / n;
    pts.push([torsoAt(y) + pad + flare * (1 - i / n) ** 2, y]);
  }
  pts.push(y1 >= TORSO - 1e-6 ? [0, TORSO + pad * 0.6] : [torsoAt(y1) * 0.85, y1]);
  return arc ? lathe(pts, 32, arc[0], arc[1]) : lathe(pts);
}
/** Soft pleats: the hem ripples more than the waist. */
function pleat(geo: THREE.BufferGeometry, count: number, amount: (y: number) => number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amount(y) * Math.cos(Math.atan2(x, z) * count);
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

function Part({ color, line = true, children, ...props }: {
  color: string;
  line?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "children" | "material">) {
  const dpr = useThree((s) => s.viewport.dpr);
  return (
    <mesh castShadow material={toon(color)} {...props}>
      {children}
      {line && <Outlines thickness={LINE_PX * dpr} color={LINE} />}
    </mesh>
  );
}

function expressionFor(action: Action): Expression {
  return action === "wave" || action === "hop" ? "smile" : action === "bow" ? "happy" : "open";
}

export function ToonFigure({ outfit, hair, palette, action, lashes = false, seed = 0, ...group }: {
  outfit: Outfit;
  hair: Hair;
  palette: Palette;
  action: Action;
  lashes?: boolean;
  seed?: number;
} & React.ComponentProps<"group">) {
  const p = palette;
  const dpr = useThree((st) => st.viewport.dpr);
  const body = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const skirt = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Group>(null);
  const footR = useRef<THREE.Group>(null);
  const state = useRef({ t: seed * 1.7, blinkAt: 1.5 + seed * 0.7, since: 0, face: "open" as Expression });

  const faces = useMemo(() => faceTextures(p.skin, shadeOf(p.hair, 1.15), lashes), [p.skin, p.hair, lashes]);
  const faceMat = useMemo(() => toonMapped(faces.open), [faces]);
  const hairGeo = useMemo(() => hairGeometry(hair, R, HEAD), [hair]);
  const shineGeo = useMemo(() => hairShineGeometry(hair, R, HEAD), [hair]);

  const geo = useMemo(() => {
    const h = TORSO;
    const torsoShape = lathe(TORSO_PTS);
    // Chima: tied high on the chest, falling in a soft pleated bell to the ankles.
    const hem = -LEG + 0.045;
    const chima = pleat(
      lathe([
        [0, hem],
        [T_BOT * 1.72, hem],
        [T_BOT * 1.8, hem + 0.024],
        [T_BOT * 1.66, -LEG * 0.5],
        [T_BOT * 1.42, 0],
        [T_BOT * 1.22, h * 0.18],
        [T_BOT * 1.02, h * 0.45],
        [T_TOP, h * 0.7],
        [0, h * 0.72],
      ], 96),
      16,
      (y) => 0.035 * Math.min(1, Math.max(0, (h * 0.5 - y) / (h * 0.5 + LEG))),
    );
    const jeogori = shell(h * 0.44, h, 0.014, 0.022);
    const vest = shell(h * 0.06, h * 0.9, 0.022, 0.006);
    const hips = shell(0, h * 0.13, 0.012);
    const hem2 = shell(0, h * 0.1, 0.01, 0.004);
    const pocket = shell(h * 0.15, h * 0.44, 0.011, 0, [-0.62, 1.24]);
    // Sleeves: a gentle belly for hanbok (the baerae curve), straight and cuffed for the hoodie.
    const sleeve = (cuff: number, belly: number) =>
      lathe([
        [0, -ARM],
        [cuff * 0.82, -ARM],
        [cuff, -ARM + 0.006],
        [cuff * (1 + belly * 0.5), -ARM * 0.72],
        [ARM_R * (1.12 + belly), -ARM * 0.38],
        [ARM_R * 1.04, -ARM * 0.06],
        [ARM_R * 0.74, ARM_R * 0.5],
        [0, ARM_R * 0.78],
      ], 28);
    const band = (rIn: number, rOut: number, y0: number, y1: number) =>
      lathe([[rIn, y0], [rOut, y0], [rOut, y1], [rIn, y1]], 28);
    const cuffHanbok = HAND * 1.2;
    const cuffHoodie = HAND * 1.02;
    // The collar band (git) runs from the left of the neck across to the right of the chest.
    const gitPts = Array.from({ length: 9 }, (_, i) => {
      const u = i / 8;
      const y = h * (0.97 - 0.3 * u);
      const x = -0.032 + 0.07 * u;
      const rr = torsoAt(y) + 0.014 + 0.022 * (1 - (y - h * 0.44) / (h * 0.56)) ** 2;
      return new THREE.Vector3(x, y, Math.sqrt(Math.max(0, rr * rr - x * x)) + 0.003);
    });
    const git = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gitPts), 24, 0.011, 8, false);
    return {
      torsoShape, chima, jeogori, vest, hips, hem2, pocket, git,
      sleeveHanbok: sleeve(cuffHanbok, 0.35),
      sleeveHoodie: sleeve(cuffHoodie, 0),
      kkeutdong: band(cuffHanbok * 0.8, cuffHanbok + 0.004, -ARM, -ARM + 0.045),
      ribCuff: band(cuffHoodie * 0.8, cuffHoodie + 0.004, -ARM, -ARM + 0.03),
      knot: gitPts[8],
    };
  }, []);

  useFrame((_, dt) => {
    const st = state.current;
    const d = Math.min(dt, 0.05);
    st.t += d;
    const t = st.t;
    const b = body.current, tr = torso.current, hd = head.current;
    const al = armL.current, ar = armR.current, ll = legL.current, lr = legR.current;
    if (!b || !tr || !hd || !al || !ar || !ll || !lr) return;

    let bob = 0, lean = 0, sway = 0, twist = 0, squash = 1, sit = 0;
    let aL = -0.14, aR = 0.14, aLx = 0.05, aRx = 0.05, lL = 0, lR = 0;
    let headTilt = 0, headNod = 0, headTurn = 0;
    const breathe = Math.sin(t * 2.2) * 0.012;

    if (action === "idle") {
      sway = Math.sin(t * 0.9) * 0.025;
      headTilt = Math.sin(t * 0.7 + 1) * 0.06;
      headTurn = Math.sin(t * 0.45 + seed) * 0.22;
      aLx += Math.sin(t * 2.2) * 0.04;
      aRx -= Math.sin(t * 2.2) * 0.04;
    } else if (action === "walk") {
      const f = t * 7;
      lL = Math.sin(f) * 0.6;
      lR = -lL;
      aLx = -Math.sin(f) * 0.55;
      aRx = -aLx;
      bob = Math.abs(Math.sin(f)) * 0.04;
      squash = 1 - (1 - Math.abs(Math.sin(f))) * 0.035;
      lean = 0.07;
      sway = Math.sin(f) * 0.04;
      twist = Math.sin(f) * 0.09;
      headTurn = -twist * 0.7;
      headNod = Math.sin(f * 2) * 0.025;
    } else if (action === "wave") {
      aR = 2.25 + Math.sin(t * 9) * 0.25;
      aRx = -0.4;
      headTilt = 0.14;
      sway = Math.sin(t * 4.5) * 0.035;
    } else if (action === "bow") {
      const c = t % 3;
      const k = (1 - Math.cos(Math.min(1, c / 1.1) * Math.PI)) / 2;
      const back = c > 1.9 ? 1 - Math.min(1, (c - 1.9) / 0.8) : 1;
      lean = 0.5 * k * back;
      headNod = 0.22 * k * back;
      aL = -0.03;
      aR = 0.03;
      aLx = 0.3 * k * back;
      aRx = 0.3 * k * back;
    } else if (action === "sit") {
      sit = 1;
      lL = -1.45;
      lR = -1.45;
      aLx = -0.4;
      aRx = -0.4;
      headTilt = Math.sin(t * 0.8) * 0.05;
      headTurn = Math.sin(t * 0.4) * 0.15;
    } else if (action === "hop") {
      const ph = (t % 1.1) / 1.1;
      const up = Math.max(0, Math.sin(ph * Math.PI * 1.25));
      bob = up * 0.3;
      squash = ph < 0.08 ? 0.86 : ph > 0.82 ? 0.9 : 1 + up * 0.07;
      aL = -0.14 - up * 1.15;
      aR = 0.14 + up * 1.15;
      lL = -up * 0.3;
      lR = -up * 0.3;
    }

    b.position.y = bob - sit * (LEG * 0.62);
    b.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    b.rotation.z = sway * 0.4;
    b.rotation.y = twist * 0.5;
    tr.rotation.x = lean;
    tr.scale.y = 1 + breathe;
    hd.rotation.set(headNod, headTurn, headTilt + sway * 0.3);
    al.rotation.set(aLx, 0, aL);
    ar.rotation.set(aRx, 0, aR);
    ll.rotation.x = lL;
    lr.rotation.x = lR;
    // Seated, the feet stay flat so the toes point ahead instead of showing their soles.
    if (footL.current) footL.current.rotation.x = -lL * 0.85 * sit;
    if (footR.current) footR.current.rotation.x = -lR * 0.85 * sit;
    // The skirt trails the legs a little.
    if (skirt.current) {
      skirt.current.rotation.x = -Math.abs(lL) * 0.06 - sit * 0.08;
      skirt.current.rotation.z = -sway * 0.5;
    }

    // Blink every few seconds; a happy face keeps its eyes closed.
    st.since += d;
    if (st.since > st.blinkAt) {
      st.since = 0;
      st.blinkAt = 2.2 + ((seed * 7 + t) % 3);
    }
    const base = expressionFor(action);
    const face: Expression = base !== "happy" && st.since < 0.13 ? "blink" : base;
    if (face !== st.face) {
      st.face = face;
      faceMat.map = faces[face];
    }
  });

  const h = TORSO;
  const headY = h + 0.02 + R * HEAD[1] * 0.88;
  const hanbok = outfit !== "hoodie";
  const legColor = outfit === "chima" ? "#fbf7f0" : p.bottom; // beoseon socks under the chima
  const sole = outfit === "hoodie" ? p.accent : shadeOf(p.shoes, 0.62);
  const bunAt = onHead(R, HEAD, Math.PI, Math.PI * 0.57, 1.16);

  return (
    <group {...group}>
      <group ref={body}>
        {/* legs, pivoting at the hips */}
        {[-1, 1].map((side) => (
          <group key={side} ref={side < 0 ? legL : legR} position={[side * 0.075, HIP, 0]}>
            <Part color={legColor} position={[0, -LEG / 2 + 0.01, 0]}>
              <capsuleGeometry args={[outfit === "baji" ? LEG_R * 1.32 : LEG_R, LEG - LEG_R * 1.6, 6, 18]} />
            </Part>
            {outfit === "baji" && (
              <Part color={p.accent} position={[0, -LEG + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[LEG_R * 1.05, 0.014, 8, 24]} />
              </Part>
            )}
            {outfit === "hoodie" && (
              <Part color={shadeOf(p.bottom, 1.35)} position={[0, -LEG + 0.045, 0]}>
                <cylinderGeometry args={[LEG_R * 1.12, LEG_R * 1.12, 0.03, 20]} />
              </Part>
            )}
            {/* shoe: rounded upper, darker sole; the kkotsin toe turns up */}
            <group ref={side < 0 ? footL : footR} position={[0, -LEG, 0.014]}>
              <Part color={p.shoes} scale={[0.92, 0.62, 1.42]}>
                <sphereGeometry args={[LEG_R * 1.22, 24, 16]} />
              </Part>
              <Part color={sole} position={[0, -SHOE_H * 0.62, 0]} scale={[0.92, 1, 1.42]}>
                <cylinderGeometry args={[LEG_R * 1.2, LEG_R * 1.16, 0.018, 24]} />
              </Part>
              {outfit === "chima" && (
                <Part color={p.accent} position={[0, SHOE_H * 0.32, LEG_R * 1.58]}>
                  <sphereGeometry args={[LEG_R * 0.3, 14, 10]} />
                </Part>
              )}
            </group>
          </group>
        ))}

        <group ref={torso} position={[0, HIP, 0]}>
          <Part color={p.top} geometry={geo.torsoShape} />

          {outfit === "chima" && (
            <>
              <group ref={skirt}>
                <Part color={p.bottom} geometry={geo.chima} />
              </group>
              <Part color={p.top} geometry={geo.jeogori} />
              <Part color={p.trim} geometry={geo.git} />
              {/* goreum: a knot and two long ribbons */}
              <group position={geo.knot}>
                <Part color={p.accent}>
                  <sphereGeometry args={[0.022, 14, 10]} />
                </Part>
                <Part color={p.accent} position={[-0.012, -0.085, 0.022]} rotation={[-0.32, 0, -0.12]} scale={[1, 1, 0.38]}>
                  <capsuleGeometry args={[0.017, 0.15, 4, 10]} />
                </Part>
                <Part color={p.accent} position={[0.022, -0.065, 0.016]} rotation={[-0.3, 0, 0.2]} scale={[1, 1, 0.38]}>
                  <capsuleGeometry args={[0.016, 0.1, 4, 10]} />
                </Part>
              </group>
            </>
          )}

          {outfit === "baji" && (
            <>
              <Part color={p.bottom} geometry={geo.hips} />
              <Part color={p.accent} geometry={geo.vest} />
              {[0.56, 0.36].map((k) => (
                <Part key={k} color={p.trim} position={[0, h * k, torsoAt(h * k) + 0.028]}>
                  <sphereGeometry args={[0.013, 12, 8]} />
                </Part>
              ))}
            </>
          )}

          {outfit === "hoodie" && (
            <>
              <Part color={shadeOf(p.top, 0.9)} geometry={geo.hem2} />
              <Part color={shadeOf(p.top, 0.92)} geometry={geo.pocket} />
              {/* hood resting on the shoulders, and its drawstrings */}
              <Part color={p.top} position={[0, h * 0.96, -0.03]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
                <torusGeometry args={[T_TOP * 0.82, 0.042, 12, 32]} />
              </Part>
              <Part color={p.top} position={[0, h * 0.9, -0.12]} scale={[1.25, 0.85, 0.7]}>
                <sphereGeometry args={[0.1, 24, 16]} />
              </Part>
              {[-1, 1].map((side) => (
                <group key={side} position={[side * 0.034, h * 0.86, torsoAt(h * 0.86) + 0.012]} rotation={[-0.15, 0, 0]}>
                  <Part color={p.trim} position={[0, -0.045, 0]} line={false}>
                    <capsuleGeometry args={[0.0055, 0.08, 4, 6]} />
                  </Part>
                  <Part color={p.trim} position={[0, -0.095, 0]}>
                    <capsuleGeometry args={[0.009, 0.014, 4, 8]} />
                  </Part>
                </group>
              ))}
            </>
          )}

          {/* dongjeong: the white collar edge of a hanbok */}
          {hanbok && (
            <Part color="#fdfaf3" position={[0, h * 0.95, 0.008]} rotation={[Math.PI / 2 + 0.32, 0, 0]}>
              <torusGeometry args={[T_TOP * 0.74, 0.013, 8, 32]} />
            </Part>
          )}

          {/* arms, pivoting at the shoulders; the hand tucks into the cuff */}
          {[-1, 1].map((side) => (
            <group key={side} ref={side < 0 ? armL : armR} position={[side * SHOULDER, h * 0.84, 0]}>
              <Part color={p.top} geometry={hanbok ? geo.sleeveHanbok : geo.sleeveHoodie} />
              {outfit === "chima" && <Part color={p.accent} geometry={geo.kkeutdong} />}
              {outfit === "hoodie" && <Part color={shadeOf(p.top, 0.9)} geometry={geo.ribCuff} />}
              <Part color={p.skin} position={[0, -ARM - HAND * 0.32, 0.004]} scale={[1, 1.08, 0.9]}>
                <sphereGeometry args={[HAND, 20, 14]} />
              </Part>
            </group>
          ))}

          {/* head */}
          <group ref={head} position={[0, headY, 0]}>
            <mesh castShadow material={faceMat} scale={HEAD}>
              <sphereGeometry args={[R, 64, 48]} />
              <Outlines thickness={LINE_PX * 1.2 * dpr} color={LINE} />
            </mesh>
            {hair !== "bob" &&
              [-1, 1].map((side) => (
                <Part key={side} color={p.skin} position={[side * R * HEAD[0] * 0.98, -R * 0.06, -0.01]} scale={[0.5, 1, 0.78]}>
                  <sphereGeometry args={[R * 0.17, 16, 12]} />
                </Part>
              ))}
            <Part color={p.hair} geometry={hairGeo} />
            <mesh geometry={shineGeo} material={toon(shadeOf(p.hair, 1.9))} />
            {hair === "bun" && (
              <group position={bunAt}>
                <Part color={p.hair} scale={[1.08, 0.92, 0.9]}>
                  <sphereGeometry args={[R * 0.3, 28, 20]} />
                </Part>
                {/* binyeo: the hairpin through the bun, with a flower at one end */}
                <Part color={BINYEO} rotation={[0, 0, Math.PI / 2 - 0.12]} position={[0, 0, -R * 0.06]}>
                  <capsuleGeometry args={[R * 0.03, R * 0.9, 4, 10]} />
                </Part>
                <Part color={p.accent} position={[-R * 0.52, -R * 0.06, -R * 0.06]}>
                  <sphereGeometry args={[R * 0.07, 14, 10]} />
                </Part>
              </group>
            )}
            {hair === "short" && (
              <Part color={p.hair} position={[0, R * HEAD[1] * 1.08, R * 0.08]} rotation={[0, Math.PI / 2, 0.5]}>
                <torusGeometry args={[R * 0.11, R * 0.035, 8, 20, Math.PI * 1.25]} />
              </Part>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
