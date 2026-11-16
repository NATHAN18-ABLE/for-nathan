"use client";

import * as THREE from "three";

// One porcelain world: everything is glazed ceramic. White body, cobalt and celadon
// accents, a soft clear coat so light slides over the shapes like over a dish.
export const GLAZE = {
  white: "#f4f2ec",
  warmWhite: "#efe9dd",
  paving: "#e6e0d4",
  stone: "#d9d3c6",
  stoneDeep: "#c9c2b3",
  cobalt: "#2b4a9a",
  celadon: "#a8c8b6",
  celadonDeep: "#7ea592",
  tile: "#5f6872",
  wood: "#c79e74",
  woodDeep: "#9c7651",
  persimmon: "#e08a4c",
  ink: "#2a2e36",
  lamp: "#ffd8a0",
} as const;

const cache = new Map<string, THREE.MeshPhysicalMaterial>();

/** A shared glazed material. Matte glazes keep a little sheen; gloss ones a bright coat. */
export function glaze(color: string, opts: { gloss?: number; emissive?: string; emissiveIntensity?: number } = {}) {
  const key = `${color}|${opts.gloss ?? 0.6}|${opts.emissive ?? ""}|${opts.emissiveIntensity ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    const gloss = opts.gloss ?? 0.6;
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.55 - gloss * 0.3,
      clearcoat: gloss,
      clearcoatRoughness: 0.25,
      ...(opts.emissive ? { emissive: new THREE.Color(opts.emissive), emissiveIntensity: opts.emissiveIntensity ?? 0 } : {}),
    });
    cache.set(key, m);
  }
  return m;
}

// Outfit glazes for avatars (index stored in presence).
export const OUTFITS = ["#2b4a9a", "#7ea592", "#e08a4c", "#c25b5b", "#d9b54a", "#6c5a8e", "#3f7f8c", "#2a2e36"];
