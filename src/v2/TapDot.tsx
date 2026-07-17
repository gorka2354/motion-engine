import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, EASE } from "./anim";

/**
 * Soft fingertip indicator: fades in, presses (shrinks) with a ripple, fades out.
 * Uses the local (Sequence) frame; position in screen coordinates.
 */
export const TapDot: React.FC<{
  x: number | string;
  y: number;
  from: number;
  pressAt: number;
  to: number;
}> = ({ x, y, from, pressAt, to }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;

  const appear = EASE(clamp01((f - from) / 12));
  const gone = clamp01((f - (to - 10)) / 10);
  const press = clamp01((f - pressAt) / 8) - clamp01((f - pressAt - 10) / 8);
  const ripple = clamp01((f - pressAt) / 22);

  return (
    <>
      {ripple > 0 && ripple < 1 ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 30 + 150 * ripple,
            height: 30 + 150 * ripple,
            borderRadius: 999,
            border: "3px solid rgba(3,20,35,0.25)",
            translate: "-50% -50%",
            opacity: 0.5 * (1 - ripple),
            zIndex: 80,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 58,
          height: 58,
          borderRadius: 999,
          background: "rgba(3,20,35,0.18)",
          border: "2px solid rgba(255,255,255,0.65)",
          boxShadow: "0 6px 18px rgba(3,20,35,0.25)",
          translate: "-50% -50%",
          scale: String((0.7 + 0.3 * appear) * (1 - 0.16 * press)),
          opacity: appear * (1 - gone),
          zIndex: 81,
        }}
      />
    </>
  );
};
