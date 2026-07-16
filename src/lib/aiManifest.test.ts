import { describe, it, expect } from "vitest";
// Cache + client pure helpers — the bits that decide "do we pay for this again?" and "which
// URL is the asset?". Bugs here mean wasted credits or a broken download, so they're pinned.
import { hashKey, lookup, record } from "../../scripts/ai/manifest.mjs";
import type { Manifest } from "../../scripts/ai/manifest.d.mts";
import { projectPath, pickAssetUrl } from "../../scripts/ai/client.mjs";

describe("hashKey", () => {
  it("is deterministic for identical input (cache hit)", () => {
    expect(hashKey("image", { a: 1, b: "x" })).toBe(hashKey("image", { a: 1, b: "x" }));
  });
  it("differs on different payload or kind", () => {
    expect(hashKey("image", { a: 1 })).not.toBe(hashKey("image", { a: 2 }));
    expect(hashKey("image", { a: 1 })).not.toBe(hashKey("video", { a: 1 }));
  });
  it("is prefixed by kind", () => {
    expect(hashKey("edit", {})).toMatch(/^edit_/);
  });
});

describe("lookup (stale-cache aware)", () => {
  const m = { k1: { file: "a.jpg" }, k2: { id: "x" } };
  it("returns the entry when its file still exists", () => {
    expect(lookup(m, "k1", () => true)).toEqual({ file: "a.jpg" });
  });
  it("MISSES when the file was deleted (out/ cleaned)", () => {
    expect(lookup(m, "k1", () => false)).toBeNull();
  });
  it("misses on an unknown key", () => {
    expect(lookup(m, "nope", () => true)).toBeNull();
  });
  it("returns file-less entries regardless of disk", () => {
    expect(lookup(m, "k2", () => false)).toEqual({ id: "x" });
  });
});

describe("record", () => {
  it("adds an entry to the manifest", () => {
    const m: Manifest = {};
    record(m, "k", { file: "f", id: "1" });
    expect(m.k).toEqual({ file: "f", id: "1" });
  });
});

describe("client pure helpers", () => {
  it("projectPath splits video vs image/edit", () => {
    expect(projectPath("video")).toBe("video-projects");
    expect(projectPath("image")).toBe("image-projects");
    expect(projectPath("edit")).toBe("image-projects");
  });
  it("pickAssetUrl prefers a media extension over metadata urls", () => {
    expect(pickAssetUrl([{ url: "http://x/a.json?t=1" }, { url: "http://x/o.mp4?sig=z" }])).toBe("http://x/o.mp4?sig=z");
    expect(pickAssetUrl([{ url: "http://x/o.jpg" }])).toBe("http://x/o.jpg");
    expect(pickAssetUrl([])).toBeNull();
  });
});
