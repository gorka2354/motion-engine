import { Shape, Vector2 } from "three";
import type { LoftSection } from "../loft";
import { OBJECT_CLASSES } from "../knowledge/objectClasses";

/**
 * Form definition for the controller: ONE continuous shell whose cross-section changes shape with
 * depth. Derived from five reference views plus published class dimensions.
 *
 * WHY MONOLITHIC. A controller is a moulded part — one continuous surface, no hard transitions.
 * Building it as a housing plus two grip lobes was tried and came out worse than what it
 * replaced: without a boolean union and a fillet, two intersecting meshes read as two objects
 * with a visible seam. The real object has no seam, so the model shouldn't invent one.
 *
 * WHY A MORPHING SECTION. Scaling one contour can only make a form bigger or smaller. A gamepad
 * needs its section to change SHAPE with depth: at the face plate the section is the full
 * silhouette, but 60 mm behind it only the grips remain — the centre housing is 28 mm deep, less
 * than half the overall figure. That is why every earlier attempt inflated the middle. One
 * contour and one depth cannot describe an object whose parts have different depths.
 *
 * Units: body width = 4, scaled from the class millimetres.
 */

const CLASS = OBJECT_CLASSES.gamepad;
const MM = CLASS.boundingMm;

export const U = 4 / MM.width;
export const BODY_W = MM.width * U;
export const BODY_H = MM.height * U;
/** Overall depth — belongs to the GRIPS, not to the body as a whole. */
export const FULL_DEPTH = MM.depth * U;
/** The centre housing: a measured sub-part, roughly half the overall depth. */
export const FACE_DEPTH = 28 * U;

/** The face plate. Flat because a plateau of full-size sections holds it flat. */
export const FACE_Z = FACE_DEPTH * 0.5;

/**
 * Front silhouette, traced from the reference. The bbox aspect drifts only 4.4% from the photo, so
 * the OVERALL size is right — but the outline used to descend from the shoulders to the grip tip
 * monotonically, and that is exactly why the grips read as one mass with the body. A real
 * controller necks IN below the shoulder (a concave waist where the thumb wraps) and then flares
 * back out into the grip lobe. Those three points on the outer edge — waist-in, grip-out — are the
 * grip definition; the bbox is unchanged (widest is still the shoulder, lowest still the tip), so
 * the silhouette-aspect gate stays satisfied while the SHAPE gains a defined grip.
 */
const FRONT_RIGHT: [number, number][] = [
  [0.0, 1.28],
  [0.2, 1.31],
  [0.43, 1.34],
  [0.7, 1.36],
  [0.95, 1.375],
  [1.1, 1.37],
  [1.36, 1.31],
  [1.63, 1.16],
  [1.86, 0.87],
  [1.97, 0.52],
  [2.0, 0.2],
  [1.94, -0.06],
  [1.79, -0.3], // waist begins — the outer edge draws in below the shoulder
  [1.70, -0.53], // narrowest of the neck
  [1.76, -0.74], // grip flares back out into its lobe (rounded, not winged)
  [1.62, -0.96],
  [1.4, -1.16],
  [1.15, -1.33],
  [0.87, -1.41],
  [0.68, -1.32],
  [0.52, -1.12],
  [0.4, -0.9],
  [0.27, -0.74],
  [0.0, -0.64],
];

const SAMPLES = 128;

const mirroredRing = (right: [number, number][], samples: number): Vector2[] => {
  const s = new Shape();
  const pts = right.map(([x, y]) => new Vector2(x, y));
  const left = right
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => new Vector2(-x, y));
  s.moveTo(pts[0].x, pts[0].y);
  s.splineThru(pts.slice(1));
  s.splineThru(left);
  s.closePath();
  return s.getSpacedPoints(samples);
};

export const frontOutline = (): Vector2[] => mirroredRing(FRONT_RIGHT, SAMPLES);

