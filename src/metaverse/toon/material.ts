import * as THREE from "three";

/**
 * Soft toon shading shared by every figure part. The light ramp is coloured, so the shaded side
 * turns a cool lavender instead of grey, and a faint warm rim lifts the silhouette off the ground.
 * Materials are cached by colour: a crowd of figures still compiles one shader.
 */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

let ramp: THREE.DataTexture | null = null;
function getRamp() {
  if (ramp) return ramp;
  const w = 64;
  const data = new Uint8Array(w * 4);
  const shade = [0.7, 0.66, 0.8];
  for (let i = 0; i < w; i++) {
    // x is dot(normal, light) mapped to 0..1; the shadow edge sits just past the terminator.
    const k = smooth(0.46, 0.56, i / (w - 1));
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(255 * (shade[c] + (1 - shade[c]) * k));
    data[i * 4 + 3] = 255;
  }
  ramp = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.LinearFilter;
  ramp.magFilter = THREE.LinearFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

const GRADIENT = THREE.ShaderChunk.gradientmap_pars_fragment.replace(
  "vec3( texture2D( gradientMap, coord ).r )",
  "texture2D( gradientMap, coord ).rgb",
);
const RIM = /* glsl */ `
  float rimK = pow( 1.0 - saturate( dot( normalize( normal ), normalize( vViewPosition ) ) ), 3.0 );
  outgoingLight += vec3( 1.0, 0.95, 0.88 ) * rimK * 0.22 * diffuseColor.rgb;
  #include <opaque_fragment>`;

function patch(m: THREE.MeshToonMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <gradientmap_pars_fragment>", GRADIENT)
      .replace("#include <opaque_fragment>", RIM);
  };
  m.customProgramCacheKey = () => "seoul-toon-1";
  return m;
}

const cache = new Map<string, THREE.MeshToonMaterial>();

/** The shared toon material for a flat colour. */
export function toon(color: string) {
  let m = cache.get(color);
  if (!m) {
    m = patch(new THREE.MeshToonMaterial({ color, gradientMap: getRamp() }));
    cache.set(color, m);
  }
  return m;
}

/** A toon material with more settings (a pattern, two sides, glow, out of the fog), cached by its settings. */
export function toonWith(o: { color: string; map?: THREE.Texture; side?: THREE.Side; fog?: boolean; emissive?: string; emissiveIntensity?: number; key?: string }) {
  const key = o.key ?? `${o.color}|${o.map?.uuid ?? ""}|${o.side ?? 0}|${o.fog ?? true}|${o.emissive ?? ""}|${o.emissiveIntensity ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    m = patch(
      new THREE.MeshToonMaterial({
        color: o.color,
        map: o.map ?? null,
        side: o.side ?? THREE.FrontSide,
        fog: o.fog ?? true,
        gradientMap: getRamp(),
        ...(o.emissive ? { emissive: new THREE.Color(o.emissive), emissiveIntensity: o.emissiveIntensity ?? 1 } : {}),
      }),
    );
    cache.set(key, m);
  }
  return m;
}

/** A toon material of its own, for a glow that changes over time (lamps). */
export function toonGlow(color: string, emissive: string, emissiveIntensity = 0) {
  return patch(new THREE.MeshToonMaterial({ color, emissive: new THREE.Color(emissive), emissiveIntensity, gradientMap: getRamp() }));
}

/** A toon material of its own, for parts whose texture changes (the face). */
export function toonMapped(map: THREE.Texture) {
  return patch(new THREE.MeshToonMaterial({ color: "#ffffff", map, gradientMap: getRamp() }));
}

/** A colour a little darker or lighter, for seams, pockets and cuffs. */
export function shadeOf(color: string, k: number) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(1, hsl.s * (k < 1 ? 1.06 : 0.9)), Math.min(1, hsl.l * k));
  return `#${c.getHexString()}`;
}
