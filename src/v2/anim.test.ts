import { describe, it, expect } from "vitest";
import { clamp01, kf, window01, springWindow, stagger } from "./anim";

describe("clamp01", () => {
  it("clamps to [0,1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });
});

describe("kf (multi-stop keyframes)", () => {
  const pairs: [number, number][] = [
    [0, 100],
    [30, 200],
  ];
  it("clamps outside the range (no extrapolation drift)", () => {
    expect(kf(-10, pairs)).toBe(100);
    expect(kf(999, pairs)).toBe(200);
  });
  it("hits the stops", () => {
    expect(kf(0, pairs)).toBeCloseTo(100);
    expect(kf(30, pairs)).toBeCloseTo(200);
  });
  it("is monotonic between stops", () => {
    expect(kf(20, pairs)).toBeGreaterThan(kf(10, pairs));
  });
});

describe("window01 (visibility)", () => {
  it("opacity is 0 before, ~1 mid, 0 after", () => {
    expect(window01(50, 100, 200).opacity).toBe(0); // before `from`
    expect(window01(150, 100, 200).opacity).toBeGreaterThan(0.9); // mid
    expect(window01(300, 100, 200).opacity).toBe(0); // after `to`
  });
  it("enter progress is monotonic non-decreasing", () => {
    expect(window01(120, 100, 200).enter).toBeGreaterThanOrEqual(
      window01(105, 100, 200).enter,
    );
  });
});

describe("springWindow", () => {
  it("enter is exactly 0 before the start frame", () => {
    expect(springWindow(50, 30, 100, 200).enter).toBe(0);
  });
  it("settles toward 1 well after the start", () => {
    expect(springWindow(180, 30, 100, 200).enter).toBeGreaterThan(0.8);
  });
  it("opacity is clamped to [0,1] even if the spring overshoots", () => {
    const o = springWindow(160, 30, 100, 200).opacity;
    expect(o).toBeGreaterThanOrEqual(0);
    expect(o).toBeLessThanOrEqual(1);
  });
});

describe("stagger", () => {
  it("returns the i-th start frame", () => {
    expect(stagger(0, 10, 5)).toBe(10);
    expect(stagger(3, 10, 5)).toBe(25);
  });
});
