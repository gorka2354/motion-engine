import { describe, it, expect } from "vitest";
import {
  visibleHalfWidth,
  orbitFitsFrame,
  minSafeOrbit,
  orbitClearsObject,
} from "./geometry";

describe("visibleHalfWidth", () => {
  it("matches the Bybit camera (fov 34, dist 7.8) ≈ 2.38", () => {
    expect(visibleHalfWidth(34, 7.8)).toBeCloseTo(2.384, 2);
  });
  it("scales linearly with distance", () => {
    expect(visibleHalfWidth(34, 15.6)).toBeCloseTo(2 * visibleHalfWidth(34, 7.8), 5);
  });
  it("widens with aspect for 16:9", () => {
    expect(visibleHalfWidth(34, 7.8, 16 / 9)).toBeCloseTo(2.384 * (16 / 9), 2);
  });
});

// Real numbers from src/bybit/BybitGif.tsx — camera { fov:34, position:[0,0.45,7.8] },
// tile orbit baseR = 1.82 + (i/4)*0.33 → 1.82..2.15. If someone widens the orbit
// past the frame or narrows it into the card, these fail in <1ms — no render needed.
describe("Bybit orbit invariants (footguns #6 & #8)", () => {
  const HALF = visibleHalfWidth(34, 7.8); // ≈ 2.384
  const OUTER_ORBIT = 2.15; // baseR at i=4
  const CARD_SWEPT = 1.4; // half-width the spinning card sweeps (from #8 note)
  const TILE_HALF = 0.37; // tile half-size (from #8 note)

  it("outer orbit center stays inside the frame (#6)", () => {
    expect(orbitFitsFrame(OUTER_ORBIT, 0, HALF)).toBe(true);
  });
  it("REGRESSION: the broken 3.1 orbit is rejected (#6)", () => {
    // the original bug — tiles orbited at ~3.1, well past the 2.38 frame edge
    expect(orbitFitsFrame(3.1, 0, HALF)).toBe(false);
  });
  it("inner orbit clears the swept card + tile (#8)", () => {
    // inner orbit 1.82 must clear 1.4 (card sweep) + 0.37 (tile) = 1.77
    expect(orbitClearsObject(1.82, CARD_SWEPT, TILE_HALF)).toBe(true);
    expect(minSafeOrbit(CARD_SWEPT, TILE_HALF)).toBeCloseTo(1.77, 5);
  });
  it("REGRESSION: the old rz=1.05 elliptical minor axis is rejected (#8)", () => {
    // the bug — an ellipse with minor axis 1.05 < 1.77 punched the tile through the card
    expect(orbitClearsObject(1.05, CARD_SWEPT, TILE_HALF)).toBe(false);
  });
});
