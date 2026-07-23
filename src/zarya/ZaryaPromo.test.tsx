import { describe, it, expect } from "vitest";
import { SCENES, XFADE, START, ZARYA_PROMO_DURATION } from "./ZaryaPromo";
import { PRODUCT_DURATION, T } from "./ProductAct";

describe("Zarya promo timing math", () => {
  it("DURATION = Σscenes − 3·XFADE (transitions overlap two scenes each)", () => {
    const sum = SCENES.hook + SCENES.product + SCENES.benefits + SCENES.cta;
    expect(ZARYA_PROMO_DURATION).toBe(sum - 3 * XFADE);
    expect(ZARYA_PROMO_DURATION).toBe(1838);
  });

  it("product scene length matches the ProductAct internal timeline end", () => {
    expect(SCENES.product).toBe(PRODUCT_DURATION);
    expect(PRODUCT_DURATION).toBe(T.end);
  });

  it("scene starts pull back one XFADE per prior transition", () => {
    expect(START.hook).toBe(0);
    expect(START.product).toBe(SCENES.hook - XFADE);
    expect(START.benefits).toBe(SCENES.hook + SCENES.product - 2 * XFADE);
    expect(START.cta).toBe(SCENES.hook + SCENES.product + SCENES.benefits - 3 * XFADE);
  });

  it("the ProductAct timeline is monotonic and inside the scene", () => {
    const keys = Object.values(T);
    for (const v of keys) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(PRODUCT_DURATION);
    }
    // key ordering: rocket after ПУСК, hero after rocket, features after hero
    expect(T.pusk).toBeLessThanOrEqual(T.rocketStart);
    expect(T.rocketStart).toBeLessThan(T.glitch);
    expect(T.dawn).toBeLessThan(T.marker);
    expect(T.marker).toBeLessThan(T.ideIn);
  });
});
