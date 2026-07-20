import { describe, expect, it } from "vitest";
import { Box3, BufferGeometry, Mesh, Vector3 } from "three";
import { GLYPH_NAMES, glyphGeometry } from "./glyphs";

/**
 * L1 for the glyph library. The point of drawing letters as Shapes rather than loading a font is
 * that it stays synchronous and DOM-free — so the first thing this file proves is that it builds
 * at all in the node project, where `document` doesn't exist.
 *
 * Beyond that: a letter with holes (A, B) is easy to get silently wrong — a mis-wound hole path
 * triangulates into an empty or exploded mesh rather than throwing.
 */
const bounds = (geo: BufferGeometry): Vector3 => {
  const size = new Vector3();
  new Box3().setFromObject(new Mesh(geo)).getSize(size);
  return size;
};

describe("glyphGeometry", () => {
  it("builds every glyph without a DOM", () => {
    expect(typeof document).toBe("undefined");
    for (const name of GLYPH_NAMES) {
      const geo = glyphGeometry(name);
      expect(geo.getAttribute("position").count, `${name} has vertices`).toBeGreaterThan(0);
    }
  });

  it("triangulates the holed letters into real surface area", () => {
    // A mis-wound hole yields a degenerate mesh: still 'valid', visually empty. Vertex count is
    // the cheap tell — a solid letter needs far more than a bare outline would produce.
    for (const name of ["A", "B"] as const) {
      const geo = glyphGeometry(name);
      expect(geo.getAttribute("position").count, `${name} is not degenerate`).toBeGreaterThan(60);
    }
  });

  it("respects the requested cap height", () => {
    const small = bounds(glyphGeometry("X", { size: 0.2 }));
    const large = bounds(glyphGeometry("X", { size: 1 }));
    expect(small.y).toBeLessThan(large.y);
    expect(large.y).toBeCloseTo(1, 1);
  });

  it("extrudes along Z so the letter has depth to catch light", () => {
    const size = bounds(glyphGeometry("Y", { size: 1, depth: 0.1, bevel: 0 }));
    expect(size.z).toBeCloseTo(0.1, 2);
  });

  it("caches identical requests — the triangulation is the expensive part", () => {
    expect(glyphGeometry("B", { size: 0.3 })).toBe(glyphGeometry("B", { size: 0.3 }));
    expect(glyphGeometry("B", { size: 0.3 })).not.toBe(glyphGeometry("B", { size: 0.4 }));
  });
});
