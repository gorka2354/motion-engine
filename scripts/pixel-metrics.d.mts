// Types for pixel-metrics.mjs so tsc can check the metric imports in the tests.
export type Frame = { width: number; height: number; data: Uint8Array | Buffer };

export function lumaAt(px: Frame, i: number): number;
export function centerStats(
  png: Frame,
  frac?: number,
): { mean: number; std: number };
export function frameDiff(a: Frame, b: Frame): number;
export function pixelmatchRatio(a: Frame, b: Frame, threshold?: number): number;
export function ssimScore(a: Frame, b: Frame): number;
export function silhouetteBox(
  png: Frame,
  tolerance?: number,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  aspect: number;
  fill: number;
  coverage: number;
} | null;
export function silhouetteMask(
  png: Frame,
  tolerance?: number,
): {
  mask: Uint8Array;
  width: number;
  height: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
} | null;
export type SilhouetteFeatures = {
  aspect: number;
  fill: number;
  symmetryH: number;
  elongation: number;
  axisAngle: number;
};
export function silhouetteFeatures(
  png: Frame,
  tolerance?: number,
): SilhouetteFeatures | null;
export function classifyView(
  features: SilhouetteFeatures | null,
  options?: { frontSymmetry?: number; frontAspect?: number | null; sideNarrowing?: number },
): {
  view: "front" | "side" | "three-quarter" | "turned" | "unknown";
  confidence: number;
  reason: string;
};
