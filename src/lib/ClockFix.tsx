import React from "react";
import { useFrame } from "@react-three/fiber";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Frame-locks R3F's clock for deterministic offline renders.
 *
 * WHY: `@remotion/three`'s ThreeCanvas steps R3F manually with
 * `advance(performance.now())` — real wall-clock ms, not frame-derived, poured
 * into `three.Clock` (which treats the field as SECONDS). So any drei/effect
 * that reads `state.clock.elapsedTime` runs ~1000× too fast AND differs between
 * a fresh mount (stills) and an accumulated video render / parallel chunks →
 * non-deterministic, fails the project's Δ=0 convention (see CLAUDE.md footguns).
 *
 * This runs at priority -1 (before every other useFrame subscriber — R3F sorts
 * ascending and only suppresses the default render for priority > 0) and
 * overwrites the clock with frame-locked seconds.
 *
 * COVERS: drei helpers that read the clock directly (MeshTransmissionMaterial,
 * a hand-rolled Float/Sparkles that reads elapsedTime).
 * DOES NOT COVER: `@react-three/postprocessing` <EffectComposer> — it consumes
 * the `delta` argument of useFrame, baked before subscribers run. Its needed
 * effects (Bloom/DoF/Vignette/CA/ToneMapping non-adaptive) are spatial and read
 * no time, so they're deterministic anyway. Drop this as a sibling in <ThreeCanvas>.
 */
export const ClockFix: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useFrame((state) => {
    state.clock.elapsedTime = frame / fps;
  }, -1);
  return null;
};
