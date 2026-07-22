import { LatheGeometry, Vector2 } from "three";
import type { BufferGeometry } from "three";

/**
 * A button cap as ONE lathed surface: a straight skirt turning through a chamfer into a slightly
 * dished top. The chamfer is real geometry, not a normal map — it has to catch an actual rim
 * highlight, the exact thing a flat disc-on-disc stack could not (the grimoire's #1 "fake" tell is
 * a perfectly sharp edge; laptop's slab() makes the same argument for its bevel).
 *
 * Extracted from the remote once the gamepad needed the same cap — the second consumer is what
 * justifies a shared file, not the first (per the plan's own hold on premature extraction). It
 * returns geometry, not a Mesh, so each caller applies its own material.
 */

/** The top of the dish, as a fraction of cap height: <1 dishes the centre below the rim. */
export const CAP_TOP = 0.96;

export const lathedCap = (r: number, h: number, segments = 28): BufferGeometry => {
  const pt = (rad: number, y: number): Vector2 => new Vector2(r * rad, h * y);
  // skirt (full radius) → chamfer in → dished top centre
  const profile = [pt(1, 0), pt(1, 0.5), pt(0.94, 0.72), pt(0.78, 0.9), pt(0.48, 0.99), pt(0, CAP_TOP)];
  const geo = new LatheGeometry(profile, segments);
  geo.rotateX(Math.PI / 2); // lathe revolves around Y; turn the cap to face +Z like everything else
  return geo;
};
