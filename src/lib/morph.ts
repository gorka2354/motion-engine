import { evolvePath, interpolatePath } from "@remotion/paths";
import { clamp01 } from "../v2/anim";

/**
 * Morph SVG path A → B at progress t (0..1, clamped).
 * Both paths must share the same command structure (count + types) —
 * e.g. two blobs built from the same number of cubic segments.
 */
export const morphPath = (a: string, b: string, t: number) =>
  interpolatePath(clamp01(t), a, b);

/**
 * Draw-on reveal: stroke props that draw `path` from nothing to full at
 * progress t (0..1). Spread the result into an SVG <path>.
 */
export const drawPath01 = (path: string, t: number) => {
  const { strokeDasharray, strokeDashoffset } = evolvePath(clamp01(t), path);
  return { strokeDasharray, strokeDashoffset };
};
