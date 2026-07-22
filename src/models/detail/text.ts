import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { BufferGeometry } from "three";
import helvetiker from "three/examples/fonts/helvetiker_regular.typeface.json";

/**
 * Real 3D text as geometry — the DOM-free, synchronous way.
 *
 * WHY THIS FILE IS THE ONLY SHARED ONE. Everything else about a detailed button (bevel, well, cap)
 * is a pure function of numbers a factory can call inline. A FONT is the one genuine cross-file
 * singleton: it must be parsed once and reused, so it earns its own module. The library the plan
 * eventually extracts starts here and nowhere else — the rest stays inline until a second model
 * repeats the need.
 *
 * The font is IMPORTED as bundled JSON, never `FontLoader.load(url)`. That is the whole trick:
 * a static import is resolved by the bundler at build time, so there is no `document`, no canvas,
 * and no async fetch — none of the delayRender race `useGltf` exists to manage (hard rule #6).
 * glyphs.ts already does the same for the ABXY letterforms with hand-drawn Shapes; this covers the
 * arbitrary-alphanumeric case (digits, VOL/CH) a hand-drawn set can't scale to.
 *
 * helvetiker ships with three (MgOpen/MAGENTA, MIT-style) — fine to render into portfolio video. A
 * branded typeface would be an offline TTF→typeface.json conversion committed as a static asset,
 * still never a runtime load.
 */

// The typeface JSON's shape doesn't match three's exported FontData type exactly; the Font
// constructor only reads the glyph table, so the cast is safe and keeps strict mode honest.
const FONT = new Font(helvetiker as unknown as ConstructorParameters<typeof Font>[0]);

export interface TextOptions {
  /** Cap height in model units. */
  size: number;
  /** Extrusion depth. Keep small — a legend is a thin printed mark, not a monument. */
  depth: number;
  /** Rim chamfer; 0 for a flat printed look. */
  bevel?: number;
  /**
   * Curve subdivision. Capped LOW on purpose: three's default of 12 balloons one digit to ~4.6k
   * triangles; 4 gives a clean read at legend scale for a third of the cost (measured).
   */
  curveSegments?: number;
}

const cache = new Map<string, BufferGeometry>();

/**
 * Extruded, centred text geometry, cached by its full spec. Repeated digits then cost nothing —
 * a numeric pad reuses one "5" geometry wherever a 5 appears. Multi-character strings are ONE
 * TextGeometry so kerning comes for free.
 */
export const textGeometry = (text: string, opts: TextOptions): BufferGeometry => {
  const cs = opts.curveSegments ?? 4;
  const bevel = opts.bevel ?? 0;
  const key = `${text}|${opts.size}|${opts.depth}|${bevel}|${cs}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const geo = new TextGeometry(text, {
    font: FONT,
    size: opts.size,
    depth: opts.depth,
    curveSegments: cs,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.center();
  cache.set(key, geo);
  return geo;
};
