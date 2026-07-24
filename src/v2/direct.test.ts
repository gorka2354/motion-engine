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

  it("pace-rounding makes the read-floor gate position-dependent (Kinetic, real gate)", () => {
    // paceProps rounds `from`/`to` independently, so post-pace duration depends on
    // absolute frame position — not just nominal duration. Same 36f nominal span,
    // different start frame, opposite gate verdict under the shipped Kinetic (0.82).
    const fails = planVariants(
      { ...LUMO_DEFAULTS, beats: [{ title: "x", from: 1, to: 37, y: 0, size: "beat" as const }] },
      ["Kinetic"],
    );
    // from'=round(1*0.82)=1, to'=round(37*0.82)=30 → dur'=29 < 30 floor → FAIL
    expect(fails[0].pass).toBe(false);
    expect(fails[0].errors.some((e) => e.rule === "read-time-floor")).toBe(true);

    const passes = planVariants(
      { ...LUMO_DEFAULTS, beats: [{ title: "x", from: 0, to: 36, y: 0, size: "beat" as const }] },
      ["Kinetic"],
    );
    // from'=0, to'=round(36*0.82)=30 → dur'=30, not < 30 → clears the gate
    expect(passes[0].pass).toBe(true);
    expect(passes[0].errors.some((e) => e.rule === "read-time-floor")).toBe(false);
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
  it("renders FAIL and a non-zero error count for a variant that misses the read floor", () => {
    // exercises gateTable's FAIL branch + the "(N err, M warn)" formatting, which
    // every all-PASS fixture leaves untouched (a 0/0 err/warn swap would ship silently).
    const bad = {
      ...LUMO_DEFAULTS,
      beats: [{ title: "x", from: 0, to: 10, y: 0, size: "beat" as const }],
    };
    const table = gateTable(planVariants(bad, ["PremiumCalm"]));
    expect(table).toContain("FAIL");
    expect(table).toMatch(/PremiumCalm\s+FAIL\s+\(1 err, 0 warn\)/);
  });
});
