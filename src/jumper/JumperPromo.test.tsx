import { describe, it, expect } from "vitest";
import { SCENES, XFADE, JUMPER_PROMO_DURATION } from "./JumperPromo";

// Sequencing (TransitionSeries) is the architectural fix for the "temporal overlap"
// bug class — two scenes visible at once on a stitch. With sequencing each act lives
// in its own slot and stitches are explicit transitions, so overlap is impossible by
// construction. These guard the timeline math that makes that true.
describe("JumperPromo sequencing (TransitionSeries)", () => {
  it("scene slots + transitions sum to the composition length", () => {
    const total =
      SCENES.hook + SCENES.transfer + SCENES.benefits + SCENES.cta - 3 * XFADE;
    expect(total).toBe(JUMPER_PROMO_DURATION);
    // sensible length for a 9:16 promo (~22–30s @ 30fps)
    expect(JUMPER_PROMO_DURATION).toBeGreaterThan(660);
    expect(JUMPER_PROMO_DURATION).toBeLessThan(900);
  });

  it("every scene is longer than a full transition on each side", () => {
    // a scene shorter than 2×XFADE would be fully consumed by its in/out transitions
    // (nothing would 'hold') — a real Remotion footgun with TransitionSeries
    Object.entries(SCENES).forEach(([name, dur]) =>
      expect(dur, `${name} too short for its transitions`).toBeGreaterThan(2 * XFADE),
    );
  });

  it("transition length is positive and shorter than the shortest scene", () => {
    expect(XFADE).toBeGreaterThan(0);
    expect(XFADE).toBeLessThan(Math.min(...Object.values(SCENES)));
  });
});
