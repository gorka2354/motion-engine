import { noise2D } from "@remotion/noise";

/**
 * Deterministic starfield math — pure, frame-driven, no Math.random / RAF.
 * The real app's StarBackdrop is a RAF+random canvas; this re-authors the same
 * look (slow downward drift, per-star twinkle, brass-gold minority, occasional
 * shooting star) as pure functions of (index, frame) so it renders identically
 * every pass and is unit-testable. `noise2D(seed, x, y) ∈ [-1,1]` supplies the
 * per-star constants; `frame` supplies the animation.
 */

/** noise-derived pseudo-random in [0,1) keyed by a seed string and index. */
const r01 = (seed: string, i: number): number => (noise2D(seed, i * 0.6180339 + 0.5, 0) + 1) / 2;

export interface Star {
  x: number;
  y: number;
  size: number; // 1 or 2 px
  alpha: number; // 0..1
  gold: boolean;
}

/**
 * Position + look of star `i` at `frame` within a `w×h` field.
 * Drift wraps vertically; twinkle is a per-star-phase sine.
 */
export function starAt(i: number, frame: number, w: number, h: number): Star {
  const rx = r01("zx", i);
  const ry = r01("zy", i);
  const speed = 0.04 + r01("zs", i) * 0.14; // px/frame downward
  const y = (((ry * h + frame * speed) % (h + 6)) + h + 6) % (h + 6) - 3;
  const x = rx * w;
  const phase = r01("zp", i) * Math.PI * 2;
  const tw = 0.22 + 0.6 * (0.5 + 0.5 * Math.sin(phase + frame * 0.085));
  const baseA = 0.5 + r01("za", i) * 0.5;
  const alpha = Math.min(1, tw * baseA) * 0.55;
  const size = r01("zz", i) < 0.16 ? 2 : 1;
  const gold = r01("zg", i) < 0.22;
  return { x, y, size, alpha, gold };
}

export interface Meteor {
  x: number;
  y: number;
  alpha: number;
  dx: number; // streak vector (tail = -dx,-dy)
  dy: number;
}

/**
 * The single active shooting star at `frame`, or null between spawns. One
 * meteor per PERIOD frames, living LIFE frames, streaking down-left from the
 * upper-right — spawn point seeded by the meteor index so it never repeats
 * position but is fully deterministic.
 */
export function meteorAt(frame: number, w: number, h: number, period = 165, life = 30): Meteor | null {
  if (frame < 0) return null;
  const k = Math.floor(frame / period);
  const local = frame - k * period;
  if (local > life) return null;
  const sx = 0.5 + r01("mx", k) * 0.5; // right half
  const sy = r01("my", k) * 0.35; // upper third
  const p = local / life;
  const x = (sx - p * 0.46) * w;
  const y = (sy + p * 0.3) * h;
  const alpha = (1 - p) * 0.85;
  return { x, y, alpha, dx: -0.46 * w * 0.06, dy: 0.3 * h * 0.06 };
}
