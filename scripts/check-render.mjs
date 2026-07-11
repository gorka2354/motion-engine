// Render self-check (inc-11) — catches the "stills pass, video is broken" class of
// bugs automatically, before your eyes. Renders a handful of sample frames and runs
// cheap pixel heuristics on them. Almost free: the render exists anyway.
//
// Usage:
//   node scripts/check-render.mjs <CompId> [--frames N] [--loop] [--trim N]
//                                          [--seq] [--props file.json]
//
// Checks:
//   content-check  — center-region luma variance per sample. Flat center = the
//                    subject flew out of frame (footgun #6).
//   motion-check   — mean abs luma diff between consecutive samples. A run of ~0 =
//                    frozen / vanished subject.
//   loop-check     — first vs last frame diff (--loop). Large = a visible seam.
//   seq-check      — (--seq) render the same frames as stills AND pull them from a
//                    real mp4; a mismatch = a sequential-render state bug that a
//                    single still never shows (r3f reparent #7, useGltf race #6).
//
// Exit code 1 if any check fails — drop it into CI or a pre-commit hook.
import { bundle } from "@remotion/bundler";
import {
  renderStill,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { PNG } from "pngjs";
import {
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  copyFileSync,
  readFileSync as read,
} from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  centerStats,
  frameDiff,
  pixelmatchRatio,
  ssimScore,
} from "./pixel-metrics.mjs";

// ── thresholds (empirical; tune per project, documented so a failure is legible) ──
const CONTENT_MIN_STD = 8; // center luma std below this ⇒ "empty center"
const MOTION_MIN_DIFF = 0.5; // consecutive-sample mean abs diff below this ⇒ "frozen"
const LOOP_MAX_DIFF = 6; // first↔last mean abs diff above this ⇒ "seam"
const SEQ_MAX_DIFF = 4; // still-vs-sequence mean abs diff above this ⇒ "state bug"
const GOLDEN_MIN_SSIM = 0.98; // candidate-vs-baseline SSIM below this ⇒ "look changed"

// ── args ──
const argv = process.argv.slice(2);
const compId = argv[0];
if (!compId || compId.startsWith("--")) {
  console.error(
    "Usage: node scripts/check-render.mjs <CompId> [--frames N] [--loop] [--trim N]\n" +
      "         [--seq] [--gl swangle] [--accept-baseline] [--props file]",
  );
  process.exit(2);
}
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? def : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);
const nSamples = parseInt(flag("frames", "8"), 10);
const trim = parseInt(flag("trim", "0"), 10);
const doLoop = has("loop");
const doSeq = has("seq");
// Pin the GL renderer: a baseline captured here must match other machines / CI.
// swiftshader (CPU) vs angle (GPU/llvmpipe) render the same 3D scene to DIFFERENT
// pixels, so an unpinned diff shows renderer noise, not a real regression. swangle
// (SwiftShader-on-ANGLE) is deterministic and needs no GPU (safe on CI runners).
const GL = flag("gl", "swangle");
const chromiumOptions = { gl: GL };
const acceptBaseline = has("accept-baseline");
const propsFile = flag("props", null);
const inputProps = propsFile ? JSON.parse(readFileSync(propsFile, "utf8")) : undefined;

// ── pixel helpers (metrics live in ./pixel-metrics.mjs, unit-tested on synthetic frames) ──
const readPng = (file) => PNG.sync.read(read(file));

