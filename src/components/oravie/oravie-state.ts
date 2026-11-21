/**
 * Shared, mutable animation state for the Oravie page. GSAP writes to it (the intro tween and the
 * pinned scroll) and the 3D scene reads it every frame — no React re-renders involved.
 *
 * journey: 0 → 1 across the Dental Care Journey —
 *   0.00 healthy · 0.25 problem identified (decay) · 0.50 treatment (cross-section, canals cleaned)
 *   · 0.75–1.00 restored smile.
 */
export const oravieState = {
  intro: 0,
  journey: 0,
  reduced: false,
};

export const resetOravieState = () => {
  oravieState.intro = 0;
  oravieState.journey = 0;
};

/** Journey stage index (0–3) for a progress value — shared by the scene and the step markers. */
export const journeyStage = (p: number) => (p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.76 ? 2 : 3);
