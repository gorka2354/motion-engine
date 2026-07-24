import { describe, it, expect } from "vitest";
import {
  lintDirection,
  lintErrors,
  ruleReadTime,
  ruleRhythm,
  ruleActBudget,
  ruleRoleOrder,
  DEFAULT_CONFIG,
  type Role,
} from "./directionRules";
import { LUMO_DEFAULTS } from "../lumo/lumo.map";

/** Minimal valid beat; override what a test cares about. */
const mk = (from: number, to: number, role?: Role, title = "t") =>
  ({ title, from, to, y: 0, size: "beat" as const, role });

describe("lintDirection — golden fixture", () => {
  it("the shipped Lumo map is clean (no findings)", () => {
    expect(lintDirection(LUMO_DEFAULTS)).toEqual([]);
  });
});

describe("ruleReadTime (A)", () => {
  it("flags a beat shorter than the min read floor", () => {
    const f = ruleReadTime([mk(0, 20)], DEFAULT_CONFIG);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe("read-time-floor");
    expect(f[0].severity).toBe("error");
  });
  it("passes a beat at/above the floor", () => {
    expect(ruleReadTime([mk(0, 30), mk(0, 90)], DEFAULT_CONFIG)).toEqual([]);
  });
});

describe("ruleRhythm (B)", () => {
  it("flags adjacent beats of near-equal length as robotic", () => {
    const f = ruleRhythm([mk(0, 100), mk(0, 100)], DEFAULT_CONFIG); // 0% diff
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe("rhythm-variance");
    expect(f[0].severity).toBe("warn");
  });
  it("passes beats whose lengths vary beyond the band", () => {
    expect(ruleRhythm([mk(0, 100), mk(0, 200)], DEFAULT_CONFIG)).toEqual([]); // 50%
  });
});

describe("ruleActBudget (C)", () => {
  it("flags a role that dominates the tagged budget", () => {
    const f = ruleActBudget([mk(0, 900, "hook"), mk(0, 100, "demo")], DEFAULT_CONFIG); // hook 90%
    expect(f.some((x) => x.rule === "act-budget" && x.message.startsWith("hook"))).toBe(true);
  });
  it("passes a balanced, well-tagged map", () => {
    const beats = [mk(0, 100, "hook"), mk(0, 300, "demo"), mk(0, 300, "benefit")];
    expect(ruleActBudget(beats, DEFAULT_CONFIG)).toEqual([]);
  });
  it("skips entirely when no beats are role-tagged", () => {
    expect(ruleActBudget([mk(0, 60), mk(0, 60)], DEFAULT_CONFIG)).toEqual([]);
  });
});

describe("ruleRoleOrder (D)", () => {
  it("flags a role that regresses to an earlier act", () => {
    const f = ruleRoleOrder([mk(0, 60, "demo"), mk(0, 60, "hook")]);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe("role-order");
  });
  it("passes forward-progressing roles", () => {
    expect(ruleRoleOrder([mk(0, 60, "hook"), mk(0, 60, "demo"), mk(0, 60, "cta")])).toEqual([]);
  });
});

describe("lintDirection — malformed input (graceful, never throws)", () => {
  it("reports a missing beats array as a schema error", () => {
    // deliberately malformed shapes the type system would reject
    expect(lintDirection(null)[0].rule).toBe("schema");
    expect(lintDirection({} as never)[0].rule).toBe("schema");
  });
  it("reports an inverted [from,to) window without crashing", () => {
    const f = lintDirection({ beats: [mk(200, 100)] });
    expect(f.some((x) => x.rule === "schema" && x.severity === "error")).toBe(true);
  });
  it("lintErrors returns only blocking findings", () => {
    // one too-short beat (error) + robotic pair (warn) → only the error remains
    const errs = lintErrors({ beats: [mk(0, 10), mk(0, 100), mk(100, 200)] });
    expect(errs.every((f) => f.severity === "error")).toBe(true);
    expect(errs.length).toBeGreaterThan(0);
  });
});
