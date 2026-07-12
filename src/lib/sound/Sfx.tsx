// One-shot sound effect placed exactly on a frame. <Sequence from={at}> puts the clip's
// onset on composition frame `at` (same mechanic as visual timing). Mix levels follow the
// research hierarchy: hero SFX (whoosh/success) near -6..-9 dBFS, ticks (tap/select) lower
// — expressed here as the `volume` prop (the synthesized clips are already peak-normalized,
// so volume is the relative mix level).
//
// CLIPS is a name→file registry over public/audio/. The files are our own DSP synthesis
// (self-contained, license-clean); to swap in a hand-picked Kenney (CC0) / Pixabay sample,
// drop the file in public/audio/ and repoint the path here — the composition doesn't change.
import React from "react";
import { Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";

export const CLIPS = {
  tap: "audio/tap.wav",
  select: "audio/select.wav",
  confirm: "audio/confirm.wav",
  pop: "audio/pop.wav",
  whoosh: "audio/whoosh.wav",
  success: "audio/success.wav",
} as const;

export type SfxClip = keyof typeof CLIPS;

// suggested default mix level per clip (relative; hero louder than ticks)
const DEFAULT_VOL: Record<SfxClip, number> = {
  tap: 0.5,
  select: 0.45,
  confirm: 0.7,
  pop: 0.6,
  whoosh: 0.8,
  success: 0.95,
};

export const Sfx: React.FC<{
  clip: SfxClip;
  at: number; // composition-absolute frame the SFX lands on
  volume?: number; // 0-1 relative level (default per-clip)
  playbackRate?: number; // pitch/speed variation to avoid identical repeats
}> = ({ clip, at, volume, playbackRate }) => (
  <Sequence from={at} name={`sfx:${clip}`} layout="none">
    <Audio
      src={staticFile(CLIPS[clip])}
      volume={volume ?? DEFAULT_VOL[clip]}
      playbackRate={playbackRate}
    />
  </Sequence>
);
