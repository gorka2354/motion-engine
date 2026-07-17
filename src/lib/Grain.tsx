import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Animated film-grain overlay. SVG turbulence seeded by the frame number —
 * fully deterministic, re-rolls every frame so the grain "lives".
 * Layer it on top of a scene; keep opacity subtle (0.04–0.08).
 *
 * Blend choice matters: `overlay` (default) reads on mid-tone/dark bases and
 * is mathematically ~invisible on near-white; on light scenes use
 * `blend="multiply"` (darkens whites slightly).
 */
/** Neutral color of each blend mode — noise contracts toward it as strength → 0. */
const BLEND_IDENTITY: Record<string, number> = {
  multiply: 1,
  screen: 0,
};

export const Grain: React.FC<{
  /** Grain strength 0..1 — contrast of the noise around the blend's neutral point. */
  opacity?: number;
  /**
   * Noise frequency; ~0.8 ≈ fine grain, lower = coarser. Never use integers
   * (1.0 samples the noise lattice at its zero-nodes → flat output).
   */
  frequency?: number;
  /** overlay/soft-light for mid/dark bases, multiply for light, screen for very dark. */
  blend?: "overlay" | "soft-light" | "multiply" | "screen";
}> = ({ opacity = 0.06, frequency = 0.8, blend = "overlay" }) => {
  const frame = useCurrentFrame();
  const id = `grain${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // The layer must stay FULLY OPAQUE: headless Chromium silently drops
  // mix-blend-mode for any non-opaque content (element opacity or per-pixel
  // alpha). Strength therefore lives in color contrast — the noise is squeezed
  // toward the blend's identity color, which the blend maps to "no change".
  const identity = BLEND_IDENTITY[blend] ?? 0.5;
  const slope = opacity;
  const intercept = identity * (1 - opacity);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: blend, zIndex: 100 }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves={2}
            stitchTiles="stitch"
            seed={frame % 1000}
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={slope} intercept={intercept} />
            <feFuncG type="linear" slope={slope} intercept={intercept} />
            <feFuncB type="linear" slope={slope} intercept={intercept} />
            <feFuncA type="linear" slope={0} intercept={1} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
