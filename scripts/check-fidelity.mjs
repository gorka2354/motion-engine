// Fidelity check (L5-fidelity) — for models authored procedurally in src/models/, which fall
// outside check-assets.mjs (there is no .glb file to validate) and outside golden-master
// (a model bench is compared against a *reference image*, not only against its own past self).
//
// Usage:
//   node scripts/check-fidelity.mjs <CompId> [--reference front.png] [--reference-side img.png]
//                                   [--views front=0,quarter=15,side=30]
//                                   [--tolerance 0.15] [--max-flatness 0.9]
//                                   [--min-depth-ratio 0.2] [--regression-min-ssim 0.95]
//                                   [--accept-baseline] [--gl swangle]
//
// Checks:
//   silhouette-check  — subject bbox aspect of the render vs the reference image, PER VIEW.
//                       SOFT gate, and deliberately the only thing compared against a
//                       reference: a photo never matches pixel-for-pixel (backdrop, lighting,
//                       lens), and img2threejs' own grimoire says a pixel diff "cannot approve
//                       the pass". Shape survives those differences; pixels don't.
//   flatness-check    — how much of its own bbox the SIDE silhouette fills. This is the check
//                       that needs no second photo: a model built by extruding a traced front
//                       outline at constant thickness is a slab, and a slab fills its side bbox
//                       almost completely. Real hardware tapers, bulges and curves away.
//                       (Learned the hard way — a controller passed the front-only gate at 1.4%
//                       drift while reading as a flat biscuit from any other angle.)
//   depth-ratio       — side-view width ÷ front-view width, i.e. how deep the object is
//                       relative to how wide. Catches "correct outline, no volume".
//   regression-check  — SSIM vs the accepted baseline. Identical rig, camera and backdrop, so
//                       here the metric IS valid. Catches a factory edit that drifted.
//   palette-info      — mean subject colour. INFO ONLY: hue is far too noisy to fail a build on.
//
// Views come from turntable frames: benches are authored so frame 0 is dead-on front and a full
// revolution spans the composition, so 1/4 of the duration is the side view.
//
// Exit 1 if a gate fails, 2 on usage error.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { PNG } from "pngjs";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  classifyView,
  pixelmatchRatio,
  silhouetteBox,
  silhouetteFeatures,
  ssimScore,
} from "./pixel-metrics.mjs";

/**
 * View names this tool understands → the shape class `classifyView` should report for them.
 * A reference handed in under the wrong name makes every downstream number meaningless (a front
 * render measured against a side photo), so it's a gate, not a warning.
 */
const EXPECTED_VIEW_CLASS = {
  front: "front",
  side: "side",
  quarter: "three-quarter",
  "three-quarter": "three-quarter",
};

// ── thresholds (calibrated against known-good renders; re-calibrate, don't trust blind) ──
const DEFAULT_TOLERANCE = 0.15; // silhouette aspect drift vs reference
const DEFAULT_MIN_SSIM = 0.95; // candidate vs accepted baseline (looser than 2D's 0.98:
//                                chamfer speculars and env reflections move more)
// Calibrated on real renders: Blender-authored laptop 49.5%, procedural laptop 44.8%,
// a constant-thickness extruded controller 92.0%. 0.85 sits in the empty gap between them.
// Genuinely flat subjects (a card, a coin) will need this raised per-comp.
const DEFAULT_MAX_FLATNESS = 0.85;
const DEFAULT_MIN_DEPTH = 0.2; // side width ÷ front width below this ⇒ no real volume

const argv = process.argv.slice(2);
const compId = argv[0];
if (!compId || compId.startsWith("--")) {
  console.error(
    "Usage: node scripts/check-fidelity.mjs <CompId> [--reference front.png]\n" +
      "         [--reference-side img.png] [--views front=0,quarter=15,side=30]\n" +
      "         [--tolerance 0.15] [--max-flatness 0.9] [--min-depth-ratio 0.2]\n" +
      "         [--regression-min-ssim 0.95] [--accept-baseline] [--gl swangle]",
  );
  process.exit(2);
}
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? def : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

/** "front=0,side=30" → [{name:'front',frame:0},…] */
const views = flag("views", "front=0,quarter=15,side=30")
  .split(",")
  .map((part) => {
    const [name, frame] = part.split("=");
    return { name: name.trim(), frame: parseInt(frame, 10) };
  })
  .filter((v) => v.name && Number.isFinite(v.frame));
if (views.length === 0) {
  console.error("--views must look like front=0,side=30");
  process.exit(2);
}

/** Reference per view: --reference is the front one; --reference-<view> for the rest. */
const references = new Map();
const frontRef = flag("reference", null);
if (frontRef) references.set(views[0].name, frontRef);
for (const v of views) {
  const f = flag(`reference-${v.name}`, null);
  if (f) references.set(v.name, f);
}
for (const [view, file] of references) {
  if (!existsSync(file)) {
    console.error(`reference for view "${view}" not found: ${file}`);
    process.exit(2);
  }
}

const tolerance = parseFloat(flag("tolerance", String(DEFAULT_TOLERANCE)));
const minSsim = parseFloat(flag("regression-min-ssim", String(DEFAULT_MIN_SSIM)));
const maxFlatness = parseFloat(flag("max-flatness", String(DEFAULT_MAX_FLATNESS)));
const minDepth = parseFloat(flag("min-depth-ratio", String(DEFAULT_MIN_DEPTH)));
const acceptBaseline = has("accept-baseline");
// Same pin as check-render: an unpinned GL makes a baseline machine-specific.
const chromiumOptions = { gl: flag("gl", "swangle") };

