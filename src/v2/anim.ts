import { Easing, interpolate } from "remotion";

/** Soft expo-out — the "Apple" ease for entrances. */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** Symmetric ease for camera moves. */
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
/** Accelerating ease for exits. */
export const EASE_OUT = Easing.bezier(0.4, 0, 1, 1);

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

/**
 * Visibility window with separate eased enter/exit progress.
 * enter: 0→1 over inDur from `from`; exit: 0→1 over outDur ending at `to`.
 */
export const window01 = (
  f: number,
  from: number,
  to: number,
  inDur = 22,
  outDur = 18,
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
