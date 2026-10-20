import { useEffect, useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  ORGAN_UNITS,
  ORGAN_MODEL_URLS,
  OrganUnit,
  organScale,
  transformMeters,
} from "../data/organModels";
import { ORGAN_BY_ID } from "../data/organs";
import { Selection } from "./selection";
import Marker from "./Marker";
import { useScene } from "../store/useScene";
import { IS_SOFTWARE_GL } from "./layers";

for (const url of ORGAN_MODEL_URLS) useGLTF.preload(url, false);

type Part = {
  mesh: THREE.Mesh;
  side: "left" | "right" | null;
  base: THREE.Material;
  included: boolean;
};

type View = {
  root: THREE.Group;
  parts: Part[];
  mirrored: boolean;
  id: string | null;
};

const meshLabel = (o: THREE.Object3D): string => o.name.replace(/_/g, " ");

const expandBoxByMesh = (box: THREE.Box3, mesh: THREE.Mesh, tmp: THREE.Box3) => {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  if (mesh.geometry.boundingBox) {
    box.union(tmp.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
  }
};

function OrganUnitModel({
  unit,
  height,
  selected,
  hovered,
  showMarkers,
  showLabels,
  onSelect,
  onHover,
}: {
  unit: OrganUnit;
  height: number;
  selected: Selection | null;
  hovered: string | null;
  showMarkers: boolean;
  showLabels: boolean;
  onSelect: (s: Selection) => void;
  onHover: (id: string | null) => void;
}) {
  const gltf = useGLTF(unit.url, false);
  const scale = organScale(height) * (unit.mul ?? 1);

  const { views, localCenters } = useMemo(() => {
    const tmpBox = new THREE.Box3();
    const build = (mirrored: boolean): View => {
      const root = gltf.scene.clone(true) as THREE.Group;
      root.updateMatrixWorld(true);
      const box = new THREE.Box3();
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) expandBoxByMesh(box, m, tmpBox);
      });
      const center = box.getCenter(new THREE.Vector3());
      const flipped = mirrored !== Boolean(unit.flipX);
      if (unit.center !== "body") {
        root.position.set(flipped ? center.x : -center.x, -center.y, -center.z);
      }
      if (flipped) root.scale.x *= -1;
      root.updateMatrixWorld(true);

      const parts: Part[] = [];
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const label = meshLabel(mesh);
        const included =
          (!unit.include || unit.include.test(label)) &&
          !(unit.exclude && unit.exclude.test(label));
        if (!included) {
          mesh.visible = false;
          mesh.raycast = () => {};
          return;
        }
        const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial & {
          transmission?: number;
        };
        let mat: THREE.Material;
        if (IS_SOFTWARE_GL) {
          const baseCol = new THREE.Color(unit.color).lerp(
            src.color ? src.color : new THREE.Color("#ffffff"),
            0.35,
          );
          mat = new THREE.MeshLambertMaterial({
            color: baseCol,
            side: flipped ? THREE.DoubleSide : THREE.FrontSide,
          });
        } else {
          const cloned = src.clone() as THREE.MeshStandardMaterial & { transmission?: number };
          if (typeof cloned.transmission === "number" && cloned.transmission > 0) {
            cloned.transmission = 0;
          }
          if (flipped) cloned.side = THREE.DoubleSide;
          mat = cloned;
        }
        mesh.material = mat;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        parts.push({
          mesh,
          side: unit.nodeSide ? unit.nodeSide(label) : null,
          base: mat,
          included,
        });
      });
      return { root, parts, mirrored, id: null };
    };

    let views: View[];
    if (unit.mirror) {
      views = [build(false), build(true)];
      views[0].id = unit.ids[0];
      views[1].id = unit.ids[1];
    } else {
      views = [build(false)];
    }

    const localCenters: THREE.Vector3[] = unit.ids.map((_, i) => {
      const vi = unit.mirror ? i : 0;
      const view = views[vi] ?? views[0];
      const partBox = new THREE.Box3();
      const targetSide = unit.pair ? (i === 0 ? "left" : "right") : null;
      for (const p of view.parts) {
        if (!p.included) continue;
        if (targetSide && p.side && p.side !== targetSide) continue;
        expandBoxByMesh(partBox, p.mesh, tmpBox);
      }
      if (partBox.isEmpty()) {
        return new THREE.Vector3();
      }
      return partBox.getCenter(new THREE.Vector3());
    });

    return { views, localCenters };
  }, [gltf.scene, unit]);

  const selId = selected?.kind === "organ" ? selected.id : null;

  useEffect(() => {
    for (const view of views) {
      for (const p of view.parts) {
        if (!p.included) continue;
        const match = view.id
          ? view.id
          : unit.pair
            ? p.side === "right"
              ? unit.ids[1]
              : unit.ids[0]
            : unit.ids[0];
        const neutral = !!unit.pair && p.side === null;
        const applies = (id: string | null) =>
          id !== null && (neutral ? unit.ids.includes(id) : match === id);
        const active = applies(selId);
        const hovering = applies(hovered);
        const dim = !!selId && !active;
        const mat = p.base as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          mat.emissive.set(unit.color);
          mat.emissiveIntensity = active ? 0.5 : hovering ? 0.28 : 0;
        }
        mat.transparent = dim;
        mat.opacity = dim ? 0.12 : 1;
        mat.depthWrite = !dim;
        mat.needsUpdate = true;
      }
    }
  }, [selId, hovered, views, unit]);

  const idFrom = (view: View, obj: THREE.Object3D) => {
    if (view.id) return view.id;
    const label = meshLabel(obj);
    const side = unit.nodeSide && label ? unit.nodeSide(label) : null;
    return unit.pair ? (side === "right" ? unit.ids[1] : unit.ids[0]) : unit.ids[0];
  };

  const anchorLocal = useMemo(() => transformMeters(unit.anchor, height), [unit.anchor, height]);
  const meterScale = organScale(height);

  const markers = useMemo(() => {
    const off = unit.markerOffset ?? [0, 0, 0];
    return unit.ids.map((id, i) => {
      const viewAnchor: [number, number, number] =
        unit.mirror && i === 1
          ? [-anchorLocal[0], anchorLocal[1], anchorLocal[2]]
          : anchorLocal;
      const v = (localCenters[i] ?? new THREE.Vector3()).clone().multiplyScalar(scale);
      if (unit.rot) {
        v.applyEuler(new THREE.Euler(...unit.rot));
      }
      v.add(new THREE.Vector3(...viewAnchor));
      v.x += off[0] * meterScale;
      v.y += off[1] * meterScale;
      v.z += off[2] * meterScale;
      const pos: [number, number, number] = [v.x, v.y, v.z];
      return { id, pos };
    });
  }, [unit.ids, unit.mirror, unit.rot, unit.markerOffset, anchorLocal, localCenters, scale, meterScale]);

  useEffect(() => {
    const entries: Record<string, [number, number, number]> = {};
    for (const m of markers) {
      entries[m.id] = [m.pos[0], m.pos[1] - 0.2, m.pos[2]];
    }
    useScene.getState().setCenters(entries);
  }, [markers]);

  return (
    <group>
      {views.map((view, vi) => {
        const viewAnchor: [number, number, number] =
          vi === 0 ? anchorLocal : [-anchorLocal[0], anchorLocal[1], anchorLocal[2]];
        return (
          <group key={vi} position={viewAnchor} rotation={unit.rot} scale={scale}>
            <primitive
              object={view.root}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onSelect({ kind: "organ", id: idFrom(view, e.object) });
              }}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                onHover(idFrom(view, e.object));
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                onHover(null);
                document.body.style.cursor = "auto";
              }}
            />
          </group>
        );
      })}

      {showMarkers &&
        markers
          .filter((m) => m.id !== selId)
          .map((m) => (
            <group key={m.id} position={m.pos}>
              <Marker
                color={unit.color}
                label={showLabels ? (ORGAN_BY_ID[m.id]?.name.id ?? "") : ""}
                showLabel={hovered === m.id}
                onHover={(over) => onHover(over ? m.id : null)}
                onClick={() => onSelect({ kind: "organ", id: m.id })}
              />
            </group>
          ))}
    </group>
  );
}

export default function RealOrgans({
  height,
  selected,
  hovered,
  showMarkers,
  showLabels,
  onSelect,
  onHover,
}: {
  height: number;
  selected: Selection | null;
  hovered: string | null;
  showMarkers: boolean;
  showLabels: boolean;
  onSelect: (s: Selection) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <group>
      {ORGAN_UNITS.map((unit) => (
        <OrganUnitModel
          key={unit.key}
          unit={unit}
          height={height}
          selected={selected}
          hovered={hovered}
          showMarkers={showMarkers}
          showLabels={showLabels}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
