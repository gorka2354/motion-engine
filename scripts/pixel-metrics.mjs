// Pure pixel metrics for the render self-check. Kept as .mjs (not .ts) so the
// Node-run check-render.mjs imports them without a TS transpile step. Unit-tested
// on synthetic frames from src/lib/pixelMetrics.test.ts, so the detectors are
// proven to actually FIRE (empty center → std 0, frozen → diff 0), not just pass.
//
// A "frame" is { width, height, data } where data is RGBA bytes (pngjs shape).
import pixelmatch from "pixelmatch";
import { ssim } from "ssim.js";

export const lumaAt = (px, i) =>
  0.299 * px.data[i] + 0.587 * px.data[i + 1] + 0.114 * px.data[i + 2];

/** mean & std of luma inside a fractional center box (0..1) of the frame.
 *  Low std ⇒ flat/empty center ⇒ the subject flew out of frame (footgun #6). */
export function centerStats(png, frac = 0.5) {
  const { width: w, height: h } = png;
  const x0 = Math.floor((w * (1 - frac)) / 2),
    x1 = w - x0;
  const y0 = Math.floor((h * (1 - frac)) / 2),
    y1 = h - y0;
  let sum = 0,
    sum2 = 0,
    n = 0;
  for (let y = y0; y < y1; y += 2)
    for (let x = x0; x < x1; x += 2) {
      const L = lumaAt(png, (y * w + x) * 4);
      sum += L;
      sum2 += L * L;
      n++;
    }
  const mean = sum / n;
  return { mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)) };
}

/** mean absolute luma difference between two equal-size frames (0..255).
 *  ~0 between consecutive samples ⇒ frozen; large first↔last ⇒ a loop seam. */
export function frameDiff(a, b) {
  const w = Math.min(a.width, b.width),
    h = Math.min(a.height, b.height);
  let sum = 0,
    n = 0;
  for (let y = 0; y < h; y += 3)
    for (let x = 0; x < w; x += 3) {
      sum += Math.abs(
        lumaAt(a, (y * a.width + x) * 4) - lumaAt(b, (y * b.width + x) * 4),
      );
      n++;
    }
  return sum / n;
}

// ── golden-frame comparison (L4) — candidate vs approved baseline ──

/** Fraction of pixels that differ (0..1), AA-aware (OKLab in pixelmatch v6+).
 *  Tight — catches typography/layout/token shifts. Same size required (same comp). */
export function pixelmatchRatio(a, b, threshold = 0.1) {
  if (a.width !== b.width || a.height !== b.height) return 1;
  const diff = pixelmatch(a.data, b.data, null, a.width, a.height, {
    threshold,
    includeAA: false,
  });
  return diff / (a.width * a.height);
}

/** Structural similarity 0..1 (1 = identical). Perceptual — tolerant of the
 *  sub-pixel grain/bloom noise that makes a raw pixel diff flap on dark stages. */
export function ssimScore(a, b) {
  return ssim(
    { data: a.data, width: a.width, height: a.height },
    { data: b.data, width: b.width, height: b.height },
  ).mssim;
}
