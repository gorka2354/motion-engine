// Music bed — a looping background track with fade-in/out and optional ducking around
// hero SFX. Mount it at the ROOT of the composition (NOT inside a <Sequence>) so the
// volume callback's frame is composition-absolute and matches the absolute SFX frames
// you pass to `duckAround` (footgun: wrapping this in a Sequence silently shifts the
// duck windows). volume stays a pure function of frame → determinism-safe.
//
// Uses @remotion/media's <Audio> (WebCodecs, timeline-accurate). loopVolumeCurveBehavior
// "extend" keeps the fade envelope running across loop iterations (whole-composition
// fade) instead of restarting each loop.
import React from "react";
import { useVideoConfig, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { duck, type DuckEvent } from "./duck";

export const Music: React.FC<{
  src: string; // staticFile("audio/bed.wav")
  peak?: number; // ceiling volume 0-1 (default 0.18 — a bed sits well under the SFX)
  fadeIn?: number; // frames (default 24)
  fadeOut?: number; // frames (default 40)
  loop?: boolean; // default true
  duckAround?: DuckEvent[]; // SFX frames to dip under
}> = ({ src, peak = 0.18, fadeIn = 24, fadeOut = 40, loop = true, duckAround = [] }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Audio
      src={src}
      loop={loop}
      loopVolumeCurveBehavior="extend"
      volume={(f) => {
        const envelope = interpolate(
          f,
          [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return envelope * peak * duck(f, duckAround);
      }}
    />
  );
};
