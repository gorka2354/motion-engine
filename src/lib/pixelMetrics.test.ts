import { describe, it, expect } from "vitest";
// the same metrics scripts/check-render.mjs uses — proven here on synthetic frames
// so the render-self-check detectors are known to FIRE, not just pass.
import { centerStats, frameDiff } from "../../scripts/pixel-metrics.mjs";

/** solid grey frame (RGBA) */
function solid(w: number, h: number, v: number) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  }
  return { width: w, height: h, data };
}
/** left half black, right half white — high contrast at any sampling step
 *  (a 1px checkerboard would alias against the metric's 2px stride) */
function halfSplit(w: number, h: number) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = x < w / 2 ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  return { width: w, height: h, data };
}

describe("centerStats (content-check math)", () => {
  it("flat frame → std 0 — an empty center is detectable (#6)", () => {
    expect(centerStats(solid(120, 120, 80)).std).toBeCloseTo(0, 3);
  });
  it("high-contrast frame → large std (a real subject is present)", () => {
    expect(centerStats(halfSplit(120, 120)).std).toBeGreaterThan(100);
  });
});

describe("frameDiff (motion / loop math)", () => {
  it("identical frames → 0 — a frozen/vanished subject is detectable", () => {
    expect(frameDiff(solid(120, 120, 80), solid(120, 120, 80))).toBe(0);
  });
  it("black vs white → ~255 (a hard cut / seam is detectable)", () => {
    expect(frameDiff(solid(120, 120, 0), solid(120, 120, 255))).toBeGreaterThan(200);
  });
});
