// Before/after split — the Comparison beat. Starts showing all of `left` (before),
// then a divider sweeps in and reveals `right` (after) on the far side, resting at a
// 50/50 split so the viewer can compare. `right` is clipped (not mounted twice), so
// pass two full-frame layers styled to the same box. Vertical split (x-axis) — the
// canonical before/after. Put labels via labelLeft / labelRight.
//
// ⚠️ It's a WIPE over a shared coordinate space (best for the same scene in two
// states). If the two sides are DIFFERENT content (text/metrics), keep each side's
// focal content away from the vertical center — anchor `left` toward the left edge and
// `right` toward the right — or it collides on the seam at the 50/50 rest split.
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { EASE, clamp01 } from "../v2/anim";
import { theme } from "../theme";

export const SplitCompare: React.FC<{
  left: React.ReactNode; // "before"
  right: React.ReactNode; // "after"
  at?: number; // reveal start frame (default 0)
  dur?: number; // sweep length (default 26)
  rest?: number; // resting split %, 0-100 (default 50)
  labelLeft?: string;
  labelRight?: string;
  accent?: string; // divider + "after" label tint (default theme.color.primary)
}> = ({
  left,
  right,
  at = 0,
  dur = 26,
  rest = 50,
  labelLeft,
  labelRight,
  accent = theme.color.primary,
}) => {
  const frame = useCurrentFrame();
  // 100% = all "before"; sweeps left to `rest` revealing "after" on the right.
  const split = interpolate(frame, [at, at + dur], [100, rest], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const revealed = split < 99.5;

  const Label: React.FC<{ text: string; side: "left" | "right"; tint: string }> = ({
    text,
    side,
    tint,
  }) => (
    <div
      style={{
        position: "absolute",
        top: 40,
        [side]: 40,
        padding: "10px 22px",
        borderRadius: theme.radius.pill,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        fontFamily: theme.font.family,
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 0.5,
        color: tint,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill>
      {/* before */}
      <AbsoluteFill>{left}</AbsoluteFill>
      {/* after — only the portion right of the divider is shown */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${split}%)` }}>{right}</AbsoluteFill>

      {/* divider line + handle */}
      {revealed ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${split}%`,
            width: 4,
            marginLeft: -2,
            background: accent,
            boxShadow: `0 0 24px ${accent}`,
            opacity: clamp01((frame - at) / 6),
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 56,
              height: 56,
              borderRadius: 999,
              background: accent,
              boxShadow: `0 6px 20px rgba(0,0,0,0.4)`,
            }}
          />
        </div>
      ) : null}

      {labelLeft ? <Label text={labelLeft} side="left" tint="#fff" /> : null}
      {labelRight && revealed ? <Label text={labelRight} side="right" tint={accent} /> : null}
    </AbsoluteFill>
  );
};
