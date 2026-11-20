"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/scroll-state";

/**
 * Creates the site-wide Lenis instance, driven by GSAP's ticker so ScrollTrigger stays in sync.
 * Touch devices keep native scrolling (syncTouch off): native momentum feels right on phones and
 * is the most reliable base for pinned sections on iOS / Android.
 */
export function useLenis(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false, anchors: true });
    lenisRef.current = lenis;
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [enabled]);

  return lenisRef;
}
