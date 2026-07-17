// Batch still renderer: bundles ONCE, then renders many frames.
// Usage: node scripts/stills.mjs <CompId> <frame,frame,...> [outDir] [propsFile]
// ~20s bundle + ~1s per frame, vs ~20s PER frame with `npx remotion still`.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const [compId, framesArg, outDir = "out/stills", propsFile] = process.argv.slice(2);
if (!compId || !framesArg) {
  console.error("Usage: node scripts/stills.mjs <CompId> <frame,frame,...> [outDir] [propsFile]");
  process.exit(1);
}
const frames = framesArg.split(",").map((n) => parseInt(n, 10));
const inputProps = propsFile ? JSON.parse(readFileSync(propsFile, "utf8")) : undefined;

console.time("bundle");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
console.timeEnd("bundle");

const composition = await selectComposition({ serveUrl, id: compId, inputProps });
mkdirSync(outDir, { recursive: true });

for (const frame of frames) {
  const output = path.join(outDir, `${compId}-${frame}.png`);
  console.time(output);
  await renderStill({ composition, serveUrl, output, frame, inputProps });
  console.timeEnd(output);
}
