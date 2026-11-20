"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { brand } from "@/config/theme";

/**
 * Procedural product-photography studio. A dark environment with a few bright soft-boxes gives the
 * clearcoated enamel crisp, readable reflections (rendered once into the env map — no HDR download).
 * Direct lights add form and the cinematic blue rims.
 */
export function StudioLighting({ envResolution }: { envResolution: number }) {
  return (
    <>
      <Environment resolution={envResolution} frames={1} background={false}>
        <color attach="background" args={["#020913"]} />
        {/* Key soft-box, upper left — the main window reflection on the crown */}
        <Lightformer form="rect" intensity={7} color="#f6faff" position={[-3, 3, 3.5]} scale={[3.2, 2.2, 1]} target={[0, 0, 0]} />
        {/* Overhead strip — long specular streak across the cusps */}
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[0.5, 5, 0]} rotation-x={Math.PI / 2} scale={[5, 0.5, 1]} />
        {/* Thin vertical kicker, front right — defines the right-hand edge */}
        <Lightformer form="rect" intensity={3} color="#e8f4ff" position={[4, 0.5, 3]} scale={[0.35, 5, 1]} target={[0, 0, 0]} />
        {/* Brand-blue rims from behind */}
        <Lightformer form="rect" intensity={9} color={brand.accent} position={[4.5, 0.5, -3.5]} scale={[0.8, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={5} color={brand.accentSoft} position={[-4.5, -0.5, -3]} scale={[0.6, 6, 1]} target={[0, 0, 0]} />
        {/* Faint cool floor bounce so the undersides don't go dead */}
        <Lightformer form="circle" intensity={0.6} color={brand.bgSecondary} position={[0, -4, 0.5]} rotation-x={-Math.PI / 2} scale={5} />
      </Environment>

      {/* Key: shapes the crown; the shadow side stays darker for depth */}
      <directionalLight position={[-3, 4.5, 4]} intensity={1.25} color="#f4f8ff" />
      {/* Cinematic rims */}
      <directionalLight position={[4, 1.5, -4]} intensity={3.5} color={brand.accent} />
      <directionalLight position={[-4.5, 0.5, -2.5]} intensity={1.8} color={brand.accentSoft} />
      {/* Under-glow from the holo base */}
      <pointLight position={[0, -1.6, 0.8]} intensity={2.4} distance={3.5} decay={2} color={brand.accent} />
    </>
  );
}
