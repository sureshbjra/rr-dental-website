import type Lenis from "lenis";

/**
 * Tiny shared mutable state for scroll-driven effects that live outside React's render cycle
 * (e.g. the R3F tooth reads `hero.progress` every frame). Mutated by GSAP, never by React.
 */
export const scrollState = {
  hero: {
    /** 0 → 1 as the hero scrolls out of view (drives the tooth's exit turn). */
    progress: 0,
    /** 0 → 1 across the scan pass: the scanner ring descends, then returns (sin curve in the scene). */
    scan: 0,
  },
};

/** Scan depth as a 0…1 fraction of the scanned range: down then back up across the pass. */
export const scanDepth = (scan: number) => Math.sin(Math.min(Math.max(scan, 0), 1) * Math.PI);

/** How far the scan travels, as a fraction of the tooth's height (cusp tips → mid-root). */
export const SCAN_REACH = 0.62;
/** Tooth height in mm (from the GLB build) — for the live readout. */
export const TOOTH_HEIGHT_MM = 22.6;

let lenis: Lenis | null = null;

/** The site-wide Lenis instance (null on reduced motion or before mount). */
export const getLenis = () => lenis;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

/** Page-transition state, so entrance animations can wait for the overlay to lift. */
export const transitionState = { active: false };

/** Delay (s) for on-load entrance animations: longer when arriving through a page transition. */
export const enterDelay = (base = 0.15) => (transitionState.active ? base + 0.55 : base);
