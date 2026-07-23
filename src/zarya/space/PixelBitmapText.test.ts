import { describe, it, expect } from "vitest";
import { pixelTextCells } from "../../lib/PixelText";
import { ZARYA_GLYPHS } from "./PixelBitmapText";

describe("ZARYA_GLYPHS — the app's 5×7 launch-console font", () => {
  it("has every glyph ПОЕХАЛИ! and the 3·2·1 countdown need, each a full 5×7", () => {
    for (const ch of [..."ПОЕХАЛИ!123"]) {
      const g = ZARYA_GLYPHS.table[ch];
      expect(g, `missing glyph '${ch}'`).toBeDefined();
      expect(g.length).toBe(7);
      for (const row of g) expect(row.length).toBe(5);
    }
  });

  it("renders ПОЕХАЛИ! with a plausible number of lit cells", () => {
    const n = pixelTextCells("ПОЕХАЛИ!", ZARYA_GLYPHS, 1).length;
    expect(n).toBeGreaterThan(60);
    expect(n).toBeLessThan(160);
  });
});
