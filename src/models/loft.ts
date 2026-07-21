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
  /**
   * Outline for THIS section, when the cross-section changes shape with depth.
   *
   * Scaling one contour can only make a form bigger or smaller, never a different shape — which
   * is why a single-outline loft cannot be flat at the front and lobed at the back. A controller
   * needs exactly that: near the face plate the section is the full silhouette, but deep behind
   * it the section survives only where the grips are. Sections without an outline interpolate
   * between the nearest neighbours that have one, so a form can morph smoothly.
   *
   * Must have the same point count as every other outline in the stack.
   */
  outline?: Vector2[];
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

  // Drop a repeated closing point. `Shape.getSpacedPoints()` returns a closed ring whose last
  // point equals its first, and this function closes the ring itself via `% n` — keeping both
  // produces a zero-width strip of degenerate triangles running the full depth of the shell, plus
  // the non-manifold edges and boundary edges that come with it. Found by meshHealth on the real
  // phone and gamepad bodies (10 degenerate triangles each); invisible in a render.
  if (outline.length > 1) {
    const first = outline[0];
    const last = outline[outline.length - 1];
    if (Math.abs(first.x - last.x) < 1e-9 && Math.abs(first.y - last.y) < 1e-9) {
      outline = outline.slice(0, -1);
    }
  }

  // Normalise winding. Face orientation follows the outline's direction, so a contour traced the
  // other way round builds the shell inside-out: with FrontSide materials the sides vanish and
  // the backdrop shows through the object. Callers shouldn't have to know which way to trace —
  // the phone body was drawn clockwise, the gamepad counter-clockwise, and both must work.
  const signedArea = (ring: Vector2[]): number =>
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + (p.x * q.y - q.x * p.y);
    }, 0);

  // Section outlines get the same closing-point treatment as the base one. They usually come from
  // the same `getSpacedPoints()` call, which returns a ring whose last point repeats its first —
  // so without this every section is one point longer than the base and the check below fires.
  const trimRing = (ring: Vector2[]): Vector2[] => {
    if (ring.length < 2) return ring;
    const a = ring[0];
    const b = ring[ring.length - 1];
    return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9 ? ring.slice(0, -1) : ring;
  };
  sections = sections.map((s) => (s.outline ? { ...s, outline: trimRing(s.outline) } : s));

  // Winding normalisation, applied to EVERY ring rather than only the base one. Missing that was
  // a real bug and an instructive one: on a stack where every section declares its own outline the
  // base contour contributes no vertices at all, so normalising it alone normalised nothing and
  // the whole shell came out inside-out — with FrontSide materials, a controller you could see
  // straight through. inspectMesh caught it (signedVolume −11.9, 256 inconsistent edges) after the
  // render had already been misread twice as a geometry hole.
  //
  // Rings are reversed individually but must AGREE beforehand: sections skin index-to-index, and
  // reversing one ring and not another maps point k to point n−1−k, twisting the skin. Mixed
  // winding in the input is a modelling error, so it throws rather than silently building a knot.
  const baseCW = signedArea(outline) < 0;
  for (const s of sections) {
    if (s.outline && signedArea(s.outline) < 0 !== baseCW) {
      throw new Error(
        "loftGeometry: section outlines wind opposite ways — sections skin point-by-point, so " +
          "mixed winding twists the skin. Trace every outline in the same direction.",
      );
    }
  }
  if (baseCW) {
    outline = outline.slice().reverse();
    sections = sections.map((s) => (s.outline ? { ...s, outline: s.outline.slice().reverse() } : s));
  }

  const n = outline.length;
  for (const s of sections) {
    if (s.outline && s.outline.length !== n) {
      throw new Error(
        `loftGeometry: section outline has ${s.outline.length} points, base has ${n} — ` +
          `every outline in the stack must share a point count so sections can interpolate`,
      );
    }
  }

  /**
   * Outline in force at section `i`: its own, or a blend of the nearest neighbours that declare
   * one. This is what lets the cross-section CHANGE SHAPE with depth rather than only scale.
   */
  const outlineAt = (i: number): Vector2[] => {
    if (sections[i].outline) return sections[i].outline!;
    let before = -1;
    let after = -1;
    for (let k = i; k >= 0; k--) if (sections[k].outline) { before = k; break; }
    for (let k = i; k < sections.length; k++) if (sections[k].outline) { after = k; break; }
    if (before === -1 && after === -1) return outline;
    if (before === -1) return sections[after].outline!;
    if (after === -1) return sections[before].outline!;
    if (before === after) return sections[before].outline!;
    const a = sections[before].outline!;
    const b = sections[after].outline!;
    const t = (i - before) / (after - before);
    return a.map((p, k) => new Vector2(p.x + (b[k].x - p.x) * t, p.y + (b[k].y - p.y) * t));
  };

  const positions: number[] = [];
  const indices: number[] = [];

  // ── ring vertices, section by section ──
  sections.forEach((section, s) => {
    const t = sections.length === 1 ? 0 : s / (sections.length - 1);
    const [sx, sy] = Array.isArray(section.scale)
      ? section.scale
      : [section.scale, section.scale];
    const dy = section.offsetY ?? 0;
    const ring = outlineAt(s);
    for (const p of ring) {
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
    // EACH end is triangulated with ITS OWN outline. Sharing one triangulation between both caps
    // is only correct while every section is a copy of the same contour; once sections morph, the
    // index triples that tessellate the front ring describe nothing on a differently-shaped back
    // ring, and the back cap comes out malformed — the shell renders open and you see straight
    // through the object. (Cost me a render that looked like a bowl with a hole in it.)
    const back = 0;
    const front = (sections.length - 1) * n;
    for (const [a, b, c] of ShapeUtils.triangulateShape(outlineAt(sections.length - 1), [])) {
      // Caps and sides do NOT share a winding rule — flipping both together (a plausible-looking
      // fix) leaves the sides right and punches a hole through the front. With the outline
      // normalised counter-clockwise, triangulateShape's order already faces +Z, so the FRONT cap
      // is used as-is and only the BACK one is reversed.
      indices.push(front + a, front + b, front + c);
    }
    for (const [a, b, c] of ShapeUtils.triangulateShape(outlineAt(0), [])) {
      indices.push(back + c, back + b, back + a);
    }
  }

  // NOTE: zero-area slivers from ShapeUtils.triangulateShape on a concave outline are left ALONE
  // on purpose. Deleting them was tried and made things worse: removing a triangle turns its three
  // edges into boundary edges, so a closed shell becomes a holed one (measured: 8 slivers removed
  // → 9 holes). They are harmless to render — no area means no pixels and no normal contribution.
  // meshHealth reports them; a model whose outline produces them declares the tolerance instead.
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
