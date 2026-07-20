import { describe, expect, it } from "vitest";
import { Color, MeshStandardMaterial } from "three";
import {
  DIELECTRIC,
  FINISH,
  METAL,
  metal,
  plastic,
  validateMaterial,
} from "./materials";
import { createGamepadModel } from "./gamepad/createGamepadModel";
import { createPhoneModel } from "./phone/createPhoneModel";

/**
 * The validator is warning-level by design, so its tests prove two separate things: that it FIRES
 * on the mistakes it exists for, and that it does NOT fire on materials this repo deliberately
 * ships (a soft-touch black at sRGB 18 is correct, not a bug).
 */
describe("presets are physically plausible by construction", () => {
  it("metal() pins metalness to 1", () => {
    expect(metal().metalness).toBe(1);
    expect(validateMaterial(metal({ color: METAL.aluminium, finish: FINISH.brushed }))).toEqual([]);
  });
  it("plastic() pins metalness to 0", () => {
    expect(plastic().metalness).toBe(0);
    expect(validateMaterial(plastic({ color: DIELECTRIC.blackPlastic }))).toEqual([]);
  });
  it("lacquer adds a clearcoat layer rather than faking gloss with metalness", () => {
    const m = plastic({ lacquer: true }) as unknown as { clearcoat: number; metalness: number };
    expect(m.clearcoat).toBe(1);
    expect(m.metalness).toBe(0);
  });
});

describe("validator DETECTS the three bugs it was written for", () => {
  it("half-tone metalness — the white-side-of-the-phone bug", () => {
    const m = new MeshStandardMaterial({ metalness: 0.62, roughness: 0.4 });
    m.name = "phoneBody";
    const w = validateMaterial(m);
    expect(w.some((x) => x.message.includes("half-tone"))).toBe(true);
  });

  it("albedo with baked-in lighting — too bright to be pigment", () => {
    // a lit photo pixel of "white plastic" comes back near 250+; real albedo tops out lower
    const m = new MeshStandardMaterial({ color: new Color(0xfdfdfd), metalness: 0 });
    const w = validateMaterial(m);
    expect(w.some((x) => x.message.includes("baked"))).toBe(true);
  });

  it("impossible values are errors, not warnings", () => {
    const m = new MeshStandardMaterial({ metalness: 1.5, roughness: -0.2 });
    const w = validateMaterial(m);
    expect(w.filter((x) => x.level === "error")).toHaveLength(2);
  });

  it("does NOT complain about a metal's bright base colour", () => {
    // aluminium's reflectance IS near-white — the albedo range must not apply to conductors
    expect(validateMaterial(metal({ color: METAL.silver }))).toEqual([]);
  });
});

describe("calibration against materials this repo actually ships", () => {
  // The published DONTNOD range starts at sRGB 50. Applied here it would flag the controller's
  // deliberate soft-touch black (0x121212 = 18) as broken, so the floor is calibrated to 16.
  it("accepts the gamepad's intentionally very dark palette", () => {
    const { group } = createGamepadModel();
    const materials: MeshStandardMaterial[] = [];
    group.traverse((o) => {
      const m = (o as { material?: MeshStandardMaterial }).material;
      if (m && "metalness" in m) materials.push(m);
    });
    expect(materials.length).toBeGreaterThan(0);
    const errors = materials.flatMap((m) => validateMaterial(m)).filter((w) => w.level === "error");
    expect(errors).toEqual([]);
  });

  it("the phone now passes clean — every material is 0 or 1 metalness", () => {
    // It did not, when this validator was written: body 0.35, rail 0.75, lens 0.4, ring 0.85 were
    // all half-tones, and the phone's side mirrored the white backdrop as a result. The fix was to
    // model the real construction — dielectric back, metal frame — instead of one averaged
    // "phone-ish" surface. This test is the regression guard for that.
    const { group } = createPhoneModel();
    const warnings: string[] = [];
    group.traverse((o) => {
      const m = (o as { material?: MeshStandardMaterial }).material;
      if (m && "metalness" in m) warnings.push(...validateMaterial(m).map((w) => w.message));
    });
    expect(warnings.filter((w) => w.includes("half-tone"))).toEqual([]);
  });
});
