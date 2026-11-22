import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Hair as one sculpted shell around the head. For every direction around the head (az, 0 is the
 * face) the hair runs from the crown down to a hairline that depends on the style: a scalloped
 * fringe, a bob that falls past the cheeks, or hair parted and combed back into a bun. The shell
 * has an outer surface, a rounded lip and an inner surface tucked inside the head, so it reads as
 * a solid mass with a soft edge rather than a painted cap.
 */

export type HairStyle = "bob" | "bun" | "braid" | "short" | "mop";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Where the hair ends, as an angle down from the crown. */
function hairline(style: HairStyle, az: number) {
  const a = Math.abs(az);
  let e: number;
  if (style === "short") {
    const locks = Math.pow(0.5 + 0.5 * Math.cos(az * 9), 1.6) * (1 - 0.5 * smooth(1.4, 2.6, a));
    e = 0.3 + 0.17 * smooth(0.35, 1.35, a) + 0.24 * smooth(1.25, 2.4, a) + 0.045 * locks;
  } else if (style === "bob") {
    const tips = Math.pow(0.5 + 0.5 * Math.cos(az * 20), 2);
    e = 0.335 + 0.335 * smooth(0.6, 1.05, a) + 0.09 * smooth(1.9, 3, a) + 0.02 * tips;
  } else if (style === "mop") {
    const tips = Math.pow(0.5 + 0.5 * Math.cos(az * 16), 2);
    e = 0.36 + 0.17 * smooth(0.55, 1.2, a) + 0.2 * smooth(1.3, 2.4, a) + 0.018 * tips;
  } else {
    // bun and braid: parted in the middle and combed back
    e = 0.25 + 0.2 * smooth(0, 1.1, a) + 0.26 * smooth(1.2, 2.3, a);
  }
  return e * Math.PI;
}

/** How far the outer surface stands off the head, t running 0 at the crown to 1 at the hairline. */
function lift(style: HairStyle, az: number, t: number) {
  const a = Math.abs(az);
  let d = 0.07 + 0.035 * Math.sin(Math.PI * Math.min(1, t * 1.2)) - 0.015 * t ** 4;
  if (style === "bob") d += 0.07 * smooth(0.55, 1, t) * smooth(0.5, 1.1, a);
  if (style === "bun" || style === "braid") d -= 0.028 * Math.exp(-((az / 0.06) ** 2)) * smooth(0.15, 0.5, t); // the parting
  if (style === "short") d += 0.012;
  if (style === "mop") d += 0.02 + 0.03 * smooth(0.6, 1, t);
  return d;
}

export function hairGeometry(style: HairStyle, r: number, scale: [number, number, number], low = false) {
  const NA = low ? 80 : 120; // around
  const NO = low ? 14 : 20; // crown to hairline
  const profile: { f: number; rho: (az: number, t: number) => number; dt: number }[] = [];
  for (let j = 0; j <= NO; j++) profile.push({ f: j / NO, rho: (az, t) => 1 + lift(style, az, t), dt: 0 });
  profile.push({ f: 1, rho: (az) => 1 + lift(style, az, 1) * 0.55, dt: 0.016 }); // the rounded lip
  for (let j = NO; j >= 0; j--) profile.push({ f: j / NO, rho: () => 0.965, dt: 0 });

  const P = profile.length;
  const pos = new Float32Array((NA + 1) * P * 3);
  for (let i = 0; i <= NA; i++) {
    const az = -Math.PI + (2 * Math.PI * i) / NA; // the seam sits at the back
    const e = hairline(style, az);
    for (let j = 0; j < P; j++) {
      const p = profile[j];
      const th = e * p.f + p.dt;
      const rho = p.rho(az, p.f) * r;
      const k = (i * P + j) * 3;
      pos[k] = Math.sin(az) * Math.sin(th) * rho * scale[0];
      pos[k + 1] = Math.cos(th) * rho * scale[1];
      pos[k + 2] = Math.cos(az) * Math.sin(th) * rho * scale[2];
    }
  }
  const index: number[] = [];
  for (let i = 0; i < NA; i++) {
    for (let j = 0; j < P - 1; j++) {
      const a = i * P + j, b = (i + 1) * P + j, c = (i + 1) * P + j + 1, d = i * P + j + 1;
      index.push(a, c, b, a, d, c);
    }
  }
  const raw = new THREE.BufferGeometry();
  raw.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  raw.setIndex(index);
  const geo = mergeVertices(raw, 1e-6);
  geo.computeVertexNormals();
  raw.dispose();
  return geo;
}

/** A point just off the head surface in a given direction, for buns and pins. */
export function onHead(r: number, scale: [number, number, number], az: number, polar: number, rho = 1) {
  return new THREE.Vector3(
    Math.sin(az) * Math.sin(polar) * r * rho * scale[0],
    Math.cos(polar) * r * rho * scale[1],
    Math.cos(az) * Math.sin(polar) * r * rho * scale[2],
  );
}

/**
 * The shine: a thin crescent of lighter hair across the crown, facing the light, the way
 * illustrated hair catches a highlight. It sits a hair's breadth above the shell.
 */
export function hairShineGeometry(style: HairStyle, r: number, scale: [number, number, number]) {
  const NA = 64, NT = 6;
  const span = 1.25;
  const pos: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= NA; i++) {
    const az = -span + (2 * span * i) / NA;
    const w = Math.cos((az / span) * (Math.PI / 2)) ** 0.7; // tapers at both ends
    const mid = style === "bob" || style === "mop" ? 0.42 : 0.4;
    for (let j = 0; j <= NT; j++) {
      const t = mid + (j / NT - 0.5) * 0.11 * w;
      const th = hairline(style, az) * t;
      const rho = (1 + lift(style, az, t) + 0.004) * r;
      pos.push(Math.sin(az) * Math.sin(th) * rho * scale[0], Math.cos(th) * rho * scale[1], Math.cos(az) * Math.sin(th) * rho * scale[2]);
    }
  }
  for (let i = 0; i < NA; i++) {
    for (let j = 0; j < NT; j++) {
      const a = i * (NT + 1) + j, b = (i + 1) * (NT + 1) + j, c = b + 1, d = a + 1;
      index.push(a, c, b, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
