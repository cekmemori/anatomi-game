import * as THREE from "three";
import fs from "fs";
import path from "path";

const dir = process.argv[2] ?? "public/models/organs";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".glb"))
  .map((f) => path.join(dir, f));

function readJsonChunk(buf) {
  const jsonLen = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
}

function nodeMatrix(node) {
  const m = new THREE.Matrix4();
  if (node.matrix) {
    m.fromArray(node.matrix);
    return m;
  }
  const t = node.translation ? new THREE.Vector3().fromArray(node.translation) : new THREE.Vector3();
  const q = node.quaternion ? new THREE.Quaternion().fromArray(node.quaternion) : new THREE.Quaternion();
  const s = node.scale ? new THREE.Vector3().fromArray(node.scale) : new THREE.Vector3(1, 1, 1);
  return m.compose(t, q, s);
}

for (const f of files) {
  const json = readJsonChunk(fs.readFileSync(f));
  const accessors = json.accessors ?? [];
  const meshes = json.meshes ?? [];
  const nodes = json.nodes ?? [];
  const box = new THREE.Box3();
  box.makeEmpty();

  const visit = (idx, parent) => {
    const node = nodes[idx];
    if (!node) return;
    const world = parent.clone().multiply(nodeMatrix(node));
    if (node.mesh !== undefined) {
      for (const prim of meshes[node.mesh].primitives ?? []) {
        const acc = accessors[prim.attributes.POSITION];
        if (!acc?.min || !acc?.max) continue;
        const mn = acc.min;
        const mx = acc.max;
        for (let i = 0; i < 8; i++) {
          const v = new THREE.Vector3(
            i & 1 ? mx[0] : mn[0],
            i & 2 ? mx[1] : mn[1],
            i & 4 ? mx[2] : mn[2],
          ).applyMatrix4(world);
          box.expandByPoint(v);
        }
      }
    }
    for (const c of node.children ?? []) visit(c, world);
  };
  for (const root of json.scenes?.[json.scene ?? 0]?.nodes ?? []) {
    visit(root, new THREE.Matrix4());
  }

  const s = new THREE.Vector3();
  const c = new THREE.Vector3();
  box.getSize(s);
  box.getCenter(c);
  const r = (v) => v.map((n) => n.toFixed(4)).join(", ");
  console.log(
    path.basename(f).padEnd(22),
    "size=[" + r(s.toArray()) + "]",
    "min=[" + r(box.min.toArray()) + "]",
    "cen=[" + r(c.toArray()) + "]",
    "max=[" + r(box.max.toArray()) + "]",
  );
}
