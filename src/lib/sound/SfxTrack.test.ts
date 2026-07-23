import { describe, it, expect } from "vitest";
import { cuesInRange, type SfxCue } from "./SfxTrack";

describe("cuesInRange — SFX cue validation", () => {
  it("passes a clean cue list", () => {
    const cues: SfxCue[] = [
      { clip: "tap", at: 0 },
      { clip: "success", at: 100, volume: 0.9 },
      { clip: "powerDown", at: 299 },
    ];
    expect(cuesInRange(cues, 300)).toEqual([]);
  });

  it("flags a cue past the end of the composition", () => {
    const p = cuesInRange([{ clip: "whoosh", at: 350 }], 300);
    expect(p).toHaveLength(1);
    expect(p[0].reason).toBe("after-end");
  });

  it("flags a negative frame", () => {
    const p = cuesInRange([{ clip: "tap", at: -2 }], 300);
    expect(p[0].reason).toBe("before-start");
  });

  it("flags an unknown/renamed clip", () => {
    // @ts-expect-error — intentionally an invalid clip name
    const p = cuesInRange([{ clip: "does-not-exist", at: 10 }], 300);
    expect(p[0].reason).toBe("unknown-clip");
  });
});
