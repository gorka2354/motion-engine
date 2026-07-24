import type { PromoProps } from "./promoSchema";

/**
 * Deterministic direction linter for the "promo as data" scene-map (inc:
 * director-layer, Increment 1). Codifies the craft rules that the motion-promo
 * skill spells out in prose — pacing, readability, act balance — as mechanical
 * checks so the timing (the skill's own "weakest link") is enforced, not
 * re-derived each promo.
 *
 * SCOPE: only what the scene-map can express (beat windows + the optional `role`
 * tag). Camera/transition direction (zoom, blur, push-back, entrance kind) lives
 * in engine code — `// stays code` in FloatingPhonePromo — and is NOT lintable
 * from the map. Those rules wait until the map can describe them (a read-only
 * camera descriptor); adding them here would only produce checks that can never
 * fire. Pure & DOM-free (node-testable, no Math.random / Date.now).
 */

export type Role = "hook" | "demo" | "benefit" | "cta";

/** Canonical act order — a promo should progress forward through these. */
export const ROLE_ORDER: readonly Role[] = ["hook", "demo", "benefit", "cta"];

export type Severity = "error" | "warn";
/** gstack `review` disposition: mechanical fix vs. author judgement. */
export type FixKind = "AUTO-FIX" | "ASK";

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
  fix: FixKind;
}

export interface LintConfig {
  /** Minimum on-screen frames for a text beat to be readable (@30fps). */
  minReadFrames: number;
  /** Adjacent beats whose durations differ by less than this % read as robotic. */
  roboticBandPct: number;
  /** Per-role share of total *tagged* beat-frames, as [minPct, maxPct]. */
  actBudget: Record<Role, [number, number]>;
}

export const DEFAULT_CONFIG: LintConfig = {
  minReadFrames: 30,
  roboticBandPct: 8,
  // Coarse guardrails that catch gross imbalance — NOT a house-style straitjacket
  // (that would overfit to the one promo it's calibrated against). Shares are of
  // total *tagged* beat-frames, so they're independent of engine-rendered
  // cold-opens / end-cards that live outside the beats array.
  actBudget: {
    hook: [5, 22],
    demo: [30, 70],
    benefit: [8, 55],
    cta: [0, 30],
  },
};

type Beat = PromoProps["beats"][number];

const dur = (b: Beat): number => b.to - b.from;

/** A beat with a numerically sane [from, to) window. */
const isValidWindow = (b: Beat): boolean =>
  b != null &&
  typeof b.from === "number" &&
  typeof b.to === "number" &&
  Number.isFinite(b.from) &&
  Number.isFinite(b.to) &&
  b.to > b.from;

const validBeats = (beats: Beat[]): Beat[] => beats.filter(isValidWindow);

/** Rule A — every text beat stays on screen long enough to read. */
export function ruleReadTime(beats: Beat[], cfg: LintConfig): Finding[] {
  return validBeats(beats)
    .filter((b) => dur(b) < cfg.minReadFrames)
    .map((b) => ({
      rule: "read-time-floor",
      severity: "error" as const,
      message: `beat "${b.title}" is ${dur(b)}f (< ${cfg.minReadFrames}f min read)`,
      fix: "ASK" as const,
    }));
}

/** Rule B — adjacent beats shouldn't be near-equal length (robotic rhythm). */
export function ruleRhythm(beats: Beat[], cfg: LintConfig): Finding[] {
  const v = validBeats(beats);
  const out: Finding[] = [];
  for (let i = 1; i < v.length; i++) {
    const a = dur(v[i - 1]);
    const b = dur(v[i]);
    const diffPct = (Math.abs(a - b) / Math.max(a, b)) * 100;
    if (diffPct < cfg.roboticBandPct) {
      out.push({
        rule: "rhythm-variance",
        severity: "warn",
        message: `beats "${v[i - 1].title}" (${a}f) & "${v[i].title}" (${b}f) differ by ${diffPct.toFixed(0)}% (< ${cfg.roboticBandPct}% → robotic)`,
        fix: "AUTO-FIX",
      });
    }
  }
  return out;
}

/** Rule C — each role's share of tagged beat-frames sits in a sane band. */
export function ruleActBudget(beats: Beat[], cfg: LintConfig): Finding[] {
  const tagged = validBeats(beats).filter((b): b is Beat & { role: Role } => b.role != null);
  if (tagged.length === 0) return [];
  const total = tagged.reduce((s, b) => s + dur(b), 0);
  if (total <= 0) return [];
  const byRole = new Map<Role, number>();
  for (const b of tagged) byRole.set(b.role, (byRole.get(b.role) ?? 0) + dur(b));
  const out: Finding[] = [];
  for (const [role, frames] of byRole) {
    const pct = (frames / total) * 100;
    const [lo, hi] = cfg.actBudget[role];
    if (pct < lo || pct > hi) {
      out.push({
        rule: "act-budget",
        severity: "warn",
        message: `${role} is ${pct.toFixed(0)}% of tagged beats (band ${lo}–${hi}%)`,
        fix: "ASK",
      });
    }
  }
  return out;
}

/** Rule D — tagged roles progress forward (hook→demo→benefit→cta), never back. */
export function ruleRoleOrder(beats: Beat[]): Finding[] {
  const tagged = validBeats(beats).filter((b): b is Beat & { role: Role } => b.role != null);
  const out: Finding[] = [];
  let maxSeen = -1;
  for (const b of tagged) {
    const idx = ROLE_ORDER.indexOf(b.role);
    if (idx < maxSeen) {
      out.push({
        rule: "role-order",
        severity: "warn",
        message: `beat "${b.title}" (${b.role}) comes after a later act — roles should progress ${ROLE_ORDER.join("→")}`,
        fix: "ASK",
      });
    }
    maxSeen = Math.max(maxSeen, idx);
  }
  return out;
}

/**
 * Lint a promo scene-map against the deterministic direction rules above.
 * Returns [] for a clean map. Malformed beats surface as `error` findings
 * rather than throwing, so a broken map fails loudly but gracefully.
 */
export function lintDirection(
  map: Pick<PromoProps, "beats"> | null | undefined,
  cfg: LintConfig = DEFAULT_CONFIG,
): Finding[] {
  if (!map || !Array.isArray(map.beats)) {
    return [{ rule: "schema", severity: "error", message: "scene-map has no `beats` array", fix: "ASK" }];
  }
  const beats = map.beats as Beat[];
  const malformed: Finding[] = beats
    .filter((b) => !isValidWindow(b))
    .map((b) => ({
      rule: "schema",
      severity: "error" as const,
      message: `beat "${b?.title ?? "?"}" has an invalid [from,to) window`,
      fix: "ASK" as const,
    }));
  return [
    ...malformed,
    ...ruleReadTime(beats, cfg),
    ...ruleRhythm(beats, cfg),
    ...ruleActBudget(beats, cfg),
    ...ruleRoleOrder(beats),
  ];
}

/** Convenience: only the blocking (error-severity) findings. */
export const lintErrors = (
  map: Pick<PromoProps, "beats"> | null | undefined,
  cfg: LintConfig = DEFAULT_CONFIG,
): Finding[] => lintDirection(map, cfg).filter((f) => f.severity === "error");
