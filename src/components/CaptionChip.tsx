import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Floating white caption pill above the phone. Fades + slides in. */
export const CaptionChip: React.FC<{ text: string; top?: number }> = ({
  text,
  top = 138,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [4, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [4, 22], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        translate: `0 ${y}px`,
      }}
    >
      <div
        style={{
          background: theme.color.surface,
          border: `1px solid ${theme.color.hair}`,
          borderRadius: theme.radius.pill,
          padding: "14px 30px",
          fontFamily: theme.font.family,
          fontWeight: 700,
          fontSize: 27,
          color: theme.color.ink,
          boxShadow: theme.color.softShadow,
        }}
      >
        {text}
      </div>
    </div>
  );
};
