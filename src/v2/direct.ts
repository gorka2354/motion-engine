import type { PromoProps } from "./promoSchema";
import { lintDirection, type Finding } from "./directionRules";
import { applyStyle, PRESETS, type PresetName, type StyledPromo } from "./stylePreset";

/**
 * Variant loop (inc: director-layer, Increment 4). "N styles from one brief" =
 * one director timeline × N StylePreset overlays, each mechanically gated by the
 * direction linter BEFORE any human looks. The pure core lives here (testable in
 * npm test); the still-rendering CLI is scripts/direct.ts (run via `npm run
 * direct`). Human judgement stays for the qualitative pick AMONG the variants
 * that clear the gate — the gate only holds the craft floor, it doesn't choose.
 */

export interface Variant {
  preset: PresetName;
  styled: StyledPromo;
  findings: Finding[];
  /** error-severity findings only — these fail the gate. */
  errors: Finding[];
  /** true when the styled scene-map has no blocking (error) findings. */
  pass: boolean;
}

/** Generate one styled + linted variant per preset from a base scene-map. */
export function planVariants(
  base: PromoProps,
  presetNames: PresetName[] = Object.keys(PRESETS) as PresetName[],
): Variant[] {
  return presetNames.map((preset) => {
    const styled = applyStyle(base, PRESETS[preset]);
    const findings = lintDirection(styled.props);
    const errors = findings.filter((f) => f.severity === "error");
    return { preset, styled, findings, errors, pass: errors.length === 0 };
  });
}

/** A compact pass/fail gate table (plain text) — one row per variant. */
export function gateTable(variants: Variant[]): string {
  const header = "  PRESET            GATE  FINDINGS";
  const rows = variants.map((v) => {
    const status = v.pass ? "PASS" : "FAIL";
    const warns = v.findings.filter((f) => f.severity === "warn").length;
    return `  ${v.preset.padEnd(17)} ${status}  (${v.errors.length} err, ${warns} warn)`;
  });
  return [header, ...rows].join("\n");
}
