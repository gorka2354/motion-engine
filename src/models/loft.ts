import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from "three";

/**
 * Loft a closed outline through a stack of cross-sections.
 *
 * WHY THIS EXISTS. `ExtrudeGeometry` sweeps an outline at CONSTANT thickness — perfect for
 * things that really are slabs (a laptop deck, a card), useless for anything sculpted. The first
 * photo-sourced controller was extruded that way: its front silhouette matched the reference to
 * 1.4%, and it still read as a flat biscuit, because the outline was right and the volume was
 * absent. The L5-fidelity flatness-check now fails that shape (side view filled 92% of its own
 * bbox against a 0.85 gate).
 *
 * Lofting fixes the cause: the same outline is placed at several depths, each scaled by its own
 * factor, and the sections are skinned together. Scale the middle sections up and the end ones
 * down and the form bulges — which is what real moulded hardware does.
 *
 * `warp` runs after positioning and can bend the result (e.g. sweep a controller's grips
 * backwards), which no amount of section scaling can express.
 */
export interface LoftSection {
  /** Depth of this section along Z. */
  z: number;
  /** Uniform factor, or [x, y] to squash a section anisotropically. */
  scale: number | [number, number];
  /** Shift the section in Y — lets a form lean rather than only taper. */
  offsetY?: number;
}

export interface LoftOptions {
  /** Bend/pinch hook applied per vertex after placement. `t` is 0..1 across the depth stack. */
  warp?: (x: number, y: number, z: number, t: number) => [number, number, number];
  /** Close the front and back faces. Off only when the form is capped by something else. */
  caps?: boolean;
}

/**
 * @param outline closed contour (no repeated last point), counter-clockwise
 * @param sections at least two, ordered back-to-front
 */
export const loftGeometry = (
  outline: Vector2[],
  sections: LoftSection[],
  options: LoftOptions = {},
): BufferGeometry => {
  if (outline.length < 3) throw new Error("loftGeometry: outline needs at least 3 points");
  if (sections.length < 2) throw new Error("loftGeometry: needs at least 2 sections");
  const { warp, caps = true } = options;

  // Normalise winding. Face orientation follows the outline's direction, so a contour traced the
  // other way round builds the shell inside-out: with FrontSide materials the sides vanish and
  // the backdrop shows through the object. Callers shouldn't have to know which way to trace —
  // the phone body was drawn clockwise, the gamepad counter-clockwise, and both must work.
  const signedArea = outline.reduce((sum, p, i) => {
    const q = outline[(i + 1) % outline.length];
    return sum + (p.x * q.y - q.x * p.y);
  }, 0);
  if (signedArea < 0) outline = outline.slice().reverse();

  const n = outline.length;
  const positions: number[] = [];
  const indices: number[] = [];

  // ── ring vertices, section by section ──
  sections.forEach((section, s) => {
    const t = sections.length === 1 ? 0 : s / (sections.length - 1);
    const [sx, sy] = Array.isArray(section.scale)
      ? section.scale
      : [section.scale, section.scale];
    const dy = section.offsetY ?? 0;
    for (const p of outline) {
      let x = p.x * sx;
      let y = p.y * sy + dy;
      let z = section.z;
      if (warp) [x, y, z] = warp(x, y, z, t);
      positions.push(x, y, z);
    }
  });

  // ── skin between consecutive rings ──
  for (let s = 0; s < sections.length - 1; s++) {
    const a = s * n;
    const b = (s + 1) * n;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // Winding matters: reversed, every normal points INWARD, and with FrontSide materials the
      // shell's sides simply vanish — you see the backdrop through the object. Verified by test
      // (a vertex normal must have a positive dot with its own outward radius).
      indices.push(a + i, a + j, b + i);
      indices.push(a + j, b + j, b + i);
    }
  }

  // ── caps: triangulate the outline itself (it is concave, so no fan) ──
  if (caps) {
    const faces = ShapeUtils.triangulateShape(outline, []);
    const back = 0;
    const front = (sections.length - 1) * n;
    for (const [a, b, c] of faces) {
      // Caps and sides do NOT share a winding rule — flipping both together (a plausible-looking
      // fix) leaves the sides right and punches a hole through the front. With the outline
      // normalised counter-clockwise, triangulateShape's order already faces +Z, so the FRONT cap
      // is used as-is and only the BACK one is reversed.
      indices.push(front + a, front + b, front + c);
      indices.push(back + c, back + b, back + a);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
};

/**
 * Convenience profile: sections along a lens/ellipsoid curve, so a form bulges in the middle and
 * rounds off at both ends instead of ending in a hard rim.
 *
 * @param depth total depth, centred on z = 0
 * @param count number of sections (more = smoother ends)
 * @param bulge 0 = straight tube, 1 = full elliptical falloff
 * @param frontBias >0 pushes the widest section toward the viewer (most hardware is fuller at
 *        the front than the back)
 */
export const lensSections = (
  depth: number,
  count = 9,
  bulge = 1,
  frontBias = 0,
): LoftSection[] => {
  const out: LoftSection[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0 = back, 1 = front
    const z = (t - 0.5) * depth;
    // distance from the widest point, shifted toward the front by frontBias
    const centre = 0.5 + frontBias * 0.5;
    const d = Math.min(1, Math.abs(t - centre) / Math.max(centre, 1 - centre));
    const scale = Math.sqrt(Math.max(0, 1 - d * d * bulge));
    out.push({ z, scale: Math.max(0.04, scale) });
  }
  return out;
};
