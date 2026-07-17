import { describe, it, expect } from "vitest";
// The AI layer lives in scripts/ (Node build-time tools, like pixel-metrics.mjs); this node
// test exercises the PURE request builders — no network, no credits — so the prompt patterns
// that make AI footage read as real/consistent can't silently regress.
import { imageRequest, editRequest, videoRequest, API_BASE } from "../../scripts/ai/presets.mjs";
import { parseArgs, buildRequest } from "../../scripts/ai-gen.mjs";

describe("imageRequest", () => {
  it("targets the image generator with photoreal-human defaults", () => {
    const { endpoint, body } = imageRequest({ prompt: "a working-class man on a street" });
    expect(endpoint).toBe(`${API_BASE}/ai-image-generator`);
    expect(body.model).toBe("seedream-v4");
    expect(body.aspect_ratio).toBe("9:16");
    expect(body.style.prompt).toContain("a working-class man on a street");
    expect(body.style.prompt).toContain("documentary"); // realism fragment
    expect(body.style.prompt).toContain("no anime eyes"); // anti-AI-look fragment
  });
  it("adds the headroom clause only when asked", () => {
    expect(imageRequest({ prompt: "x", headroom: true }).body.style.prompt).toContain("above the head");
    expect(imageRequest({ prompt: "x" }).body.style.prompt).not.toContain("above the head");
  });
  it("realism:false drops the realism fragments (for non-photo assets)", () => {
    const p = imageRequest({ prompt: "flat logo", realism: false }).body.style.prompt;
    expect(p).not.toContain("documentary");
    expect(p).toContain("flat logo");
  });
});

describe("editRequest", () => {
  it("keeps identity, hits the image editor, nano-banana by default", () => {
    const { endpoint, body } = editRequest({ imageUrl: "http://x/a.jpg", instruction: "change the hoodie to a jacket" });
    expect(endpoint).toBe(`${API_BASE}/ai-image-editor`);
    expect(body.model).toBe("nano-banana");
    expect(body.style.prompt).toContain("same face and identity");
    expect(body.style.prompt).toContain("change the hoodie to a jacket");
    expect(body.assets!.image_file_paths).toEqual(["http://x/a.jpg"]);
  });
});

describe("videoRequest", () => {
  it("locks the camera when static (the cross-clip framing lesson)", () => {
    const p = videoRequest({ imageUrl: "u", motion: "taps phone", static: true }).body.style.prompt;
    expect(p).toContain("no zoom");
    expect(p).toContain("no push-in");
    expect(p).toContain("taps phone");
  });
  it("uses plain motion when not static", () => {
    expect(videoRequest({ imageUrl: "u", motion: "taps phone" }).body.style.prompt).toBe("taps phone");
  });
  it("i2v defaults: kling, muted, single image asset", () => {
    const { endpoint, body } = videoRequest({ imageUrl: "u", motion: "m" });
    expect(endpoint).toBe(`${API_BASE}/image-to-video`);
    expect(body.model).toBe("kling-3.0");
    expect(body.audio).toBe(false);
    expect(body.assets!.image_file_path).toBe("u");
    expect(body.assets!.end_image_file_path).toBeUndefined();
  });
  it("adds an END keyframe for start→end morph (no cut) when given endImageUrl", () => {
    const b = videoRequest({ imageUrl: "start", motion: "morph", endImageUrl: "end" }).body;
    expect(b.assets!.image_file_path).toBe("start");
    expect(b.assets!.end_image_file_path).toBe("end");
  });
});

describe("CLI arg parsing → request", () => {
  it("parses value flags and boolean flags", () => {
    const { kind, o } = parseArgs(["video", "--image", "u", "--motion", "taps", "--static", "--out", "c.mp4"]);
    expect(kind).toBe("video");
    expect(o.image).toBe("u");
    expect(o.static).toBe(true);
    expect(o.out).toBe("c.mp4");
  });
  it("routes video → image-to-video and applies --static", () => {
    const { req, pollKind } = buildRequest("video", { image: "u", motion: "taps", static: true });
    expect(pollKind).toBe("video");
    expect(req.body.style.prompt).toContain("no zoom");
  });
  it("throws on an unknown kind", () => {
    expect(() => buildRequest("nope", {})).toThrow(/unknown kind/);
  });
});
