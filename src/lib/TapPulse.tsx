// Tap/click indicator for UI demos — an expanding ring + a solid center dot, all
// derived from ONE progress value (footgun #5: cursor-led motion must come from a
// single source, not parallel curves). Fire it ~3-6 frames AFTER a <Cursor> arrives,
// never at the same instant. Pair with a press-scale on the target element for the
// full "it got tapped" read (the press-scale lives on the target, not here).
import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp01 } from "../v2/anim";
import { hexToRgba } from "./color";
import { theme } from "../theme";

export const TapPulse: React.FC<{
  at: number; // tap frame
  x: number;
  y: number; // composition px
  color?: string;
  size?: number; // max ring radius
  dur?: number; // frames the ripple lives
}> = ({ at, x, y, color = theme.jumper.accent, size = 52, dur = 20 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = clamp01((frame - at) / dur);
  if (p >= 1) return null;
  const r = 14 + p * size;
  const dotR = 11;

  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      {/* expanding ring */}
      <div
        style={{
          position: "absolute",
          left: -r,
          top: -r,
          width: r * 2,
          height: r * 2,
          borderRadius: 999,
          border: `3px solid ${color}`,
          opacity: (1 - p) * 0.85,
        }}
      />
      {/* center dot — fades slightly slower so the point stays legible */}
      <div
        style={{
          position: "absolute",
          left: -dotR,
          top: -dotR,
          width: dotR * 2,
          height: dotR * 2,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 16px ${hexToRgba(color, 0.9)}`,
          opacity: (1 - p) * 0.9,
        }}
      />
    </div>
  );
};
