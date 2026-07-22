import { describe, expect, it } from "vitest";
import { textGeometry } from "./text";

/**
 * The spike that must pass before anything is built on the font path: real extruded text, in the
 * NODE project, with no DOM and no async. If `document` were needed this would throw on import.
 */
describe("textGeometry", () => {
  it("builds a digit as geometry in node — no DOM, no canvas, no async", () => {
    expect(typeof document).toBe("undefined");
    const geo = textGeometry("5", { size: 1, depth: 0.2 });
    // Non-empty, and a real 3D extrusion (has depth), not a flat outline.
    expect(geo.getAttribute("position").count).toBeGreaterThan(0);
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    expect(box.max.z - box.min.z).toBeCloseTo(0.2, 2);
  });

  it("kerns a multi-character string as one geometry", () => {
    const vol = textGeometry("VOL", { size: 1, depth: 0.2 });
    vol.computeBoundingBox();
    const one = textGeometry("V", { size: 1, depth: 0.2 });
    one.computeBoundingBox();
    // "VOL" is wider than "V" alone — proves the whole string laid out, not just the first glyph.
    expect(vol.boundingBox!.max.x - vol.boundingBox!.min.x).toBeGreaterThan(
      one.boundingBox!.max.x - one.boundingBox!.min.x,
    );
  });

  it("caches by spec so a repeated digit costs nothing", () => {
    expect(textGeometry("7", { size: 1, depth: 0.2 })).toBe(textGeometry("7", { size: 1, depth: 0.2 }));
    expect(textGeometry("7", { size: 1, depth: 0.2 })).not.toBe(textGeometry("7", { size: 2, depth: 0.2 }));
  });
});
