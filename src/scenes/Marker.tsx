import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";

export default function Marker({
  color,
  label,
  showLabel,
  onClick,
  onHover,
}: {
  color: string;
  label?: string;
  showLabel?: boolean;
  onClick: () => void;
  onHover?: (over: boolean) => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime % 2.2) / 2.2;
    if (ring.current) {
      ring.current.scale.setScalar(0.5 + t * 0.9);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - t);
    }
  });

  return (
    <Billboard>
      <group
        renderOrder={999}
        userData={{ __marker: true }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover?.(false);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh renderOrder={998}>
          <circleGeometry args={[0.024, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={999}>
          <circleGeometry args={[0.008, 20]} />
          <meshBasicMaterial color={color} toneMapped={false} depthTest={false} transparent />
        </mesh>
        <mesh renderOrder={999}>
          <ringGeometry args={[0.01, 0.014, 28]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            toneMapped={false}
            depthTest={false}
          />
        </mesh>
        <mesh ref={ring} renderOrder={999}>
          <ringGeometry args={[0.011, 0.015, 28]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            toneMapped={false}
            depthTest={false}
          />
        </mesh>

        {label && showLabel && (
          <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
            <div
              aria-hidden="true"
              style={{
                transform: "translateY(-18px)",
                fontSize: 11,
                lineHeight: 1.15,
                fontWeight: 700,
                whiteSpace: "nowrap",
                color: "#f8fafc",
                background: "rgba(7,11,20,0.94)",
                padding: "3px 8px",
                borderRadius: 8,
                border: `1.5px solid ${color}`,
                boxShadow: "0 4px 14px rgba(0,0,0,0.65)",
              }}
            >
              {label}
            </div>
          </Html>
        )}
      </group>
    </Billboard>
  );
}
