"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BackSide, Color, DoubleSide, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { useGLTF } from "@react-three/drei";
import { TOOTH_MODEL_URL } from "@/config/models";

export type AnatomyPart = "Enamel" | "Dentin" | "Pulp" | "Root";

const hotspots: { part: AnatomyPart; position: [number, number, number] }[] = [
  { part: "Enamel", position: [0.43, 0.82, 0.22] },
  { part: "Dentin", position: [-0.4, 0.28, 0.3] },
  { part: "Pulp", position: [0.36, -0.12, 0.23] },
  { part: "Root", position: [-0.26, -0.88, 0.24] },
];

function Tooth({ activePart, onSelect }: { activePart: AnatomyPart; onSelect: (part: AnatomyPart) => void }) {
  // This GLB is meshopt-compressed, like the hero model.
  const { nodes } = useGLTF(TOOTH_MODEL_URL, false, true);
  const tooth = nodes.Tooth as Mesh;
  const pulp = nodes.Pulp as Mesh;
  const enamelMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: new Color(activePart === "Dentin" ? "#dfc9a2" : activePart === "Root" ? "#ecdfc8" : "#eef7ff"),
    roughness: 0.2,
    metalness: 0.02,
    clearcoat: 0.72,
    clearcoatRoughness: 0.12,
    transparent: activePart === "Dentin" || activePart === "Pulp",
    opacity: activePart === "Dentin" ? 0.16 : activePart === "Pulp" ? 0.13 : 1,
    side: DoubleSide,
    depthWrite: activePart !== "Dentin" && activePart !== "Pulp",
  }), [activePart]);
  const dentinMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color("#d8b58c"),
    roughness: 0.42,
    transparent: activePart !== "Dentin",
    opacity: activePart === "Dentin" ? 0.96 : 0,
    side: BackSide,
    depthWrite: activePart === "Dentin",
  }), [activePart]);
  const pulpMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color("#59d4ff"),
    emissive: new Color("#1477bb"),
    emissiveIntensity: activePart === "Pulp" ? 1.3 : 0.25,
    roughness: 0.28,
  }), [activePart]);

  useEffect(() => () => {
    enamelMaterial.dispose();
    dentinMaterial.dispose();
    pulpMaterial.dispose();
  }, [dentinMaterial, enamelMaterial, pulpMaterial]);

  return (
    <group rotation={[0.08, -0.3, -0.08]}>
      <mesh geometry={tooth.geometry} position={tooth.position} rotation={tooth.rotation} scale={tooth.scale} material={enamelMaterial} castShadow />
      <mesh geometry={tooth.geometry} position={tooth.position} rotation={tooth.rotation} scale={[0.83, 0.84, 0.83]} material={dentinMaterial} visible={activePart === "Dentin" || activePart === "Pulp"} />
      <mesh geometry={pulp.geometry} position={pulp.position} rotation={pulp.rotation} scale={pulp.scale} material={pulpMaterial} visible={activePart === "Pulp"} />
      {hotspots.map(({ part, position }) => (
        <Html key={part} position={position} center distanceFactor={6} style={{ pointerEvents: "auto" }}>
          <button
            type="button"
            aria-label={`Explore ${part}`}
            aria-pressed={activePart === part}
            onClick={(event) => { event.stopPropagation(); onSelect(part); }}
            className={`font-ui flex size-8 items-center justify-center rounded-full border text-[10px] transition-all ${activePart === part ? "scale-110 border-cyan bg-cyan text-navy shadow-[0_0_22px_rgb(56_189_248/0.8)]" : "border-mist/50 bg-navy/80 text-mist hover:border-cyan"}`}
          >
            {part.slice(0, 1)}
          </button>
        </Html>
      ))}
    </group>
  );
}

export default function AnatomyScene({ activePart, onSelect }: { activePart: AnatomyPart; onSelect: (part: AnatomyPart) => void }) {
  return (
    <Canvas camera={{ position: [0, 0.02, 3.8], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 4, 4]} intensity={2.3} color="#dff4ff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.8} color="#38bdf8" />
      <spotLight position={[0, 4, 1]} intensity={1.7} angle={0.55} penumbra={0.7} color="#ffffff" />
      <Tooth activePart={activePart} onSelect={onSelect} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={2.7} maxDistance={5.8} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
  );
}
