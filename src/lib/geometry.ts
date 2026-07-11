// Pure camera/orbit math — the "unit-testable" core of two whole bug classes.
// These let a fast unit test catch "object left the frame" (footgun #6) and
// "satellite clips through the central object" (footgun #8) with ARITHMETIC,
// before a single pixel is rendered. Keep scene code and tests reading the same
// functions so an invariant can't silently drift from what actually renders.

const DEG2RAD = Math.PI / 180;

/**
 * Half-width of the visible frame at a given depth in front of a three.js
 * PerspectiveCamera. `fovDeg` is three's VERTICAL fov; `dist` is the distance
 * from the camera to the depth plane (camZ − objectZ). Multiply by aspect for
 * the horizontal half-width (aspect = width/height; 1 for a 1:1 composition).
 *
 * Bybit: visibleHalfWidth(34, 7.8) ≈ 2.38 — the number the orbit must stay under.
 */
export const visibleHalfWidth = (fovDeg: number, dist: number, aspect = 1) =>
  Math.tan((fovDeg * DEG2RAD) / 2) * dist * aspect;

/**
 * Does an orbit of radius `orbitR` (of a satellite with half-size `satHalf`)
 * stay inside the frame at the object's depth? `margin` = extra breathing room.
 * Guards footgun #6 (orbit wider than the frame → satellites fly off-screen).
 */
export const orbitFitsFrame = (
  orbitR: number,
  satHalf: number,
  halfWidth: number,
  margin = 0,
) => orbitR + satHalf + margin <= halfWidth;

/**
 * Minimum orbit radius so a satellite never intersects the central object.
 * `sweptR` = the half-width the spinning/tilting central object sweeps
 * (its half-width + tilt contribution). Guards footgun #8.
 */
export const minSafeOrbit = (sweptR: number, satHalf: number, gap = 0) =>
  sweptR + satHalf + gap;

/** Does `orbitR` clear the swept central object? (footgun #8) */
export const orbitClearsObject = (
  orbitR: number,
  sweptR: number,
  satHalf: number,
  gap = 0,
) => orbitR >= minSafeOrbit(sweptR, satHalf, gap);
