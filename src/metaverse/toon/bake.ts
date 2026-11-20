import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toonVertex } from "./material";

/**
 * A figure is some forty small parts, each with its own outline: about 130 draw calls with
 * shadows, which is what made a room of six travelers heavy. Parts that move together (everything
 * on the torso, on one arm, on one foot…) are baked into one mesh per moving joint, coloured per
 * vertex, with one outline mesh beside it. The originals stay mounted but hidden, so React can
 * still update or remove them; call the returned function before baking again.
 */

const isOutline = (m: THREE.Material) => {
  const u = (m as THREE.ShaderMaterial).uniforms;
  return !!u && "thickness" in u && "screenspace" in u;
};

function piece(mesh: THREE.Mesh, toJoint: THREE.Matrix4, color: THREE.Color | null) {
  const src = mesh.geometry;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", src.getAttribute("position").clone());
  const n = src.getAttribute("normal");
  if (n) g.setAttribute("normal", n.clone());
  g.setIndex(src.index ? src.index.clone() : Array.from({ length: g.getAttribute("position").count }, (_, i) => i));
  if (!n) g.computeVertexNormals();
  if (color) {
    const count = g.getAttribute("position").count;
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) c.set([color.r, color.g, color.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  }
  g.applyMatrix4(toJoint);
  return g;
}

export function bakeFigure(root: THREE.Object3D, joints: THREE.Object3D[]): () => void {
  const isJoint = new Set(joints.filter(Boolean));
  root.traverse((o) => o.userData.live && isJoint.add(o));
  isJoint.add(root);
  root.updateMatrixWorld(true);

  type Bucket = { joint: THREE.Object3D; outline: boolean; cast: boolean; material: THREE.Material; parts: THREE.BufferGeometry[]; sources: THREE.Mesh[] };
  const buckets = new Map<string, Bucket>();
  const inv = new Map<THREE.Object3D, THREE.Matrix4>();

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.baked || Array.isArray(mesh.material) || !mesh.visible) return;
    const outline = isOutline(mesh.material);
    if (!outline && !mesh.material.userData.flat) return;
    let joint: THREE.Object3D = mesh.parent!;
    while (!isJoint.has(joint)) joint = joint.parent!;
    if (!inv.has(joint)) inv.set(joint, joint.matrixWorld.clone().invert());
    const key = `${joint.uuid}|${outline}|${mesh.castShadow}`;
    let b = buckets.get(key);
    if (!b) {
      b = { joint, outline, cast: !outline && mesh.castShadow, material: outline ? mesh.material : toonVertex(), parts: [], sources: [] };
      buckets.set(key, b);
    }
    const toJoint = new THREE.Matrix4().multiplyMatrices(inv.get(joint)!, mesh.matrixWorld);
    b.parts.push(piece(mesh, toJoint, outline ? null : (mesh.material as THREE.MeshToonMaterial).color));
    b.sources.push(mesh);
  });

  const made: THREE.Mesh[] = [];
  const hidden: THREE.Mesh[] = [];
  for (const b of buckets.values()) {
    const geometry = mergeGeometries(b.parts, false);
    b.parts.forEach((p) => p.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, b.material);
    mesh.userData.baked = true;
    mesh.castShadow = b.cast;
    b.joint.add(mesh);
    made.push(mesh);
    for (const s of b.sources) {
      s.visible = false;
      hidden.push(s);
    }
  }
  return () => {
    for (const m of made) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    for (const s of hidden) s.visible = true;
  };
}