const readPng = (f) => PNG.sync.read(readFileSync(f));
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name.padEnd(18)} ${detail}`);
};
const info = (name, detail) => console.log(`  ----  ${name.padEnd(18)} ${detail}`);

/** Mean RGB of the subject only (inside its bbox), so the backdrop can't dominate. */
const subjectColor = (png, box) => {
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let y = box.y; y < box.y + box.height; y += 2)
    for (let x = box.x; x < box.x + box.width; x += 2) {
      const i = (y * png.width + x) * 4;
      r += png.data[i];
      g += png.data[i + 1];
      b += png.data[i + 2];
      n++;
    }
  return [r / n, g / n, b / n];
};
const hex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const tmp = path.resolve("out/_fidelity", compId);
const fixtures = path.resolve("test/fidelity-fixtures", compId);
mkdirSync(tmp, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: compId, chromiumOptions });
console.log(
  `\ncheck-fidelity ${compId}  (${composition.width}×${composition.height}, ` +
    `views ${views.map((v) => `${v.name}@${v.frame}`).join(" ")}, gl=${chromiumOptions.gl})\n`,
);

const rendered = [];
for (const v of views) {
  const out = path.join(tmp, `${v.frame}.png`);
  await renderStill({ composition, serveUrl, output: out, frame: v.frame, chromiumOptions });
  const png = readPng(out);
  rendered.push({ ...v, file: out, png, box: silhouetteBox(png) });
}

// ── silhouette-check, per view that has a reference ──
if (references.size === 0) {
  info("silhouette-check", "SKIP — no --reference given");
}
for (const view of rendered) {
  const refFile = references.get(view.name);
  if (!refFile) continue;
  const refPng = readPng(refFile);
  const refBox = silhouetteBox(refPng);
  if (!refBox || !view.box) {
    record(`silhouette:${view.name}`, false, "no subject found against the backdrop");
    continue;
  }

  // Is the reference actually the view it was handed in as? The front render's own silhouette
  // width is the yardstick — without it `side` and `three-quarter` are indistinguishable, since
  // symmetry only reports "turned", never "turned how far".
  const expected = EXPECTED_VIEW_CLASS[view.name];
  if (expected) {
    const seen = classifyView(silhouetteFeatures(refPng), { frontAspect: rendered[0]?.box?.aspect });
    record(
      `view:${view.name}`,
      seen.view === expected,
      `reference reads as "${seen.view}", expected "${expected}" (${seen.reason})`,
    );
  }
  const drift = Math.abs(view.box.aspect - refBox.aspect) / refBox.aspect;
  record(
    `silhouette:${view.name}`,
    drift <= tolerance,
    `aspect ref ${refBox.aspect.toFixed(3)} vs render ${view.box.aspect.toFixed(3)} ` +
      `→ drift ${(drift * 100).toFixed(1)}% (max ${(tolerance * 100).toFixed(0)}%)`,
  );
  info(
    `palette:${view.name}`,
    `mean subject colour ref ${hex(subjectColor(refPng, refBox))} vs ` +
      `render ${hex(subjectColor(view.png, view.box))} (informational — never gates)`,
  );
}

// ── flatness + depth: shape sanity that needs NO reference at all ──
const front = rendered.find((v) => v.name === views[0].name);
const side = rendered.find((v) => v.name === "side");
if (side?.box) {
  record(
    "flatness-check",
    side.box.fill <= maxFlatness,
    `side view fills ${(side.box.fill * 100).toFixed(1)}% of its own bbox ` +
      `(max ${(maxFlatness * 100).toFixed(0)}%) — a constant-thickness extrusion approaches 100%`,
  );
} else {
  info("flatness-check", 'SKIP — no view named "side" in --views');
}
if (front?.box && side?.box) {
  const depthRatio = side.box.width / front.box.width;
  record(
    "depth-ratio",
    depthRatio >= minDepth,
    `depth ÷ width = ${depthRatio.toFixed(3)} (min ${minDepth}) — how much volume the model ` +
      `actually has behind its outline`,
  );
}

// ── regression-check (vs accepted baseline) ──
if (acceptBaseline) {
  mkdirSync(fixtures, { recursive: true });
  for (const r of rendered) copyFileSync(r.file, path.join(fixtures, `${r.frame}.png`));
  console.log(`  ----  baseline           accepted ${rendered.length} frame(s) → ${fixtures}`);
} else {
  const pairs = rendered
    .map((r) => ({ ...r, base: path.join(fixtures, `${r.frame}.png`) }))
    .filter((r) => existsSync(r.base));
  if (pairs.length === 0) {
    info("regression-check", "SKIP — no baseline yet (run with --accept-baseline)");
  } else {
    const scored = pairs.map((r) => ({
      frame: r.frame,
      ssim: ssimScore(readPng(r.base), r.png),
      diff: pixelmatchRatio(readPng(r.base), r.png),
    }));
    const worst = scored.reduce((a, b) => (a.ssim < b.ssim ? a : b));
    record(
      "regression-check",
      worst.ssim >= minSsim,
      `worst SSIM ${worst.ssim.toFixed(4)} at frame ${worst.frame} (min ${minSsim}) ` +
        `· pixel diff ${(worst.diff * 100).toFixed(2)}%`,
    );
  }
}

rmSync(tmp, { recursive: true, force: true });
const failed = results.filter((r) => !r.pass);
console.log(
  failed.length ? `\nFAILED: ${failed.map((f) => f.name).join(", ")}\n` : `\nall checks passed\n`,
);
process.exit(failed.length ? 1 : 0);
