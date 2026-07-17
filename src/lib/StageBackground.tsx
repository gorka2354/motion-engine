import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Grain } from "./Grain";

/**
 * Generic breathing dark stage — LivingBackground generalized for any brand
 * (each brand parametrizes colors instead of forking).
 * Two drifting glow blobs + vignette + film grain.
 */
export const StageBackground: React.FC<{
  bg: string;
  glowA: string;
  glowB?: string;
  glowOpacity?: number;
  grain?: number;
  children?: React.ReactNode;
}> = ({ bg, glowA, glowB, glowOpacity = 0.3, grain = 0.07, children }) => {
  const f = useCurrentFrame();
  const x1 = Math.sin(f * 0.006) * 60;
  const y1 = Math.cos(f * 0.005) * 46;
  const x2 = Math.cos(f * 0.0045) * 70;
  const y2 = Math.sin(f * 0.0055) * 52;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <div
        style={{
          position: "absolute",
          top: -240 + y1,
          left: -200 + x1,
          width: 820,
          height: 820,
          borderRadius: "50%",
          background: glowA,
          filter: "blur(150px)",
          opacity: glowOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -260 + y2,
          right: -240 + x2,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: glowB ?? glowA,
          filter: "blur(160px)",
          opacity: glowOpacity * 1.1,
        }}
      />
      <AbsoluteFill style={{ background: theme.dark.vignette }} />
      {children}
      {grain > 0 ? <Grain opacity={grain} /> : null}
    </AbsoluteFill>
  );
};
