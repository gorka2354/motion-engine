// Focus / "dim-the-rest" — a radial scrim that darkens everything except a lit area
// around the active element, so the eye has nowhere else to go (research 2026-07-11:
// 3-5 focus beats per video reads as professional). Reuses the theme.dark scrim idea.
// Overlay it ABOVE the content it should dim. Pair with a CameraRig push-in for a full
// zoom-to-detail beat. Rectangular variant covers cards/rows; circular covers a control.
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Spotlight: React.FC<{
  cx: number; // lit center, composition px
  cy: number;
  radius: number; // fully-lit radius
  softness?: number; // gradient falloff px (default 220)
  intensity?: number; // darkness outside 0-1 (default 0.62)
  enterAt?: number; // fade-in frame (default 0)
  enterDur?: number; // fade-in length (default 12f)
  exitAt?: number; // optional fade-out frame
  exitDur?: number;
}> = ({
  cx,
  cy,
  radius,
  softness = 220,
  intensity = 0.62,
  enterAt = 0,
  enterDur = 12,
  exitAt,
  exitDur = 12,
}) => {
  const frame = useCurrentFrame();
  let op = interpolate(frame, [enterAt, enterAt + enterDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (exitAt != null) {
    op *= interpolate(frame, [exitAt, exitAt + exitDur], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: op,
        background: `radial-gradient(circle ${radius + softness}px at ${cx}px ${cy}px, transparent ${radius}px, rgba(4,5,12,${intensity}) ${radius + softness}px)`,
      }}
    />
  );
};
