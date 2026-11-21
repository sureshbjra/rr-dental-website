"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type Group } from "three";
import { scrollState } from "@/lib/scroll-state";

const SPIN_SPEED = 0.3; // rad/s → one turn ≈ 21 s
const BASE_TILT_X = 0.2; // tip the crown slightly towards camera to show the occlusal surface
const BASE_TILT_Z = -0.14;
const POINTER_TILT = { x: 0.16, z: 0.12 };

/** Window-wide pointer position in [-1, 1], updated without React re-renders. */
const pointer = { x: 0, y: 0 };

/**
 * Smooth motion for the tooth:
 * - constant-velocity spin about its own long axis (frame-rate independent, clamped delta)
 * - critically damped parallax tilt that follows the cursor anywhere on the page
 * - scroll-driven 3D turn: as the hero scrolls away the tooth swings round and tips its crown
 *   towards the viewer (progress comes from the hero's ScrollTrigger, damped here for smoothness)
 */
export function ToothRig({ children, animate }: { children: React.ReactNode; animate: boolean }) {
  const tilt = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const scroll = useRef<Group>(null);

  useEffect(() => {
    if (!animate || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [animate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30); // no jumps after tab switches / long frames
    if (spin.current) {
      if (animate) spin.current.rotation.y += dt * SPIN_SPEED;
    }
    if (scroll.current) {
      const p = scrollState.hero.progress;
      scroll.current.rotation.y = MathUtils.damp(scroll.current.rotation.y, p * Math.PI * 1.15, 4, dt);
      scroll.current.rotation.x = MathUtils.damp(scroll.current.rotation.x, p * 0.65, 4, dt);
      scroll.current.position.y = MathUtils.damp(scroll.current.position.y, p * 0.35, 4, dt);
      scroll.current.scale.setScalar(1 + MathUtils.clamp(p, 0, 1) * 0.2);
    }
    if (tilt.current) {
      const px = animate ? pointer.x : 0;
      const py = animate ? pointer.y : 0;
      tilt.current.rotation.x = MathUtils.damp(tilt.current.rotation.x, BASE_TILT_X + py * POINTER_TILT.x, 3, dt);
      tilt.current.rotation.z = MathUtils.damp(tilt.current.rotation.z, BASE_TILT_Z - px * POINTER_TILT.z, 3, dt);
    }
  });

  return (
    <group ref={tilt} rotation={[BASE_TILT_X, 0, BASE_TILT_Z]}>
      <group ref={scroll}>
        <group ref={spin} rotation-y={-0.6}>
          {children}
        </group>
      </group>
    </group>
  );
}
