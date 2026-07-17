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
