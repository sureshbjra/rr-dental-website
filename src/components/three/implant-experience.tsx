"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CylinderGeometry, LatheGeometry, MathUtils, MeshStandardMaterial, Vector2, type Group } from "three";

export type ImplantPart = "Crown" | "Abutment" | "Implant fixture";

function ImplantModel({ exploded, selected }: { exploded: boolean; selected: ImplantPart[] }) {
  const crown = useRef<Group>(null);
  const abutment = useRef<Group>(null);
  const metal = useMemo(() => new MeshStandardMaterial({ color: "#a9c3d2", metalness: 0.82, roughness: 0.23 }), []);
  const crownMaterial = useMemo(() => new MeshStandardMaterial({ color: "#f2f8fc", roughness: 0.18, metalness: 0.02 }), []);
  const crownGeometry = useMemo(() => new LatheGeometry([
    new Vector2(0.15, 0), new Vector2(0.19, 0.05), new Vector2(0.28, 0.16),
    new Vector2(0.32, 0.34), new Vector2(0.3, 0.52), new Vector2(0.23, 0.67), new Vector2(0.11, 0.74), new Vector2(0, 0.76),
  ], 48), []);
  const fixtureGeometry = useMemo(() => new CylinderGeometry(0.17, 0.22, 0.84, 48, 1, false), []);
  const abutmentGeometry = useMemo(() => new CylinderGeometry(0.14, 0.2, 0.33, 48), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const separation = exploded ? 1 : 0;
    if (crown.current) crown.current.position.y = MathUtils.damp(crown.current.position.y, 0.35 + separation * 0.48, 7, dt);
    if (abutment.current) abutment.current.position.y = MathUtils.damp(abutment.current.position.y, 0.28 + separation * 0.16, 7, dt);
  });

  return (
    <group rotation={[0.02, -0.2, -0.04]}>
      {selected.includes("Implant fixture") && (
        <group position-y={-0.42}>
          <mesh geometry={fixtureGeometry} material={metal} castShadow receiveShadow />
          {Array.from({ length: 7 }, (_, index) => (
            <mesh key={index} position-y={-0.79 + index * 0.115} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.19 - index * 0.006, 0.018, 8, 40]} />
              <primitive object={metal} attach="material" />
            </mesh>
          ))}
        </group>
      )}
      {selected.includes("Abutment") && (
        <group ref={abutment} position-y={0.28}>
          <mesh geometry={abutmentGeometry} material={metal} castShadow />
          <mesh position-y={0.17}>
            <cylinderGeometry args={[0.17, 0.14, 0.05, 48]} />
            <primitive object={metal} attach="material" />
          </mesh>
        </group>
      )}
      {selected.includes("Crown") && (
        <group ref={crown} position-y={0.35}>
          <mesh geometry={crownGeometry} material={crownMaterial} castShadow receiveShadow />
          <mesh position={[0, 0.2, 0.015]} scale={[0.38, 0.78, 0.36]}>
            <sphereGeometry args={[0.42, 32, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.14} transparent opacity={0.22} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function ImplantExperience({ exploded, selected }: { exploded: boolean; selected: ImplantPart[] }) {
  return (
    <Canvas camera={{ position: [2.5, 1.4, 4.8], fov: 38 }} dpr={[1, 1.5]} shadows gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 5, 4]} intensity={3} color="#f2f8ff" castShadow />
      <pointLight position={[-3, 0, -2]} intensity={18} color="#38bdf8" />
      <pointLight position={[2, -1, 3]} intensity={8} color="#7ba9c9" />
      <ImplantModel exploded={exploded} selected={selected} />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={3} maxDistance={7} />
    </Canvas>
  );
}
