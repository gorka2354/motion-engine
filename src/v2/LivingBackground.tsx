import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Grain } from "../lib/Grain";

/** Backdrop colors the stage is painted with (brand-swappable). */
export type StageBg = {
  bg: string;
  vignette: string;
  blobA: string;
  blobB: string;
};

/** Default = the tixu dark navy stage (keeps existing callers pixel-identical). */
const DEFAULT_STAGE: StageBg = {
  bg: theme.dark.bg,
  vignette: theme.dark.vignette,
  blobA: theme.color.primary,
  blobB: theme.color.primaryDeep,
};

/**
 * Continuously breathing dark stage (inc-3): rich base with two drifting
 * brand glow blobs (single-accent rule), a vignette for depth and a live
 * film-grain pass on top. Blobs never reset per scene. Colors come from the
 * `stage` prop so a promo can rebrand the backdrop; the default reproduces the
 * original tixu navy exactly.
 */
export const LivingBackground: React.FC<{
  children?: React.ReactNode;
  stage?: StageBg;
}> = ({ children, stage = DEFAULT_STAGE }) => {
  const f = useCurrentFrame();
  const x1 = Math.sin(f * 0.006) * 60;
  const y1 = Math.cos(f * 0.005) * 46;
  const x2 = Math.cos(f * 0.0045) * 70;
  const y2 = Math.sin(f * 0.0055) * 52;

  return (
    <AbsoluteFill style={{ background: stage.bg }}>
      <div
        style={{
          position: "absolute",
          top: -220 + y1,
          left: -180 + x1,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: stage.blobA,
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
          background: stage.blobB,
          filter: "blur(160px)",
          opacity: 0.34,
        }}
      />
      {/* vignette for depth */}
      <AbsoluteFill style={{ background: stage.vignette }} />
      {children}
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
