import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";

/**
 * Depth-parallax drift: children wander on a slow organic simplex-noise
 * path. Deterministic — pure function of frame + seed. Stack layers with
 * different depths (far = small, near = big) to fake depth.
 */
export const Parallax: React.FC<{
  children: React.ReactNode;
  /** Unique per layer so layers don't move in lockstep. */
  seed?: string;
  /** 0..1 — scales amplitude. */
  depth?: number;
  /** Max drift in px at depth 1. */
  amplitude?: number;
  /** Noise time step per frame. */
  speed?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  seed = "layer",
  depth = 0.5,
  amplitude = 48,
  speed = 0.004,
  style,
}) => {
  const f = useCurrentFrame();
  const x = noise2D(`${seed}-x`, f * speed, 0) * amplitude * depth;
  const y = noise2D(`${seed}-y`, f * speed, 0) * amplitude * depth;
  return <div style={{ translate: `${x}px ${y}px`, ...style }}>{children}</div>;
};
