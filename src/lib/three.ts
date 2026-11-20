import { NeutralToneMapping } from "three";

/** Rendering quality tier. "high" = desktop / capable GPUs, "low" = phones and weak GPUs. */
export type QualityTier = "high" | "low";

export const qualitySettings = {
  high: { dpr: [1, 1.75] as [number, number], envResolution: 256, shadowResolution: 512, liveShadows: true }, // shadow is blurred: 512² looks identical to 1024² at ¼ the fill cost
  low: { dpr: [1, 1.5] as [number, number], envResolution: 128, shadowResolution: 256, liveShadows: false },
} satisfies Record<QualityTier, unknown>;

/** Shared Three.js / R3F settings for every scene. */
export const canvasDefaults = {
  gl: {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance" as const,
    // AgX keeps bright enamel highlights from clipping and holds the blue rims without hue shift.
    toneMapping: NeutralToneMapping,
    toneMappingExposure: 1.0,
  },
  camera: { position: [0, 0.35, 6.4] as [number, number, number], fov: 34, near: 0.1, far: 50 },
};

/** Lighter rendering on small / low-power devices. */
export function isLowPowerDevice() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return window.innerWidth < 768 || coarse || (navigator.hardwareConcurrency ?? 8) <= 4 || memory <= 4;
}
