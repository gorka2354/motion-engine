// Focus / "dim-the-rest" — darkens everything except a lit area around the active
// element, so the eye has nowhere else to go (research 2026-07-11: 3–5 focus beats
// per video reads as professional). Overlay it ABOVE the content it should dim; pair
// with a CameraRig push-in for a full zoom-to-detail beat.
//   • shape="circle" — radial falloff around a control/point (radius + softness).
//   • shape="rect"   — soft-edged rounded-rect cutout around a card/row (w × h + corner),
//     done with a big-spread box-shadow so the hole matches the card, not a circle.
// The dim color defaults to the theme.dark scrim base (#040D18 → "4,13,24"); `intensity`
// is its alpha. Pass `dimRgb` to tint the dim to another brand stage.
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Spotlight: React.FC<{
  cx: number; // lit center, composition px
  cy: number;
  shape?: "circle" | "rect";
  radius?: number; // circle: fully-lit radius (default 400)
  w?: number; // rect: lit box width (default 700)
  h?: number; // rect: lit box height (default 200)
  corner?: number; // rect: corner radius (default 24)
  softness?: number; // gradient / edge falloff px (default 220)
  intensity?: number; // darkness outside, 0-1 (default 0.62)
  dimRgb?: string; // dim color as "r,g,b" (default theme.dark scrim base)
  enterAt?: number; // fade-in frame (default 0)
  enterDur?: number; // fade-in length (default 12f)
  exitAt?: number; // optional fade-out frame
  exitDur?: number;
}> = ({
  cx,
  cy,
  shape = "circle",
  radius = 400,
  w = 700,
  h = 200,
  corner = 24,
  softness = 220,
  intensity = 0.62,
  dimRgb = "4,13,24",
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
  const dim = `rgba(${dimRgb},${intensity})`;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: op,
        background:
          shape === "circle"
            ? `radial-gradient(circle ${radius + softness}px at ${cx}px ${cy}px, transparent ${radius}px, ${dim} ${radius + softness}px)`
            : undefined,
      }}
    >
      {shape === "rect" ? (
        <div
          style={{
            position: "absolute",
            left: cx - w / 2,
            top: cy - h / 2,
            width: w,
            height: h,
            borderRadius: corner,
            // transparent box + big-spread shadow = soft-edged "hole" the size of the card
            boxShadow: `0 0 ${softness}px 3000px ${dim}`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
