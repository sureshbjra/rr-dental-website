"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

/** Registers GSAP plugins and site-wide defaults once, browser only. */
export function registerGSAP() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  // Mobile: the address bar showing/hiding resizes the viewport — don't re-calculate every trigger
  // (and jump pinned sections) for that.
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Signature eases
  CustomEase.create("cinematic", "0.76,0,0.24,1"); // slow-in, slow-out for transitions & wipes
  CustomEase.create("reveal", "0.16,1,0.3,1"); // long, soft landing for text and cards
  registered = true;

  // Development only (stripped from production builds): lets tests inspect triggers and tweens.
  if (process.env.NODE_ENV === "development") {
    (window as Window & { __rrGsap?: unknown }).__rrGsap = { gsap, ScrollTrigger };
  }
}

registerGSAP();

/**
 * Media queries for gsap.matchMedia(). Every animation is written per-context so phones get
 * tuned variants and reduced-motion users get none.
 *
 * Pinned, full-screen scroll scenes run on desktop and on phones / tablets with at least 700px of
 * height (`mobileTall`, matching the CSS `tall:` variant in globals.css). Shorter screens — small or
 * landscape phones — can't fit a full-screen scene, so they get in-place animations (`mobileShort`).
 */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
  mobileTall: "(max-width: 1023px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
  mobileShort: "(max-width: 1023px) and (max-height: 699px) and (prefers-reduced-motion: no-preference)",
  finePointer: "(pointer: fine) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(MQ.reduce).matches;
}

/** Marks animation setup as done — the inline <head> script reveals everything if this never happens. */
export function markAnimationsReady() {
  (window as Window & { __rrAnimReady?: boolean }).__rrAnimReady = true;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
