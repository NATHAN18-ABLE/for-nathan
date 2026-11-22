import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static scenery is hundreds of small meshes (posts, walls, roofs, each with an ink outline),
 * one draw call each, twice over with the shadow pass. Once the scene has settled, bake every
 * plain mesh into a few large meshes, one per material (and one for all the outlines), and hide
 * the originals. Hidden meshes still answer raycasts, so tapping the ground and the camera's
 * wall check keep working. Instanced meshes (trees, leaves) are already cheap and stay as they are.
 */

const isOutline = (m: THREE.Material) => {
  const u = (m as THREE.ShaderMaterial).uniforms;
  return !!u && "thickness" in u && "screenspace" in u;
};

function prepared(src: THREE.BufferGeometry, matrix: THREE.Matrix4, withUv: boolean) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", src.getAttribute("position").clone());
  const n = src.getAttribute("normal");
  if (n) g.setAttribute("normal", n.clone());
  else {
    g.setIndex(src.index ? src.index.clone() : null);
    g.computeVertexNormals();
  }
  if (withUv) {
    const uv = src.getAttribute("uv");
    g.setAttribute("uv", uv ? uv.clone() : new THREE.BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
  }
  if (src.index) g.setIndex(src.index.clone());
  else g.setIndex(Array.from({ length: g.getAttribute("position").count }, (_, i) => i));
  g.applyMatrix4(matrix);
  return g;
}

export function mergeStatic(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<string, { material: THREE.Material; cast: boolean; receive: boolean; parts: THREE.BufferGeometry[]; sources: THREE.Mesh[] }>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || (mesh as THREE.SkinnedMesh).isSkinnedMesh) return;
    if (Array.isArray(mesh.material) || !mesh.visible) return;
    const material = mesh.material;
    const outline = isOutline(material);
    if (!outline && !(material instanceof THREE.MeshToonMaterial)) return;
    const key = outline ? "outline" : `${material.uuid}|${mesh.castShadow}|${mesh.receiveShadow}`;
    let group = groups.get(key);
    if (!group) {
      group = { material, cast: !outline && mesh.castShadow, receive: !outline && mesh.receiveShadow, parts: [], sources: [] };
      groups.set(key, group);
    }
    const local = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
    group.parts.push(prepared(mesh.geometry, local, !outline && !!(material as THREE.MeshToonMaterial).map));
    group.sources.push(mesh);
  });

  const baked = new THREE.Group();
  baked.name = "baked-scenery";
  for (const g of groups.values()) {
    if (g.parts.length < 2) continue; // nothing to gain
    const geometry = mergeGeometries(g.parts, false);
    g.parts.forEach((p) => p.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, g.material);
    mesh.castShadow = g.cast;
    mesh.receiveShadow = g.receive;
    mesh.frustumCulled = false;
    // The originals stay for raycasts but no longer draw or cast shadows.
    for (const s of g.sources) {
      s.visible = false;
      s.raycast = isOutline(s.material as THREE.Material) ? () => {} : s.raycast;
    }
    baked.add(mesh);
  }
  root.add(baked);
  return baked;
}
