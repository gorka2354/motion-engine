import { describe, it, expect } from "vitest";
import { planVariants, gateTable } from "./direct";
import { LUMO_DEFAULTS } from "../lumo/lumo.map";
import { applyStyle, type StylePreset } from "./stylePreset";
import { lintErrors } from "./directionRules";

describe("planVariants", () => {
  it("produces one linted variant per preset (3 by default)", () => {
    const vs = planVariants(LUMO_DEFAULTS);
    expect(vs).toHaveLength(3);
    expect(vs.map((v) => v.preset).sort()).toEqual(["Editorial", "Kinetic", "PremiumCalm"]);
  });

  it("all default presets clear the gate on the clean Lumo map", () => {
    for (const v of planVariants(LUMO_DEFAULTS)) expect(v.pass).toBe(true);
  });

  it("respects an explicit preset subset", () => {
    const vs = planVariants(LUMO_DEFAULTS, ["PremiumCalm"]);
    expect(vs).toHaveLength(1);
    expect(vs[0].preset).toBe("PremiumCalm");
  });

  it("the linter rejects a preset whose pace pushes a beat below the read floor", () => {
    const tooFast: StylePreset = {
      name: "TooFast",
      pace: 0.5, // halves every beat → shortest (46f) drops under 30f
      type: { scaleMult: 1, tracking: 0 },
      finish: { grain: 0, filmGrade: 0, letterbox: false },
      sound: { sfxDensity: 1, heroVol: 1, tickVol: 0.5 },
      palette: { hueRotate: 0 },
    };
    const styled = applyStyle(LUMO_DEFAULTS, tooFast);
    const errs = lintErrors(styled.props);
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.some((f) => f.rule === "read-time-floor")).toBe(true);
  });
});

describe("gateTable", () => {
  it("has a header plus one row per variant", () => {
    const rows = gateTable(planVariants(LUMO_DEFAULTS)).split("\n");
    expect(rows).toHaveLength(1 + 3);
    expect(rows[0]).toContain("PRESET");
  });
  it("shows PASS for the clean Lumo variants", () => {
    expect(gateTable(planVariants(LUMO_DEFAULTS))).toContain("PASS");
  });
});
