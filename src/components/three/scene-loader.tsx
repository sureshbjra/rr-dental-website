"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";

const ThreeDScene = dynamic(() => import("./three-d-scene"), { ssr: false, loading: () => null });

/**
 * Pre-rendered still of the scene's first frame (same camera, lighting and pose; transparent WebP).
 * Server-rendered, so it paints immediately and is the hero's LCP element; the live canvas fades in
 * over it once ready. It is also the permanent fallback when WebGL is unavailable or the scene fails.
 * `object-cover` keeps the tooth the same size as the live canvas (vertical field of view is fixed).
 */
export function ToothPoster({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static, pre-optimised asset with an explicit srcset
    <img
      src={asset("/images/tooth-poster-1600.webp")}
      srcSet={`${asset("/images/tooth-poster-800.webp")} 800w, ${asset("/images/tooth-poster-1600.webp")} 1600w`}
      sizes="(min-width: 1024px) 52vw, 100vw"
      width={1600}
      height={1026}
      alt=""
      fetchPriority="high"
      decoding="async"
      draggable={false}
      className={cn("pointer-events-none absolute inset-0 size-full object-cover select-none", className)}
    />
  );
}

// Probed once per session: creating a context is not free, and the home route re-runs its
// effects every time it's shown again (cacheComponents keeps it mounted while hidden).
let webglSupport: boolean | undefined;
function hasWebGL() {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webglSupport = !!gl;
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** If the 3D scene throws (driver error, lost context…), keep the page alive and show the poster. */
class SceneErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Client-only 3D hero. The three.js chunk is requested once the browser is idle after hydration,
 * so it never competes with first paint; until the first frame renders the poster stands in.
 */
export function ThreeDSceneLoader() {
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasWebGL()) return; // stay on the poster
    const start = () => setLive(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative size-full">
      <ToothPoster className={cn("transition-opacity duration-700", ready && "opacity-0")} />
      {live && (
        <SceneErrorBoundary
          onError={() => {
            setReady(false);
            setLive(false);
          }}
        >
          <ThreeDScene onReady={() => setReady(true)} />
        </SceneErrorBoundary>
      )}
    </div>
  );
}
