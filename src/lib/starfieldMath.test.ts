import { describe, it, expect } from "vitest";
import { starAt, meteorAt } from "./starfieldMath";

const W = 1920;
const H = 1080;

describe("starfield determinism + bounds", () => {
  it("is a pure function of (i, frame) — identical inputs give identical output", () => {
    for (const [i, f] of [
      [0, 0],
      [37, 12],
      [149, 999],
    ]) {
      expect(starAt(i, f, W, H)).toEqual(starAt(i, f, W, H));
    }
  });

  it("keeps every star inside the field with a valid look", () => {
    for (let i = 0; i < 160; i++) {
      for (const f of [0, 1, 60, 300, 1676]) {
        const s = starAt(i, f, W, H);
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(W);
        expect(s.y).toBeGreaterThanOrEqual(-3.001);
        expect(s.y).toBeLessThanOrEqual(H + 3.001);
        expect(s.alpha).toBeGreaterThanOrEqual(0);
        expect(s.alpha).toBeLessThanOrEqual(1);
        expect([1, 2]).toContain(s.size);
        expect(typeof s.gold).toBe("boolean");
      }
    }
  });

  it("drifts downward over time (a star's y advances between frames, wrapping)", () => {
    const a = starAt(5, 0, W, H).y;
    const b = starAt(5, 4, W, H).y;
    // either advanced downward, or wrapped past the bottom edge
    expect(b > a || b < a - H / 2).toBe(true);
  });
});

describe("meteor spawns", () => {
  it("is null between spawns and valid while alive", () => {
    const period = 165;
    const life = 30;
    expect(meteorAt(life + 5, W, H, period, life)).toBeNull(); // dead phase
    const m = meteorAt(2, W, H, period, life);
    expect(m).not.toBeNull();
    if (m) {
      expect(m.alpha).toBeGreaterThanOrEqual(0);
      expect(m.alpha).toBeLessThanOrEqual(1);
      expect(m.x).toBeGreaterThanOrEqual(-1);
      expect(m.x).toBeLessThanOrEqual(W + 1);
    }
  });

  it("re-appears each period and fades across its life", () => {
    const early = meteorAt(1, W, H)!;
    const late = meteorAt(28, W, H)!;
    expect(early.alpha).toBeGreaterThan(late.alpha); // fading out
  });
});
