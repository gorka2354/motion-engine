import { describe, it, expect } from "vitest";
import {
  applyStyle,
  stylePresetSchema,
  PREMIUM_CALM,
  KINETIC_ENERGETIC,
  EDITORIAL_MINIMAL,
  PRESETS,
} from "./stylePreset";
import { LUMO_DEFAULTS } from "../lumo/lumo.map";

describe("applyStyle — Premium-Calm identity (Δ=0)", () => {
  it("returns byte-identical props for Lumo (no float drift)", () => {
    expect(applyStyle(LUMO_DEFAULTS, PREMIUM_CALM).props).toEqual(LUMO_DEFAULTS);
  });
  it("is a true identity: same object reference, nothing recomputed", () => {
    expect(applyStyle(LUMO_DEFAULTS, PREMIUM_CALM).props).toBe(LUMO_DEFAULTS);
  });
  it("does not mutate the input map", () => {
    const snapshot = JSON.stringify(LUMO_DEFAULTS);
    applyStyle(LUMO_DEFAULTS, KINETIC_ENERGETIC);
    expect(JSON.stringify(LUMO_DEFAULTS)).toBe(snapshot);
  });
});

describe("applyStyle — non-identity presets transform coherently", () => {
  const span = (p: typeof LUMO_DEFAULTS) => p.beats[p.beats.length - 1].to - p.beats[0].from;

  it("Kinetic (pace<1) compresses the timeline and drags nav along", () => {
    const { props } = applyStyle(LUMO_DEFAULTS, KINETIC_ENERGETIC);
    expect(span(props)).toBeLessThan(span(LUMO_DEFAULTS));
    // nav/zoomBeat/floats scale with the beats — not left behind
    expect(props.nav[3].at).toBeLessThan(LUMO_DEFAULTS.nav[3].at);
    expect(props.zoomBeat.to).toBeLessThan(LUMO_DEFAULTS.zoomBeat.to);
    expect(props.floats.chips.to).toBeLessThan(LUMO_DEFAULTS.floats.chips.to);
  });

  it("Editorial (pace>1) expands the timeline + carries finish knobs", () => {
    const { props, style } = applyStyle(LUMO_DEFAULTS, EDITORIAL_MINIMAL);
    expect(span(props)).toBeGreaterThan(span(LUMO_DEFAULTS));
    expect(style.finish.letterbox).toBe(true);
    expect(style.finish.grain).toBe(0);
  });

  it("preserves the role tags through pacing", () => {
    const { props } = applyStyle(LUMO_DEFAULTS, KINETIC_ENERGETIC);
    expect(props.beats.map((b) => b.role)).toEqual(LUMO_DEFAULTS.beats.map((b) => b.role));
  });
});

describe("stylePresetSchema", () => {
  it("all shipped presets parse", () => {
    for (const p of Object.values(PRESETS)) expect(() => stylePresetSchema.parse(p)).not.toThrow();
  });
  it("rejects a non-positive pace", () => {
    expect(() => stylePresetSchema.parse({ ...PREMIUM_CALM, pace: 0 })).toThrow();
  });
  it("rejects grain outside 0–1", () => {
    const bad = { ...PREMIUM_CALM, finish: { ...PREMIUM_CALM.finish, grain: 2 } };
    expect(() => stylePresetSchema.parse(bad)).toThrow();
  });
});
