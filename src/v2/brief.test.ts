import { describe, it, expect } from "vitest";
import { briefSchema, heroFeatures } from "./briefSchema";
import { LUMO_BRIEF } from "../lumo/lumo.brief";
import { ZARYA_BRIEF } from "../zarya/zarya.brief";
import { theme } from "../theme/tokens";

const BRIEFS = { lumo: LUMO_BRIEF, zarya: ZARYA_BRIEF } as const;

describe("briefSchema", () => {
  it("both shipped briefs parse", () => {
    for (const b of Object.values(BRIEFS)) expect(() => briefSchema.parse(b)).not.toThrow();
  });

  it("palette.accent matches the brand token (drift guard)", () => {
    expect(LUMO_BRIEF.palette.accent).toBe(theme.lumo.accent);
    expect(ZARYA_BRIEF.palette.accent).toBe(theme.zarya.accent);
  });

  it("each brief has exactly one hero feature", () => {
    for (const b of Object.values(BRIEFS)) expect(heroFeatures(b)).toHaveLength(1);
  });

  it("heroBeat.feature names a real feature label", () => {
    for (const b of Object.values(BRIEFS)) {
      expect(b.features.map((f) => f.label)).toContain(b.heroBeat.feature);
    }
  });

  it("feature ranks are unique", () => {
    for (const b of Object.values(BRIEFS)) {
      const ranks = b.features.map((f) => f.rank);
      expect(new Set(ranks).size).toBe(ranks.length);
    }
  });

  it("rejects a malformed accent hex", () => {
    const bad = { ...LUMO_BRIEF, palette: { ...LUMO_BRIEF.palette, accent: "red" } };
    expect(() => briefSchema.parse(bad)).toThrow();
  });

  it("rejects a glowAlpha outside 0–1", () => {
    const bad = { ...ZARYA_BRIEF, palette: { ...ZARYA_BRIEF.palette, glowAlpha: 1.5 } };
    expect(() => briefSchema.parse(bad)).toThrow();
  });
});
