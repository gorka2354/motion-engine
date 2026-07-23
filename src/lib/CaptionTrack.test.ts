import { describe, it, expect } from "vitest";
import { captionOverlaps, activeCaptions, type CaptionCue } from "./CaptionTrack";

const cues: CaptionCue[] = [
  { from: 0, to: 100 },
  { from: 100, to: 200 }, // touches the first at 100 but does not overlap (half-open)
  { from: 260, to: 360 },
];

describe("captionOverlaps", () => {
  it("reports no overlaps for back-to-back cues", () => {
    expect(captionOverlaps(cues)).toEqual([]);
  });

  it("catches two cues fighting for the screen", () => {
    const bad = [...cues, { from: 320, to: 420 }]; // overlaps cue index 2 (260–360)
    expect(captionOverlaps(bad)).toContainEqual([2, 3]);
  });
});

describe("activeCaptions", () => {
  it("returns only the cue(s) live at a frame ([from, to) half-open)", () => {
    expect(activeCaptions(cues, 50)).toEqual([{ from: 0, to: 100 }]);
    expect(activeCaptions(cues, 100)).toEqual([{ from: 100, to: 200 }]); // boundary belongs to the next
    expect(activeCaptions(cues, 230)).toEqual([]); // gap
  });
});
