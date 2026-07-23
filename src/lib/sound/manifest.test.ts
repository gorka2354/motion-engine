import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLIPS, DEFAULT_VOL, type SfxClip } from "./clips";

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "public");

/** Read the `data` chunk size (bytes) from a 16-bit PCM WAV header. */
const wavDataBytes = (file: string): number => {
  const b = fs.readFileSync(file);
  expect(b.toString("ascii", 0, 4)).toBe("RIFF");
  expect(b.toString("ascii", 8, 12)).toBe("WAVE");
  // scan chunks for "data"
  let off = 12;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "data") return size;
    off += 8 + size + (size % 2);
  }
  return 0;
};

describe("SFX manifest — every registered clip has a real, non-empty file", () => {
  const clips = Object.keys(CLIPS) as SfxClip[];

  it("registry is non-empty and every clip has a default volume in [0,1]", () => {
    expect(clips.length).toBeGreaterThan(0);
    for (const c of clips) {
      expect(DEFAULT_VOL[c], `${c} missing default volume`).toBeTypeOf("number");
      expect(DEFAULT_VOL[c]).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_VOL[c]).toBeLessThanOrEqual(1);
    }
  });

  it.each(clips)("clip '%s' points to an existing WAV with audio data", (clip) => {
    const rel = CLIPS[clip];
    expect(rel.startsWith("audio/")).toBe(true);
    const file = path.join(PUBLIC, rel);
    expect(fs.existsSync(file), `${rel} is missing — run \`npm run gen-sfx\``).toBe(true);
    // more than a bare 44-byte header → actually contains samples, not silence-length 0
    expect(wavDataBytes(file)).toBeGreaterThan(1000);
  });

  it("the new moment-specific cues are all present", () => {
    for (const c of ["powerDown", "powerUp", "dawnChime", "morph", "typeTick", "rumble", "countTick"] as SfxClip[]) {
      expect(clips).toContain(c);
    }
  });
});
