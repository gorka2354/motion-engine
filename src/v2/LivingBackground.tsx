import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/**
 * Continuously breathing backdrop: the brand gradient with two soft blobs that
 * drift for the whole video (never resetting per scene) + a faint vignette.
 */
export const LivingBackground: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const f = useCurrentFrame();
  const x1 = Math.sin(f * 0.006) * 60;
  const y1 = Math.cos(f * 0.005) * 46;
  const x2 = Math.cos(f * 0.0045) * 70;
  const y2 = Math.sin(f * 0.0055) * 52;

  return (
    <AbsoluteFill
      style={{
        background: theme.gradient.living,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -220 + y1,
          left: -180 + x1,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: theme.color.gradTop,
          filter: "blur(140px)",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 900 + y2,
          right: -280 + x2,
          width: 680,
          height: 680,
          borderRadius: "50%",
          background: theme.color.gradLavender,
          filter: "blur(150px)",
          opacity: 0.55,
        }}
      />
      {/* faint vignette for depth */}
      <AbsoluteFill
        style={{
          background: theme.gradient.vignette,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
