"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, MathUtils, SRGBColorSpace, Vector3, type Group, type MeshBasicMaterial } from "three";
import { scanPlanes, SCAN_BOTTOM, SCAN_NORMAL, SCAN_TILT, SCAN_TOP } from "@/components/three/tooth/tooth-model";
import { scanDepth, scrollState } from "@/lib/scroll-state";
import { brand } from "@/config/theme";

function sheetTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(56,189,248,0)");
  g.addColorStop(0.8, "rgba(56,189,248,0.07)");
  g.addColorStop(0.97, "rgba(167,221,255,0.26)");
  g.addColorStop(1, "rgba(167,221,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/**
 * The scanner: a horizontal ring and light sheet that travel down the tooth and back as the hero
 * scrolls. It owns the clip planes' height each frame, so cut, point cloud and ring stay in lockstep.
 */
const point = new Vector3();
const PARKED = new Vector3(0, 99, 0);

export function ScanRing() {
  const group = useRef<Group>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const outer = useRef<MeshBasicMaterial>(null);
  const sheet = useRef<MeshBasicMaterial>(null);
  const tex = useMemo(() => sheetTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(() => {
    const d = scanDepth(scrollState.hero.scan);
    const active = d > 0.002;
    const h = MathUtils.lerp(SCAN_TOP, SCAN_BOTTOM, d);
    point.set(0, h, 0);
    scanPlanes.above.setFromNormalAndCoplanarPoint(SCAN_NORMAL, active ? point : PARKED);
    scanPlanes.below.copy(scanPlanes.above).negate();

    if (!group.current) return;
    group.current.visible = active;
    group.current.position.y = h;
    const fade = MathUtils.smoothstep(d, 0, 0.1);
    if (ring.current) ring.current.opacity = 0.95 * fade;
    if (outer.current) outer.current.opacity = 0.35 * fade;
    if (sheet.current) sheet.current.opacity = fade;
  });

  return (
    // Tilted with the scan plane: a torus lies in XY, so rotating x by (tilt − 90°) aligns its normal.
    <group ref={group} visible={false} rotation-x={SCAN_TILT - Math.PI / 2}>
      <mesh renderOrder={3}>
        <torusGeometry args={[1.12, 0.0055, 8, 192]} />
        <meshBasicMaterial ref={ring} color={brand.accent} transparent toneMapped={false} />
      </mesh>
      <mesh renderOrder={3}>
        <torusGeometry args={[1.3, 0.003, 6, 192]} />
        <meshBasicMaterial ref={outer} color={brand.accentSoft} transparent toneMapped={false} />
      </mesh>
      <mesh renderOrder={2}>
        <circleGeometry args={[1.12, 96]} />
        <meshBasicMaterial ref={sheet} map={tex} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}
