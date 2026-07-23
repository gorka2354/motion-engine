import { noise2D } from "@remotion/noise";

/**
 * Deterministic rocket-launch math — pure, frame-driven re-authoring of the
 * app's RocketLaunch.tsx (originally RAF + Math.random). Local frame `f` starts
 * at 0 the moment ПУСК is pressed. Timeline @30fps:
 *   f∈[0,LIFT)   countdown 3·2·1 (real app shows this)
 *   f>=LIFT      liftoff — rocket accelerates up and out of frame, embers, glow
 * Everything is a pure function of (index, f) so it renders identically.
 */
export const LIFT = 30; // countdown length before liftoff
export const RISE = 82; // frames for the rocket to clear the top
export const LAUNCH_TOTAL = 138; // overlay lifetime

const r01 = (seed: string, i: number): number => (noise2D(seed, i * 0.6180339 + 0.5, 0) + 1) / 2;

/** Rocket nose Y (px) in a field of height `h`. Sits on the pad, then accelerates out the top. */
export function rocketY(f: number, h: number): number {
  const padY = h * 0.8;
  if (f < LIFT) {
    // tiny pre-launch shudder
    return padY + Math.sin(f * 0.8) * (f > LIFT - 8 ? 1.5 : 0);
  }
  const t = Math.min(1, (f - LIFT) / RISE);
  const ease = t * t; // accelerate (thrust builds)
  return padY - ease * (padY + 220);
}

/** Countdown state: label "3"/"2"/"1" and 0→1 progress within the current tick, or null after liftoff. */
export function countPhase(f: number): { label: string | null; p: number } {
  if (f >= LIFT) return { label: null, p: 1 };
  const tick = Math.floor(f / 10); // 0,1,2
  const label = ["3", "2", "1"][tick] ?? null;
  return { label, p: (f % 10) / 10 };
}

/** Radial launch-glow intensity 0..1 at the pad. */
export function padGlow(f: number): number {
  if (f < LIFT) return Math.min(0.3, f / 60);
  return Math.min(1, 0.3 + (f - LIFT) / 40);
}

export interface Ember {
  x: number;
  y: number;
  alpha: number;
  size: number;
  hue: number; // HSL hue 20..55 (orange→gold)
}

/**
 * Exhaust ember `i` at frame `f`, or null when not alive. Embers spawn from the
 * rocket nozzle across the liftoff window, then fall + spread + fade.
 */
export function ember(i: number, f: number, w: number, h: number): Ember | null {
  const spawn = LIFT + (i % RISE); // one wave per liftoff frame
  const LIFE = 30;
  const age = f - spawn;
  if (age < 0 || age >= LIFE) return null;
  const nozzleX = w / 2 + (r01("ex", i) - 0.5) * 20;
  const nozzleY = rocketY(spawn, h) + 60; // below the nose
  const vx = (r01("evx", i) - 0.5) * 3.2;
  const vy = 1.6 + r01("evy", i) * 2.8;
  const x = nozzleX + vx * age;
  const y = nozzleY + vy * age + 0.05 * age * age;
  const k = 1 - age / LIFE;
  return { x, y, alpha: k * 0.9, size: (2 + r01("es", i) * 3.4) * k, hue: 20 + r01("eh", i) * 35 };
}

export interface Streak {
  x: number;
  y: number;
  len: number;
  alpha: number;
  width: number;
}

/** Accelerating vertical star-streak `i` — the launch parallax (the ship "rises"). */
export function streak(i: number, f: number, w: number, h: number): Streak {
  const z = 0.2 + r01("sz", i) * 0.8;
  const x = r01("sx", i) * w;
  const lift = Math.max(0, (f - LIFT) / RISE);
  const speed = 40 + lift * 900;
  const y = ((r01("sy", i) * h + f * (z * speed * 0.05)) % (h + 40)) - 20;
  const len = 1 + z * z * speed * 0.02;
  return { x, y, len, alpha: (0.25 + z * 0.6) * Math.min(1, lift * 2 + 0.15), width: z * 1.6 };
}

/** Whole-overlay opacity: fully on during launch, fades out at the end revealing the terminal. */
export function overlayFade(f: number): number {
  if (f < 4) return f / 4;
  if (f > LAUNCH_TOTAL - 20) return Math.max(0, (LAUNCH_TOTAL - f) / 20);
  return 1;
}

/** Subtle screen-shake offset (px) at liftoff. */
export function shake(f: number): { x: number; y: number } {
  const on = f >= LIFT && f < LIFT + 26;
  if (!on) return { x: 0, y: 0 };
  const a = (1 - (f - LIFT) / 26) * 4;
  return { x: Math.sin(f * 2.3) * a, y: Math.cos(f * 3.1) * a };
}
