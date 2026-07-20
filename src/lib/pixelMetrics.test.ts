import { describe, it, expect } from "vitest";
// the same metrics scripts/check-render.mjs uses — proven here on synthetic frames
// so the render-self-check detectors are known to FIRE, not just pass.
import {
  centerStats,
  classifyView,
  frameDiff,
  pixelmatchRatio,
  silhouetteBox,
  silhouetteFeatures,
  ssimScore,
} from "../../scripts/pixel-metrics.mjs";

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

describe("golden-frame metrics (L4 — vs approved baseline)", () => {
  it("pixelmatchRatio: identical → 0", () => {
    expect(pixelmatchRatio(solid(64, 64, 120), solid(64, 64, 120))).toBe(0);
  });
  it("pixelmatchRatio: black vs white → ~1 (every pixel differs)", () => {
    expect(pixelmatchRatio(solid(64, 64, 0), solid(64, 64, 255))).toBeGreaterThan(0.99);
  });
  it("ssimScore: identical → 1", () => {
    expect(ssimScore(solid(64, 64, 120), solid(64, 64, 120))).toBeCloseTo(1, 5);
  });
  it("ssimScore: a materially changed frame drops well below the 0.98 gate", () => {
    // the bug class golden-check exists for — the frame no longer matches the baseline
    expect(ssimScore(halfSplit(64, 64), solid(64, 64, 128))).toBeLessThan(0.9);
  });
});

/** dark rectangle on a light backdrop — a stand-in for a model on the bench */
function rectOnBackdrop(w: number, h: number, rw: number, rh: number) {
  const data = new Uint8Array(w * h * 4);
  const x0 = Math.floor((w - rw) / 2);
  const y0 = Math.floor((h - rh) / 2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const inside = x >= x0 && x < x0 + rw && y >= y0 && y < y0 + rh;
      const v = inside ? 40 : 200;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  return { width: w, height: h, data };
}

describe("silhouetteBox (L5-fidelity — shape vs reference)", () => {
  it("finds the subject and measures its aspect ratio", () => {
    const box = silhouetteBox(rectOnBackdrop(200, 200, 80, 40));
    expect(box).not.toBeNull();
    expect(box!.width).toBe(80);
    expect(box!.height).toBe(40);
    expect(box!.aspect).toBeCloseTo(2, 2);
    expect(box!.fill).toBeCloseTo(1, 2); // a solid rect fills its own bbox
  });
  it("empty frame → null, so the check reports 'no subject' instead of a bogus box", () => {
    expect(silhouetteBox(solid(64, 64, 200))).toBeNull();
  });
  it("fires on a proportion change — the drift the gate exists to catch", () => {
    const wide = silhouetteBox(rectOnBackdrop(200, 200, 100, 40))!;
    const tall = silhouetteBox(rectOnBackdrop(200, 200, 40, 100))!;
    const drift = Math.abs(tall.aspect - wide.aspect) / wide.aspect;
    expect(drift).toBeGreaterThan(0.15); // well past the default tolerance
  });
});

/** Two stacked bars forming an L — a stand-in for a side profile with real shape to it. */
function lShapeOnBackdrop(w: number, h: number) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const inFoot = y > h * 0.6 && y < h * 0.85 && x > w * 0.2 && x < w * 0.8;
      const inStem = x > w * 0.2 && x < w * 0.35 && y > h * 0.15 && y < h * 0.85;
      const v = inFoot || inStem ? 40 : 200;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  return { width: w, height: h, data };
}

/** Wedge: wide at the bottom, narrow at the top, offset to one side — deliberately asymmetric. */
function wedgeOnBackdrop(w: number, h: number) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = y / h;
      const inside = x > w * 0.2 && x < w * (0.3 + 0.5 * t) && y > h * 0.2 && y < h * 0.85;
      const v = inside ? 40 : 200;
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  return { width: w, height: h, data };
}

describe("classifyView (which way is the object facing)", () => {
  // Thresholds calibrated on real frames: gamepad photo 0.967 and renders at 0°/45°/90° gave
  // 0.995 / 0.890 / 0.694; a Blender laptop turned 60° gave 0.427. Note the photo is 0.967, not
  // 1.0 — lighting and noise cost real symmetry, so the front gate has to sit below that.
  it("a mirror-symmetric shape reads as front", () => {
    const f = silhouetteFeatures(rectOnBackdrop(200, 200, 120, 60))!;
    expect(f.symmetryH).toBeGreaterThan(0.95);
    expect(classifyView(f).view).toBe("front");
  });
  it("an asymmetric shape reads as turned, never as front", () => {
    const f = silhouetteFeatures(wedgeOnBackdrop(200, 200))!;
    expect(f.symmetryH).toBeLessThan(0.9);
    expect(classifyView(f).view).not.toBe("front");
  });
  it("reports unknown rather than guessing on an empty frame", () => {
    expect(classifyView(silhouetteFeatures(solid(64, 64, 200))).view).toBe("unknown");
  });
  it("elongation separates a stretched profile from a compact one", () => {
    const long = silhouetteFeatures(rectOnBackdrop(200, 200, 160, 24))!;
    const square = silhouetteFeatures(rectOnBackdrop(200, 200, 90, 90))!;
    expect(long.elongation).toBeGreaterThan(square.elongation);
  });
});

describe("flatness detection (the slab tell)", () => {
  // A model built by extruding a traced outline at constant thickness is a slab: from the side
  // it is a filled rectangle. Real hardware tapers and curves, so its side profile leaves gaps
  // inside its own bounding box. Calibrated against renders: real geometry ~45-50%, extruded
  // slab 92%, gate at 85%.
  it("a slab fills its own bbox — above the 0.85 gate", () => {
    const slab = silhouetteBox(rectOnBackdrop(200, 200, 120, 50))!;
    expect(slab.fill).toBeGreaterThan(0.85);
  });
  it("a shaped profile leaves gaps — below the gate", () => {
    const shaped = silhouetteBox(lShapeOnBackdrop(200, 200))!;
    expect(shaped.fill).toBeLessThan(0.85);
  });
});
