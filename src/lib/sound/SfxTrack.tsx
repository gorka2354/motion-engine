import React from "react";
import { Sfx } from "./Sfx";
import { CLIPS, type SfxClip } from "./clips";

/** One scheduled sound effect on the composition timeline. */
export interface SfxCue {
  clip: SfxClip;
  at: number; // composition-absolute frame
  volume?: number;
  playbackRate?: number;
}

/**
 * A data-driven SFX track — declare cues as an array and render them all. Keeps
 * the sound layer authorable as data (like the visual scene map) instead of a
 * wall of <Sfx> elements, and pairs with {@link cuesInRange} to catch a cue that
 * lands off the timeline or references a renamed clip.
 */
export const SfxTrack: React.FC<{ cues: SfxCue[] }> = ({ cues }) => (
  <>
    {cues.map((c, i) => (
      <Sfx key={i} clip={c.clip} at={c.at} volume={c.volume} playbackRate={c.playbackRate} />
    ))}
  </>
);

export interface CueProblem {
  index: number;
  clip: string;
  at: number;
  reason: "unknown-clip" | "before-start" | "after-end";
}

/** Validate a cue list against the composition length — returns the problems (empty = OK). */
export const cuesInRange = (cues: SfxCue[], durationInFrames: number): CueProblem[] => {
  const problems: CueProblem[] = [];
  cues.forEach((c, index) => {
    if (!(c.clip in CLIPS)) problems.push({ index, clip: c.clip, at: c.at, reason: "unknown-clip" });
    else if (c.at < 0) problems.push({ index, clip: c.clip, at: c.at, reason: "before-start" });
    else if (c.at >= durationInFrames) problems.push({ index, clip: c.clip, at: c.at, reason: "after-end" });
  });
  return problems;
};
