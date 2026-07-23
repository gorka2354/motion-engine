import { describe, it, expect } from "vitest";
import { pixelTextCells, type PixelGlyphs } from "./PixelText";

// A tiny 3×3 glyph table for exact assertions.
const TINY: PixelGlyphs = {
  w: 3,
  h: 3,
  table: {
    A: ["111", "101", "111"], // ring (8 on-cells)
    I: ["010", "010", "010"], // middle column (3 on-cells)
    " ": ["000", "000", "000"],
  },
};

describe("pixelTextCells — bitmap font layout", () => {
  it("emits the on-cells of a single glyph at the right coordinates", () => {
    const cells = pixelTextCells("A", TINY, 1);
    expect(cells.length).toBe(8); // 3×3 ring minus centre
    expect(cells).toContainEqual({ x: 0, y: 0 });
    expect(cells).toContainEqual({ x: 2, y: 2 });
    expect(cells).not.toContainEqual({ x: 1, y: 1 }); // hole in the middle
  });

  it("advances by glyph width + gap between characters", () => {
    const cells = pixelTextCells("II", TINY, 1);
    // first I → column x=1; second I → x = (3+1)+1 = 5
    expect(cells).toContainEqual({ x: 1, y: 0 });
    expect(cells).toContainEqual({ x: 5, y: 0 });
    expect(cells.length).toBe(6);
  });

  it("gap widens spacing (spread-in animation source)", () => {
    const g0 = pixelTextCells("II", TINY, 1).map((c) => c.x);
    const g3 = pixelTextCells("II", TINY, 4).map((c) => c.x);
    expect(Math.max(...g3)).toBeGreaterThan(Math.max(...g0)); // more gap → wider
  });

  it("skips unknown characters (no cells, but they don't crash)", () => {
    expect(pixelTextCells("A?A", TINY, 1).length).toBe(16); // two rings, ? contributes nothing
  });

  it("is deterministic", () => {
    expect(pixelTextCells("AIA", TINY, 2)).toEqual(pixelTextCells("AIA", TINY, 2));
  });
});
