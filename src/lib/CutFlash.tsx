import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01 } from "../v2/anim";

/**
 * Editorial light-bloom over a cut: a soft radial flash that peaks exactly
 * on the splice and masks the seam (the classic film-transition trick).
 * Place ABOVE both layers of the cut; time `at` to the middle of the blend.
 */
export const CutFlash: React.FC<{
  /** Frame of the flash peak. */
  at: number;
  /** Total duration (bell curve), frames. */
  dur?: number;
  /** Peak opacity 0..1 — keep subtle (0.2–0.4). */
  peak?: number;
  /** Flash tint. */
  color?: string;
}> = ({ at, dur = 22, peak = 0.32, color = "#EAE6FF" }) => {
  const f = useCurrentFrame();
  const p = clamp01((f - (at - dur / 2)) / dur);
  if (p <= 0 || p >= 1) return null;
  const o = peak * Math.sin(Math.PI * p);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(90% 70% at 50% 46%, ${color} 0%, transparent 78%)`,
        opacity: o,
        zIndex: 90,
        pointerEvents: "none",
      }}
    />
  );
};
