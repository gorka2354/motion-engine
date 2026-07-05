import { Easing, interpolate } from "remotion";
import { theme } from "../theme";

/** Soft expo-out — the "Apple" ease for entrances. */
export const EASE = Easing.bezier(...theme.ease.enter);
/** Symmetric ease for camera moves. */
export const EASE_INOUT = Easing.bezier(...theme.ease.inOut);
/** Accelerating ease for exits. */
export const EASE_OUT = Easing.bezier(...theme.ease.exit);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Multi-stop keyframe interpolation, eased per segment, clamped. */
export const kf = (
  frame: number,
  pairs: [number, number][],
  easing = EASE_INOUT,
) =>
  interpolate(
    frame,
    pairs.map((p) => p[0]),
    pairs.map((p) => p[1]),
    { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

/** Spring presets — pass as `config` to remotion's spring(). */
export const SPRING = {
  /** Critically-damped settle, no overshoot — large surfaces, camera moves. */
  smooth: { damping: 200 },
  /** Snappy pop with a hint of overshoot — cards, chips, buttons. */
  pop: { damping: 18, stiffness: 160, mass: 0.9 },
  /** Playful visible bounce — badges, emoji, small accents. */
  bounce: { damping: 11, stiffness: 170, mass: 1 },
} as const;

/** Start frame of the i-th staggered item. */
export const stagger = (i: number, start: number, step: number) =>
  start + i * step;

/** Eased 0→1 progress of the i-th staggered item (replaces manual `start + i*step` windows). */
export const stagger01 = (
  frame: number,
  i: number,
  start: number,
  step: number,
  dur = 14,
  easing = EASE,
) =>
  interpolate(frame, [start + i * step, start + i * step + dur], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/**
 * Visibility window with separate eased enter/exit progress.
 * enter: 0→1 over inDur from `from`; exit: 0→1 over outDur ending at `to`.
 */
export const window01 = (
  f: number,
  from: number,
  to: number,
  inDur: number = theme.duration.beatIn,
  outDur: number = theme.duration.beatOut,
) => {
  const enter = interpolate(f, [from, from + inDur], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(f, [to - outDur, to], [0, 1], {
    easing: EASE_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { enter, exit, opacity: enter * (1 - exit) };
};
