// SFX registry — a pure name→file map + default mix levels, no React/remotion so it
// can be imported by node tests (the manifest test verifies every file exists). The
// files are our own DSP synthesis (self-contained); swap in a Kenney (CC0) / Pixabay
// sample by dropping it in public/audio/ and repointing the path here.

export const CLIPS = {
  tap: "audio/tap.wav",
  select: "audio/select.wav",
  confirm: "audio/confirm.wav",
  pop: "audio/pop.wav",
  whoosh: "audio/whoosh.wav",
  sheet: "audio/sheet.wav", // soft tonal panel-rise (use for sheet/drawer opens, not whoosh)
  success: "audio/success.wav",
  count: "audio/count.wav", // ~2.3s accelerating ticks + resolve ding — for count-up beats
  levelup: "audio/levelup.wav", // soft rising "ta-da" — for level-up beats
  // extended moment-specific set (synth): power/dawn/morph/type/rumble/countTick
  powerDown: "audio/powerDown.wav", // CRT/power-loss cut — shutdown beat
  powerUp: "audio/powerUp.wav", // warm rising swell → bell — power-on
  dawnChime: "audio/dawnChime.wav", // soft major bell bloom — sunrise/«Заря»
  morph: "audio/morph.wav", // filtered up-sweep — a bar/UI morphing into something
  typeTick: "audio/typeTick.wav", // very short soft keystroke click
  rumble: "audio/rumble.wav", // deep sub-bass thrust swell — under a launch
  countTick: "audio/countTick.wav", // firm single tick — countdown step
  hmm1: "audio/hmm1.wav", // recorded vocal reaction (surprise/approval) for smiles
  hmm2: "audio/hmm2.wav",
  hmm3: "audio/hmm3.wav",
} as const;

export type SfxClip = keyof typeof CLIPS;

// suggested default mix level per clip (relative; hero louder than ticks)
export const DEFAULT_VOL: Record<SfxClip, number> = {
  tap: 0.5,
  select: 0.45,
  confirm: 0.7,
  pop: 0.6,
  whoosh: 0.8,
  sheet: 0.55,
  success: 0.95,
  count: 0.6,
  levelup: 0.6,
  powerDown: 0.7,
  powerUp: 0.6,
  dawnChime: 0.6,
  morph: 0.5,
  typeTick: 0.35,
  rumble: 0.7,
  countTick: 0.55,
  hmm1: 0.7,
  hmm2: 0.7,
  hmm3: 0.7,
};
