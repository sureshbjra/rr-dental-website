"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Float, PerformanceMonitor } from "@react-three/drei";
import { ToothModel } from "@/components/three/tooth/tooth-model";
import { ToothRig } from "@/components/three/tooth/tooth-rig";
import { StudioLighting } from "@/components/three/tooth/studio-lighting";
import { ScanRing } from "@/components/three/tooth/scan-ring";
import { canvasDefaults, isLowPowerDevice, qualitySettings, type QualityTier } from "@/lib/three";

const FLOOR_Y = -1.42;

/** Development only: exposes the renderer so tests can read draw calls and GPU memory. */
function DevStats() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as Window & { __rrGL?: unknown };
    w.__rrGL = gl;
    return () => {
      if (w.__rrGL === gl) w.__rrGL = undefined;
    };
  }, [gl]);
  return null;
}

/** Live `prefers-reduced-motion` (no motion-library dependency in the 3D chunk). */
const REDUCE = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCE);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCE).matches,
    () => false
  );
}

/** Fires once the model has mounted and two frames have been drawn — time to retire the poster. */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    let a = 0;
    let b = 0;
    a = requestAnimationFrame(() => (b = requestAnimationFrame(() => onReady?.())));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [onReady]);
  return null;
}

/** Pauses rendering while the canvas is scrolled out of view. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Hero 3D scene: the molar under cinematic blue studio light, with the scroll-driven scanner. */
export default function ThreeDScene({ onReady }: { onReady?: () => void }) {
  const [quality, setQuality] = useState<QualityTier>(() => (isLowPowerDevice() ? "low" : "high"));
  const settings = qualitySettings[quality];
  // Never render above the screen's own pixel ratio (a plain number is used verbatim by R3F).
  const maxDpr = Math.min(window.devicePixelRatio || 1, settings.dpr[1]);
  const [dpr, setDpr] = useState(maxDpr);
  const animate = !usePrefersReducedMotion();
  const [wrapperRef, inView] = useInView<HTMLDivElement>();

  return (
    // Named for assistive tech by the hero's wrapper (role="img"), so the label also covers the poster.
    <div ref={wrapperRef} className="absolute inset-0">
      <Canvas
        {...canvasDefaults}
        dpr={dpr}
        // Off-screen: no rendering. Reduced motion: the scene is static, so render only on change.
        frameloop={!inView ? "never" : animate ? "always" : "demand"}
        style={{ touchAction: "pan-y" }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true; // the hero scan cuts the tooth with world-space planes
        }}
      >
        <PerformanceMonitor
          bounds={(refresh) => (refresh > 90 ? [50, 90] : [45, 58])}
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(1, +(d - 0.25).toFixed(2)))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, +(d + 0.25).toFixed(2)))}
          onFallback={() => {
            setQuality("low");
            setDpr(1);
          }}
        />

        {process.env.NODE_ENV === "development" && <DevStats />}
        <StudioLighting envResolution={settings.envResolution} />

        {/* One boundary: tooth, base and contact shadow appear together once the GLB is decoded. */}
        <Suspense fallback={null}>
          <group position-y={0.12}>
            <Float enabled={animate} speed={1.3} rotationIntensity={0.12} floatIntensity={0.45} floatingRange={[-0.05, 0.05]}>
              <ToothRig animate={animate}>
                <ToothModel quality={quality} />
              </ToothRig>
            </Float>

            <ContactShadows
              position-y={FLOOR_Y}
              scale={4}
              far={2.6}
              blur={2.8}
              opacity={0.5}
              color="#010812"
              resolution={settings.shadowResolution}
              frames={settings.liveShadows && animate ? Infinity : 1}
            />
          </group>
          {/* World-space scanner; owns the clip planes. */}
          <ScanRing />
          <ReadySignal onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}
