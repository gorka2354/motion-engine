import { describe, it, expect } from "vitest";
import { rocketY, countPhase, ember, overlayFade, padGlow, LIFT, RISE } from "./rocketMath";

const W = 1920;
const H = 1080;

describe("rocket trajectory", () => {
  it("is deterministic", () => {
    expect(rocketY(55, H)).toEqual(rocketY(55, H));
    expect(ember(20, 40, W, H)).toEqual(ember(20, 40, W, H));
  });

  it("rests on the pad during countdown, then rises out the top", () => {
    expect(rocketY(0, H)).toBeGreaterThan(H * 0.75); // on pad (~0.8h)
    const cleared = rocketY(LIFT + RISE, H);
    expect(cleared).toBeLessThan(0); // fully above the frame
  });

  it("monotonically ascends through liftoff", () => {
    let prev = rocketY(LIFT, H);
    for (let f = LIFT + 1; f <= LIFT + RISE; f++) {
      const y = rocketY(f, H);
      expect(y).toBeLessThanOrEqual(prev + 0.001);
      prev = y;
    }
  });
});

describe("countdown", () => {
  it("shows 3·2·1 then clears at liftoff", () => {
    expect(countPhase(5).label).toBe("3");
    expect(countPhase(15).label).toBe("2");
    expect(countPhase(25).label).toBe("1");
    expect(countPhase(LIFT).label).toBeNull();
    expect(countPhase(LIFT + 40).label).toBeNull();
  });
});

describe("embers + overlay", () => {
  it("embers are null before spawn and valid while alive", () => {
    expect(ember(0, 0, W, H)).toBeNull(); // before liftoff
    let sawAlive = false;
    for (let f = LIFT; f < LIFT + RISE + 30; f++) {
      const e = ember(3, f, W, H);
      if (e) {
        sawAlive = true;
        expect(e.alpha).toBeGreaterThanOrEqual(0);
        expect(e.alpha).toBeLessThanOrEqual(1);
        expect(e.size).toBeGreaterThanOrEqual(0);
      }
    }
    expect(sawAlive).toBe(true);
  });

  it("overlayFade and padGlow stay in [0,1]", () => {
    for (let f = 0; f < 160; f++) {
      expect(overlayFade(f)).toBeGreaterThanOrEqual(0);
      expect(overlayFade(f)).toBeLessThanOrEqual(1);
      expect(padGlow(f)).toBeGreaterThanOrEqual(0);
      expect(padGlow(f)).toBeLessThanOrEqual(1);
    }
  });
});
