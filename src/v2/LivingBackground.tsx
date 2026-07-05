import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Grain } from "../lib/Grain";

/**
 * Continuously breathing dark stage (inc-3): rich navy base with two drifting
 * brand-blue glow blobs (single-accent rule), a vignette for depth and a live
 * film-grain pass on top. Blobs never reset per scene.
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
    <AbsoluteFill style={{ background: theme.dark.bg }}>
      <div
        style={{
          position: "absolute",
          top: -220 + y1,
          left: -180 + x1,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: theme.color.primary,
          filter: "blur(150px)",
          opacity: 0.3,
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
          background: theme.color.primaryDeep,
          filter: "blur(160px)",
          opacity: 0.34,
        }}
      />
      {/* vignette for depth */}
      <AbsoluteFill style={{ background: theme.dark.vignette }} />
      {children}
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
