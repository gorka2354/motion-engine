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

// ── silhouette (L5-fidelity) — model shape vs a reference image ──

/**
 * Bounding box of the subject, found by thresholding against the flat backdrop.
 *
 * WHY NOT JUST SSIM THE REFERENCE: a photo (or a render from another pipeline) never matches
 * pixel-for-pixel — different backdrop, lighting, lens, white balance. img2threejs' own docs say
 * a pixel diff "cannot approve the pass". The silhouette is the one property that survives all
 * of that, so it's the only thing worth gating on across pipelines.
 *
 * Background colour is taken from the frame corners, so it works on any flat backdrop.
 * Returns null when nothing stands out from the background (empty frame).
 */
/**
 * Binary subject mask + its bbox. Shared by every silhouette metric so the thresholding pass
 * happens once. `mask[y * width + x]` is 1 where the subject is.
 */
export function silhouetteMask(png, tolerance = 18) {
  const { width: w, height: h } = png;
  const at = (x, y) => (y * w + x) * 4;
  const corners = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ].map(([x, y]) => lumaAt(png, at(x, y)));
  const bg = corners.slice().sort((a, b) => a - b)[1]; // median-ish, ignores one odd corner
  const mask = new Uint8Array(w * h);
  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1,
    count = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (Math.abs(lumaAt(png, at(x, y)) - bg) <= tolerance) continue;
      mask[y * w + x] = 1;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  if (maxX < 0) return null;
  return { mask, width: w, height: h, minX, minY, maxX, maxY, count };
}

export function silhouetteBox(png, tolerance = 18) {
  const m = silhouetteMask(png, tolerance);
  if (!m) return null;
  const { width: w, height: h, minX, minY, maxX, maxY, count } = m;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  return {
    x: minX,
    y: minY,
    width: bw,
    height: bh,
    aspect: bw / bh,
    /** share of the bbox actually covered by the subject — separates an L-shape from a slab */
    fill: count / (bw * bh),
    /** share of the whole frame the subject occupies */
    coverage: count / (w * h),
  };
}

// ── viewpoint classification ──

/**
 * Shape descriptors that say WHICH WAY the object is facing, computed on the mask alone.
 *
 * There is no off-the-shelf "is this a side view" tool, and a learned classifier is overkill for
 * a silhouette on a flat backdrop. These are the classic descriptors:
 *
 * - `symmetryH` — mirror the mask across its own vertical centre line and take IoU with itself.
 *   Manufactured objects are near-symmetric head-on and lose that the moment they turn. This is
 *   the single strongest front/not-front signal.
 * - `elongation` / `axisAngle` — eigen-decomposition of the mask's covariance (image moments):
 *   how stretched the shape is and along which direction.
 */
export function silhouetteFeatures(png, tolerance = 18) {
  const m = silhouetteMask(png, tolerance);
  if (!m) return null;
  const { mask, width: w, minX, minY, maxX, maxY, count } = m;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;

  // horizontal symmetry: IoU of the mask with its own mirror inside the bbox
  let inter = 0;
  let union = 0;
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const a = mask[y * w + x];
      const b = mask[y * w + (maxX - (x - minX))];
      if (a || b) union++;
      if (a && b) inter++;
    }
  const symmetryH = union === 0 ? 0 : inter / union;

  // second-order image moments → principal axis
  let sx = 0,
    sy = 0;
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++)
      if (mask[y * w + x]) {
        sx += x;
        sy += y;
      }
  const cx = sx / count;
  const cy = sy / count;
  let mxx = 0,
    myy = 0,
    mxy = 0;
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++)
      if (mask[y * w + x]) {
        const dx = x - cx;
        const dy = y - cy;
        mxx += dx * dx;
        myy += dy * dy;
        mxy += dx * dy;
      }
  mxx /= count;
  myy /= count;
  mxy /= count;
  const tr = mxx + myy;
  const det = mxx * myy - mxy * mxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;

  return {
    aspect: bw / bh,
    fill: count / (bw * bh),
    symmetryH,
    /** 0 = circular, →1 = strongly stretched along one axis */
    elongation: l1 === 0 ? 0 : 1 - l2 / l1,
    /** radians; 0 = principal axis horizontal */
    axisAngle: Math.atan2(2 * mxy, mxx - myy) / 2,
  };
}

/**
 * Name the viewpoint from those descriptors.
 *
 * Symmetry alone answers "facing us or turned" and nothing more. It CANNOT rank how far an
 * object is turned — measured on real data, a three-quarter product photo scored 0.610 while a
 * dead-side render of the same kind of object scored 0.694, i.e. the ¾ shot was *less*
 * symmetric than the profile. Tilt breaks mirror symmetry as hard as yaw does.
 *
 * What does separate them is width: at 90° an object collapses to a narrow silhouette. That is
 * only meaningful against its own front width, though — an open laptop seen from the side is not
 * narrow at all. So `side` is reported only when `frontAspect` is supplied; without it the honest
 * answer is `turned`, not a guess.
 */
export function classifyView(features, options = {}) {
  if (!features) return { view: "unknown", confidence: 0, reason: "no subject found" };
  const { frontSymmetry = 0.9, frontAspect = null, sideNarrowing = 0.55 } = options;
  const { symmetryH, aspect } = features;
  if (symmetryH >= frontSymmetry) {
    return {
      view: "front",
      confidence: Math.min(1, (symmetryH - frontSymmetry) / (1 - frontSymmetry) + 0.5),
      reason: `mirror-IoU ${symmetryH.toFixed(3)} ≥ ${frontSymmetry}`,
    };
  }
  if (!frontAspect) {
    return {
      view: "turned",
      confidence: 0.5,
      reason:
        `mirror-IoU ${symmetryH.toFixed(3)} < ${frontSymmetry}; ` +
        `pass frontAspect to tell side from three-quarter`,
    };
  }
  const narrowing = aspect / frontAspect;
  if (narrowing <= sideNarrowing) {
    return {
      view: "side",
      confidence: Math.min(1, (sideNarrowing - narrowing) / sideNarrowing + 0.5),
      reason: `silhouette is ${(narrowing * 100).toFixed(0)}% of its front width (≤ ${sideNarrowing * 100}%)`,
    };
  }
  return {
    view: "three-quarter",
    confidence: 0.5,
    reason: `turned (mirror-IoU ${symmetryH.toFixed(3)}) but still ${(narrowing * 100).toFixed(0)}% of front width`,
  };
}