const fmt = (arr) => "[" + arr.map((n) => n.toFixed(1)).join(", ") + "]";
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name.padEnd(14)} ${detail}`);
};

// ── main ──
const tmp = path.resolve("out/_selfcheck", compId);
mkdirSync(tmp, { recursive: true });

console.time("bundle");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
console.timeEnd("bundle");

const composition = await selectComposition({ serveUrl, id: compId, inputProps, chromiumOptions });
const dur = composition.durationInFrames;
const lo = trim,
  hi = dur - 1;
const samples = Array.from({ length: nSamples }, (_, i) =>
  Math.round(lo + ((hi - lo) * i) / (nSamples - 1)),
);
console.log(
  `\ncheck-render ${compId}  (${composition.width}×${composition.height}, ${dur} frames, gl=${GL}, samples ${fmt(samples).replace(/\.0/g, "")})\n`,
);

// render the sample frames as stills
const stillPngs = [];
for (const f of samples) {
  const out = path.join(tmp, `still-${f}.png`);
  await renderStill({ composition, serveUrl, output: out, frame: f, inputProps, chromiumOptions });
  stillPngs.push(readPng(out));
}

// content-check
const stds = stillPngs.map((p) => centerStats(p).std);
record(
  "content-check",
  Math.min(...stds) >= CONTENT_MIN_STD,
  `center std ${fmt(stds)} (min allowed ${CONTENT_MIN_STD})`,
);

// motion-check
const diffs = [];
for (let i = 1; i < stillPngs.length; i++)
  diffs.push(frameDiff(stillPngs[i - 1], stillPngs[i]));
record(
  "motion-check",
  Math.min(...diffs) >= MOTION_MIN_DIFF,
  `consecutive diff ${fmt(diffs)} (min allowed ${MOTION_MIN_DIFF})`,
);

// loop-check
if (doLoop) {
  const d = frameDiff(stillPngs[0], stillPngs[stillPngs.length - 1]);
  record(
    "loop-check",
    d <= LOOP_MAX_DIFF,
    `f${samples[0]}↔f${samples[samples.length - 1]} diff ${d.toFixed(1)} (max allowed ${LOOP_MAX_DIFF})`,
  );
}

// golden-check — candidate vs an approved baseline. This is the ONLY check that
// catches a uniform shift across ALL frames (a changed color token, a moved layout):
// content/motion/loop only compare frames *within* this render, so they're blind to it.
// SSIM (perceptual) is the gate — tolerant of sub-pixel grain/bloom noise on the dark
// stage; the raw pixel-diff % is reported alongside for context.
const GOLDEN_DIR = path.resolve("test/golden", compId);
if (acceptBaseline) {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  for (const f of samples)
    copyFileSync(path.join(tmp, `still-${f}.png`), path.join(GOLDEN_DIR, `${f}.png`));
  console.log(`  BASE  golden accepted → test/golden/${compId}/ (${samples.length} frames)`);
} else {
  const cmp = [];
  for (let i = 0; i < samples.length; i++) {
    const gp = path.join(GOLDEN_DIR, `${samples[i]}.png`);
    if (existsSync(gp)) {
      const g = readPng(gp);
      cmp.push({ ssim: ssimScore(g, stillPngs[i]), ratio: pixelmatchRatio(g, stillPngs[i]) });
    }
  }
  if (!cmp.length) {
    console.log("  SKIP  golden-check    (no baseline — run with --accept-baseline)");
  } else {
    const minSsim = Math.min(...cmp.map((c) => c.ssim));
    const maxRatio = Math.max(...cmp.map((c) => c.ratio));
    record(
      "golden-check",
      minSsim >= GOLDEN_MIN_SSIM,
      `min SSIM ${minSsim.toFixed(4)} (min ${GOLDEN_MIN_SSIM}) · max pixel-diff ${(maxRatio * 100).toFixed(2)}% · ${cmp.length}/${samples.length} have baseline`,
    );
  }
}

// seq-check (still vs frames pulled from a real mp4)
if (doSeq) {
  const mp4 = path.join(tmp, "seq.mp4");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    output: mp4,
    inputProps,
    chromiumOptions,
  });
  let worst = 0;
  for (let i = 0; i < samples.length; i++) {
    const f = samples[i];
    const ex = path.join(tmp, `seq-${f}.png`);
    // pull frame f from the encoded video
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-i", mp4,
      "-vf", `select=eq(n\\,${f})`, "-vframes", "1", ex,
    ]);
    if (existsSync(ex)) worst = Math.max(worst, frameDiff(stillPngs[i], readPng(ex)));
  }
  record(
    "seq-check",
    worst <= SEQ_MAX_DIFF,
    `worst still-vs-mp4 diff ${worst.toFixed(1)} (max allowed ${SEQ_MAX_DIFF})`,
  );
} else {
  console.log("  SKIP  seq-check       (pass --seq to render an mp4 and compare)");
}

rmSync(tmp, { recursive: true, force: true });
const failed = results.filter((r) => !r.pass);
console.log(
  failed.length ? `\n✗ ${failed.length} check(s) FAILED\n` : `\n✓ all checks passed\n`,
);
process.exit(failed.length ? 1 : 0);
