/**
 * 3D asset URLs. Kept free of three.js imports so server / initial-bundle code (e.g. the hero's
 * preload link) can reference them without pulling three.js into the first load.
 */
import { asset } from "@/lib/asset";

export const TOOTH_MODEL_URL = asset("/models/tooth.glb");

/** The home page hero's copy of the tooth: geometry only (see scripts/tooth/slim-tooth.mjs). */
export const TOOTH_HERO_MODEL_URL = asset("/models/tooth-hero.glb");
