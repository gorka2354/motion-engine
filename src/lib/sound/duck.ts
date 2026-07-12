import { interpolate } from "remotion";

// Sidechain-style ducking for a music bed: returns a volume MULTIPLIER (1 = full,
// <1 = pulled down) that dips around each hero-SFX so the effect reads over the music.
// One pure function of `frame` — determinism-safe, same idea as tapScale/springWindow.
// depth 0.5 ≈ -6 dB dip (linear). Not a mixer sidechain; it's the frame-math the
// research recommends for a frame-based engine (attack ~lead, release ~tail).

export type DuckEvent = {
  at: number; // SFX frame (composition-absolute)
  lead?: number; // frames to dip in before `at` (default 5 ≈ fast attack)
  hold?: number; // frames held at the floor after `at` (default 6)
  tail?: number; // frames to release back to full (default 14)
  depth?: number; // 0-1 amount pulled down (default 0.5 ≈ -6 dB)
};

export const duck = (frame: number, events: DuckEvent[]): number => {
  let m = 1;
  for (const e of events) {
    const lead = e.lead ?? 5;
    const hold = e.hold ?? 6;
    const tail = e.tail ?? 14;
    const depth = e.depth ?? 0.5;
    const dip = interpolate(
      frame,
      [e.at - lead, e.at, e.at + hold, e.at + hold + tail],
      [1, 1 - depth, 1 - depth, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    m = Math.min(m, dip); // overlapping ducks → deepest wins
  }
  return m;
};
