import { ExtrudeGeometry, Path, Shape } from "three";
import type { BufferGeometry } from "three";

/**
 * Letterforms as geometry.
 *
 * WHY NOT A FONT OR A TEXTURE. Both break the factory contract: a canvas texture needs `document`
 * (dead in the vitest node project) and a loaded typeface is an async fetch — exactly the
 * delayRender race `useGltf` exists to work around (hard rule #6). Drawing the few glyphs we
 * actually need as `Shape` outlines keeps factories synchronous and unit-testable, and the
 * letters get real extruded depth so they catch the key light like moulded plastic does.
 *
 * Scope on purpose: only the marks a controller face needs. This is not a font — for arbitrary
 * text, render it in the 2D layer over the 3D, the way BybitGif composites its card faces.
 *
 * All glyphs are drawn in a 1×1 box centred on the origin, so a caller scales by cap height.
 */

/** Diagonal cross — two bars meeting at the centre. */
const shapeX = (): Shape => {
  const s = new Shape();
  const pts: [number, number][] = [
    [-0.5, 0.38],
    [-0.31, 0.5],
    [0, 0.13],
    [0.31, 0.5],
    [0.5, 0.38],
    [0.17, 0],
    [0.5, -0.38],
    [0.31, -0.5],
    [0, -0.13],
    [-0.31, -0.5],
    [-0.5, -0.38],
    [-0.17, 0],
  ];
  s.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => s.lineTo(x, y));
  s.closePath();
  return s;
};

/** Two arms into a stem. */
const shapeY = (): Shape => {
  const s = new Shape();
  const pts: [number, number][] = [
    [-0.5, 0.5],
    [-0.26, 0.5],
    [0, 0.1],
    [0.26, 0.5],
    [0.5, 0.5],
    [0.13, -0.04],
    [0.13, -0.5],
    [-0.13, -0.5],
    [-0.13, -0.04],
  ];
  s.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => s.lineTo(x, y));
  s.closePath();
  return s;
};

/**
 * Solid triangular body with two holes punched out: the counter above the crossbar, and the
 * notch between the legs. Punching holes is what makes the crossbar appear — drawing the bar
 * as a separate part would leave a visible seam under a raking light.
 */
const shapeA = (): Shape => {
  const s = new Shape();
  s.moveTo(-0.5, -0.5);
  s.lineTo(0.5, -0.5);
  s.lineTo(0.13, 0.5);
  s.lineTo(-0.13, 0.5);
  s.closePath();

  const counter = new Path();
  counter.moveTo(-0.09, 0.02);
  counter.lineTo(0.09, 0.02);
  counter.lineTo(0, 0.31);
  counter.closePath();

  const legGap = new Path();
  legGap.moveTo(-0.27, -0.5);
  legGap.lineTo(-0.16, -0.16);
  legGap.lineTo(0.16, -0.16);
  legGap.lineTo(0.27, -0.5);
  legGap.closePath();

  s.holes.push(counter, legGap);
  return s;
};

/** Stem with two lobes; the bowls are holes so the whole letter stays one solid. */
const shapeB = (): Shape => {
  const s = new Shape();
  s.moveTo(-0.36, -0.5);
  s.lineTo(0.1, -0.5);
  s.quadraticCurveTo(0.42, -0.5, 0.42, -0.26);
  s.quadraticCurveTo(0.42, -0.06, 0.17, -0.02);
  s.quadraticCurveTo(0.4, 0.02, 0.4, 0.26);
  s.quadraticCurveTo(0.4, 0.5, 0.08, 0.5);
  s.lineTo(-0.36, 0.5);
  s.closePath();

  const upper = new Path();
  upper.moveTo(-0.13, 0.1);
  upper.lineTo(0.04, 0.1);
  upper.quadraticCurveTo(0.19, 0.1, 0.19, 0.26);
  upper.quadraticCurveTo(0.19, 0.38, 0.04, 0.38);
  upper.lineTo(-0.13, 0.38);
  upper.closePath();

  const lower = new Path();
  lower.moveTo(-0.13, -0.38);
  lower.lineTo(0.06, -0.38);
  lower.quadraticCurveTo(0.22, -0.38, 0.22, -0.24);
  lower.quadraticCurveTo(0.22, -0.12, 0.06, -0.12);
  lower.lineTo(-0.13, -0.12);
  lower.closePath();

  s.holes.push(upper, lower);
  return s;
};

/**
 * Nexus mark: a ring with a stylised cross inside — the round "home" badge in the middle of a
 * controller face. Not a trademark reproduction, a generic round badge with a diagonal cross.
 */
const shapeNexus = (): Shape => {
  const s = new Shape();
  s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const inner = new Path();
  inner.absarc(0, 0, 0.36, 0, Math.PI * 2, true);
  s.holes.push(inner);
  return s;
};

const GLYPHS = {
  A: shapeA,
  B: shapeB,
  X: shapeX,
  Y: shapeY,
  nexus: shapeNexus,
} as const;

export type GlyphName = keyof typeof GLYPHS;

export interface GlyphOptions {
  /** Cap height in world units; the glyph is drawn in a 1×1 box and scaled to this. */
  size?: number;
  /** Extrusion depth — enough to catch a highlight, not enough to read as a block. */
  depth?: number;
  /** Rounds the extruded rim so the letter edge isn't razor-sharp. */
  bevel?: number;
}

/**
 * Geometry for one glyph, centred on the origin, facing +Z.
 * Cached per (name, size, depth, bevel): a controller reuses the same four letters, and the
 * triangulation is the expensive part.
 */
const cache = new Map<string, BufferGeometry>();

export const glyphGeometry = (
  name: GlyphName,
  options: GlyphOptions = {},
): BufferGeometry => {
  const { size = 1, depth = 0.04, bevel = 0.008 } = options;
  const key = `${name}|${size}|${depth}|${bevel}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const geo = new ExtrudeGeometry(GLYPHS[name](), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.scale(size, size, 1);
  geo.center();
  cache.set(key, geo);
  return geo;
};

/** Test seam: lets a unit test assert every glyph triangulates without reaching into `cache`. */
export const GLYPH_NAMES = Object.keys(GLYPHS) as GlyphName[];
