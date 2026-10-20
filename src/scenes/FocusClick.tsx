import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function FocusClick({ enabled }: { enabled: boolean }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; update: () => void }
    | null;

  const ray = useMemo(() => new THREE.Raycaster(), []);
  const desired = useRef<THREE.Vector3 | null>(null);
  const down = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;

    const pick = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - r.left) / r.width) * 2 - 1,
        -((clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(scene.children, true);
      for (const h of hits) {
        const o = h.object as THREE.Mesh;
        if (!(o as unknown as { isMesh?: boolean }).isMesh || !o.visible) continue;
        let anc: THREE.Object3D | null = o;
        let isMarker = false;
        while (anc) {
          if (anc.userData.__marker) {
            isMarker = true;
            break;
          }
          anc = anc.parent;
        }
        if (isMarker) continue;
        return h.point.clone();
      }
      return null;
    };

    const onDown = (e: PointerEvent) => {
      down.current = { x: e.clientX, y: e.clientY };
    };
    const onContext = (e: MouseEvent) => {
      const d = down.current;
      down.current = null;
      if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
      const p = pick(e.clientX, e.clientY);
      if (p) desired.current = p;
    };
    const onDbl = (e: MouseEvent) => {
      const p = pick(e.clientX, e.clientY);
      if (p) desired.current = p;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("contextmenu", onContext);
    el.addEventListener("dblclick", onDbl);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("contextmenu", onContext);
      el.removeEventListener("dblclick", onDbl);
    };
  }, [enabled, gl, camera, scene, ray]);

  useFrame(() => {
    if (!enabled || !desired.current || !controls) return;
    const t = controls.target;
    const k = 1 - Math.pow(0.0016, 1 / 60);
    t.lerp(desired.current, k);

    const dir = camera.position.clone().sub(t);
    const dist = dir.length();
    const want = Math.min(dist, 1.5);
    camera.position.copy(t).add(dir.setLength(Math.max(want, dist - 0.06)));
    controls.update();

    if (t.distanceTo(desired.current) < 0.004) desired.current = null;
  });

  return null;
}
