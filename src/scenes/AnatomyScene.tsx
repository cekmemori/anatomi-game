import { Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Layers, IS_SOFTWARE_GL } from "./layers";
import GltfBody from "./GltfBody";
import FocusClick from "./FocusClick";
import { Selection } from "./selection";
import ErrorBoundary from "../components/ErrorBoundary";

export type Mode = "gltf" | "organ";

export type TourTarget = { focus: [number, number, number]; dist: number };

function Rig({ autoRotate, enabled }: { autoRotate: boolean; enabled: boolean }) {
  return (
    <OrbitControls
      makeDefault
      enabled={enabled}
      enablePan
      screenSpacePanning
      panSpeed={0.9}
      zoomSpeed={0.9}
      enableDamping={!IS_SOFTWARE_GL}
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={7}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
      target={[0, 0.72, 0]}
    />
  );
}

function CameraDirector({
  target,
  active,
}: {
  target: TourTarget | null;
  active: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; update: () => void }
    | null;
  useFrame((_, dt) => {
    if (!active || !target || !controls) return;
    const t = new THREE.Vector3(...target.focus);
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-4) dir.set(0.55, 0.3, 1);
    dir.normalize();
    const desired = t.clone().add(dir.multiplyScalar(target.dist));
    const k = 1 - Math.pow(0.0006, Math.min(dt, 0.05));
    camera.position.lerp(desired, k);
    controls.target.lerp(t, k);
    controls.update();
  });
  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight intensity={0.4} groundColor="#0b1020" color="#a5f3fc" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} />
      <pointLight position={[-3, 2, 2]} intensity={18} distance={9} color="#22d3ee" />
      <pointLight position={[3, -1, -2]} intensity={14} distance={9} color="#a855f7" />
    </>
  );
}

export default function AnatomyScene({
  mode = "gltf",
  layers,
  selected = null,
  hovered = null,
  showLabels,
  showMarkers = true,
  autoRotate,
  tourTarget = null,
  tourActive = false,
  onSelect,
  onHover,
}: {
  mode?: Mode;
  layers: Layers;
  selected?: Selection | null;
  hovered?: string | null;
  showLabels: boolean;
  showMarkers?: boolean;
  autoRotate: boolean;
  tourTarget?: TourTarget | null;
  tourActive?: boolean;
  onSelect?: (s: Selection) => void;
  onHover?: (id: string | null) => void;
}) {
  return (
    <div role="region" aria-label="Model anatomi 3D interaktif" className="relative h-full w-full">
      <p className="sr-only">
        Model anatomi 3D interaktif. Untuk pengguna keyboard atau pembaca layar, pilih organ
        melalui daftar organ di panel samping atau kolom pencarian.
      </p>
      <ErrorBoundary>
        <Canvas
          frameloop={IS_SOFTWARE_GL && !tourActive ? "demand" : "always"}
          dpr={IS_SOFTWARE_GL ? 1 : [1, 1.5]}
          gl={{ antialias: !IS_SOFTWARE_GL, alpha: true }}
          camera={{ position: [1.7, 1.0, 2.9], fov: 42 }}
          onCreated={({ scene }) => {
            (window as unknown as { __scene?: unknown }).__scene = scene;
          }}
        >
          <color attach="background" args={["#070b14"]} />
          <fog attach="fog" args={["#070b14", 7, 15]} />

          <Lights />

          <Suspense fallback={null}>
            <GltfBody
              layers={mode === "organ" ? { ...layers, muscular: false } : layers}
              selected={selected}
              hovered={hovered}
              showLabels={showLabels}
              showMarkers={showMarkers}
              ghost={mode === "organ"}
              onSelect={(s) => onSelect?.(s)}
              onHover={(id) => onHover?.(id)}
            />
          </Suspense>

          {!IS_SOFTWARE_GL && (
            <>
              <ContactShadows frames={1} position={[0, -1.95, 0]} opacity={0.5} scale={9} blur={2.6} far={4} color="#0ea5e9" />
              <EffectComposer>
                <Bloom intensity={0.85} luminanceThreshold={0.28} luminanceSmoothing={0.35} mipmapBlur radius={0.7} />
                <Vignette eskil={false} offset={0.25} darkness={0.85} />
              </EffectComposer>
            </>
          )}

          <Rig autoRotate={autoRotate && !tourActive && !IS_SOFTWARE_GL} enabled={!tourActive} />
          <FocusClick enabled={!tourActive} />
          <CameraDirector target={tourTarget} active={tourActive} />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
