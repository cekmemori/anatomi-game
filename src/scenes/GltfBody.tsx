import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Selection } from "./selection";
import RealOrgans from "./RealOrgans";
import { Layers, IS_SOFTWARE_GL } from "./layers";
import { useScene } from "../store/useScene";

export const MODEL_URL = "/models/body.glb";
const DRACO_PATH = "/draco/";
const H_TARGET = 1.8;

useGLTF.preload(MODEL_URL, DRACO_PATH);

const BONE_COLOR = new THREE.Color("#e9eef7");
const MUSCLE_COLOR = new THREE.Color("#c0455a");
const HILITE_COLOR = new THREE.Color("#22d3ee");

type Group = "bone" | "muscle" | "other";

export default function GltfBody({
  layers,
  selected,
  hovered,
  showLabels,
  showMarkers = true,
  ghost = false,
  onSelect,
  onHover,
}: {
  layers: Layers;
  selected: Selection | null;
  hovered: string | null;
  showLabels: boolean;
  showMarkers?: boolean;
  ghost?: boolean;
  onSelect: (s: Selection) => void;
  onHover: (id: string | null) => void;
}) {
  const gltf = useGLTF(MODEL_URL, DRACO_PATH);

  const mats = useRef({
    bone: IS_SOFTWARE_GL
      ? new THREE.MeshLambertMaterial({ color: BONE_COLOR })
      : new THREE.MeshStandardMaterial({
          color: BONE_COLOR,
          roughness: 0.5,
          metalness: 0.12,
        }),
    muscle: IS_SOFTWARE_GL
      ? new THREE.MeshLambertMaterial({ color: MUSCLE_COLOR })
      : new THREE.MeshStandardMaterial({
          color: MUSCLE_COLOR,
          roughness: 0.62,
          metalness: 0.04,
        }),
    hi: IS_SOFTWARE_GL
      ? new THREE.MeshLambertMaterial({
          color: HILITE_COLOR,
          emissive: HILITE_COLOR,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.92,
        })
      : new THREE.MeshStandardMaterial({
          color: HILITE_COLOR,
          emissive: HILITE_COLOR,
          emissiveIntensity: 1.15,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.92,
        }),
  }).current;

  const { root, height, xs, meshes } = useMemo(() => {
    const clone = gltf.scene.clone(true) as THREE.Group;
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3();
    const tmpBox = new THREE.Box3();
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      if (m.geometry.boundingBox) {
        box.union(tmpBox.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld));
      }
    });
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const S = H_TARGET / (size.y || 1);
    clone.scale.setScalar(S);
    clone.position.set(-center.x * S, -box.min.y * S, -center.z * S);
    clone.updateMatrixWorld(true);

    const list: THREE.Mesh[] = [];
    const tmp = new THREE.Vector3();
    let xr = 0;
    let xl = 0;

    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const raw = (mesh.userData.type as Group) || "other";
      const grp: Group = raw === "bone" || raw === "muscle" ? raw : "other";
      if (grp === "other") {
        mesh.visible = false;
        mesh.raycast = () => {};
        return;
      }
      list.push(mesh);
      mesh.userData.__grp = grp;
      mesh.userData.__orig = mesh.material;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      if (!mesh.userData.__meta) {
        mesh.userData.__meta = {
          name: (mesh.userData.name as string) || mesh.name || "Struktur",
          description: (mesh.userData.description as string) || undefined,
          wiki: (mesh.userData.wikiLink as string) || undefined,
          group: grp,
          system: grp === "muscle" ? "muscular" : "skeletal",
        };
      }
      mesh.getWorldPosition(tmp);
      if (/\.[rR]$/.test(mesh.name) && xr === 0) xr = tmp.x;
      if (/\.[lL]$/.test(mesh.name) && xl === 0) xl = tmp.x;
    });

    const xsSign = xr !== 0 && xl !== 0 ? (xr > xl ? 1 : -1) : 1;

    return { root: clone, height: size.y * S, xs: xsSign, meshes: list };
  }, [gltf.scene]);

  useEffect(() => {
    useScene.getState().setMeasure(height, xs);
  }, [height, xs]);

  useEffect(() => {
    for (const m of meshes) {
      const grp = m.userData.__grp as Group;
      const visible =
        grp === "bone"
          ? layers.skeleton
          : grp === "muscle"
            ? layers.muscular && !ghost
            : false;
      m.visible = visible;
      if (visible) {
        m.raycast = THREE.Mesh.prototype.raycast;
        m.material = grp === "muscle" ? mats.muscle : mats.bone;
      } else {
        m.raycast = () => {};
      }
    }
  }, [layers, meshes, mats, ghost]);

  const selId =
    selected?.kind === "mesh" ? selected.id : selected ? "__organ__" : null;

  useEffect(() => {
    for (const m of meshes) {
      if (!m.visible) continue;
      const grp = m.userData.__grp as Group;
      const active = selId === m.name || (hovered === m.name && selId !== "__organ__");
      m.material = active ? mats.hi : grp === "muscle" ? mats.muscle : mats.bone;
    }
  }, [selId, hovered, meshes, mats]);

  useEffect(() => {
    const dim = selected !== null || ghost;
    const opacity = selected !== null ? 0.3 : ghost ? 0.14 : 1;
    for (const m of [mats.bone, mats.muscle]) {
      m.transparent = dim;
      m.opacity = opacity;
      m.depthWrite = !dim;
      m.needsUpdate = true;
    }
  }, [selected, mats, ghost]);

  const pickFrom = (obj: THREE.Object3D): THREE.Mesh | null => {
    const m = obj as THREE.Mesh;
    if (!m.isMesh || !m.visible) return null;
    return m;
  };

  return (
    <group position={[0, -0.2, 0]}>
      <group
        onPointerMove={(e) => {
          const m = pickFrom(e.object);
          const meta = m?.userData.__meta;
          onHover(meta ? m!.name : null);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          const m = pickFrom(e.object);
          const meta = m?.userData.__meta;
          if (!m || !meta) return;
          onSelect({
            kind: "mesh",
            id: m.name,
            name: meta.name,
            description: meta.description,
            wiki: meta.wiki,
            group: meta.group,
            system: meta.system,
          });
        }}
      >
        <primitive object={root} />
      </group>

      {layers.organs && (
        <RealOrgans
          height={height}
          selected={selected}
          hovered={hovered}
          showMarkers={showMarkers && (layers.skeleton || layers.muscular || ghost)}
          showLabels={showLabels}
          onSelect={onSelect}
          onHover={onHover}
        />
      )}
    </group>
  );
}