/**
 * The same ring with its central upper region pulled DOWN — what the section looks like deep
 * behind the face, where the shallow centre housing has ended and only the grip lobes continue.
 *
 * Derived FROM the front ring so point counts match and the two interpolate. `pull` is strongest
 * on the centre line and fades toward the grips, producing the deep saddle between two lobes that
 * the back-view reference shows.
 */
/** Height of the grip axis. Grips live in the LOWER half — the body does not taper around y = 0. */
const GRIP_Y = -0.45;

/**
 * Contract the ring toward the grip axis. `centrePull` applies on the centre line, `gripPull` out
 * at the lobes, blended smoothly between — 0 keeps a point, 1 collapses it onto y = GRIP_Y.
 *
 * Contracting toward GRIP_Y rather than shrinking with `scale` is the whole point. `scale` pulls
 * toward the ORIGIN, which lifts the bottom of each grip while leaving its top at full height, so
 * the back of the body came out as a tall slab and the side view filled 88% of its bbox. Real
 * grips taper around their own axis into a teardrop; contracting toward that axis reproduces it.
 */
const taper = (ring: Vector2[], centrePull: number, gripPull: number, reach = 1.45): Vector2[] =>
  ring.map((p) => {
    const centreness = Math.max(0, 1 - Math.abs(p.x) / reach);
    const k = centreness * centreness; // smooth falloff — a linear one creases at the boundary
    const pull = gripPull + (centrePull - gripPull) * k;
    return new Vector2(p.x * (1 - 0.08 * k), p.y + (GRIP_Y - p.y) * pull);
  });

const front = frontOutline();

/**
 * Depth stack, back → front.
 *
 * The plateau of full-outline, full-scale sections near the front IS the flat face plate. Behind
 * it the ring recedes progressively, so volume accumulates at the grips while the centre stays
 * shallow — the thing a single scaled contour could never express.
 */
export const BODY_SECTIONS: LoftSection[] = [
  // Back of the grips. `scale` stays HIGH on purpose: it shrinks the whole ring toward the origin,
  // grips included, so using it to thin the body pulls the grips toward the centre line and the
  // side wall flares into a bowl (measured — the first morphing build rendered as a cupped shell).
  // Relief is the OUTLINE's job; scale only rounds the last few millimetres off the ends.
  { z: FACE_Z - FULL_DEPTH, scale: 0.9, outline: taper(front, 0.95, 0.6) },
  { z: FACE_Z - FULL_DEPTH * 0.9, scale: 0.96, outline: taper(front, 0.86, 0.42) },
  { z: FACE_Z - FULL_DEPTH * 0.75, scale: 0.98, outline: taper(front, 0.68, 0.26) },
  { z: FACE_Z - FULL_DEPTH * 0.6, scale: 0.99, outline: taper(front, 0.45, 0.14) },
  // Back of the centre housing: 28 mm behind the face plate, where the shallow middle ends and
  // only the grips carry on.
  { z: FACE_Z - FACE_DEPTH, scale: 0.995, outline: taper(front, 0.18, 0.05) },
  // The plateau of full-outline, full-scale sections IS the flat face plate.
  { z: FACE_Z - FACE_DEPTH * 0.55, scale: 1.0, outline: front },
  { z: FACE_Z * 0.5, scale: 1.0, outline: front },
  { z: FACE_Z * 0.85, scale: 0.995, outline: front },
  { z: FACE_Z * 0.96, scale: 0.97, outline: front },
  { z: FACE_Z, scale: 0.9, outline: front },
];

/**
 * Backward lean of the grips, read off the side view. Deliberately small: the receding sections
 * already do most of the work, and an earlier version that leaned on warp alone produced grips
 * that read as trouser legs.
 */
export const gripSweep = (x: number, y: number, z: number): [number, number, number] => {
  const g = Math.min(1, Math.max(0, -(y + 0.2) / 1.2));
  return [x, y, z - g * g * 0.16];
};
