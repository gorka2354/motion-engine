// AI asset generator CLI — one command to turn a prompt into a downloaded asset via Magic
// Hour, with a prompt-hash cache so re-runs are free. Wraps scripts/ai/{presets,client,
// manifest}.mjs. Run from the project root (needs .env.local).
//
//   node scripts/ai-gen.mjs image  --out public/hero.jpg   --prompt "a working-class man on a street"
//   node scripts/ai-gen.mjs edit   --out public/hero30.jpg --image <url> --instruction "change hoodie to a jacket"
//   node scripts/ai-gen.mjs video  --out public/clip.mp4   --image <url> --motion "taps phone" --static
//
// Flags: --out (required) --prompt/--instruction/--motion --image <url|magic-hour-url>
//        --model --aspect --resolution --seconds --static --headroom --name --no-cache
import { imageRequest, editRequest, videoRequest } from "./ai/presets.mjs";
import { readKey, generate } from "./ai/client.mjs";
import { hashKey, loadManifest, saveManifest, lookup, record } from "./ai/manifest.mjs";
import { pathToFileURL } from "url";

const MANIFEST = "out/ai/manifest.json";

/** Minimal `--key value` / `--flag` parser (no deps). */
export function parseArgs(argv) {
  const kind = argv[0];
  const o = {};
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) { o[k] = next; i++; } else o[k] = true;
  }
  return { kind, o };
}

/** Map (kind, options) → { req, pollKind }. Exported for tests. */
export function buildRequest(kind, o) {
  if (kind === "image")
    return { req: imageRequest({ prompt: o.prompt, aspect: o.aspect, model: o.model, resolution: o.resolution, headroom: o.headroom !== undefined, name: o.name }), pollKind: "image" };
  if (kind === "edit")
    return { req: editRequest({ imageUrl: o.image, instruction: o.instruction, model: o.model, aspect: o.aspect, resolution: o.resolution, name: o.name, newScene: Boolean(o["new-scene"]) }), pollKind: "image" };
  if (kind === "video")
    return { req: videoRequest({ imageUrl: o.image, motion: o.motion, model: o.model, seconds: o.seconds ? Number(o.seconds) : undefined, resolution: o.resolution, static: Boolean(o.static), name: o.name, endImageUrl: typeof o["end-image"] === "string" ? o["end-image"] : undefined }), pollKind: "video" };
  throw new Error(`unknown kind "${kind}" — use image | edit | video`);
}

async function main() {
  const { kind, o } = parseArgs(process.argv.slice(2));
  if (!kind || !o.out) {
    console.error("usage: node scripts/ai-gen.mjs <image|edit|video> --out <file> [--prompt|--instruction|--motion ...]");
    process.exit(1);
  }
  const { req, pollKind } = buildRequest(kind, o);
  const key = hashKey(kind, req.body);
  const manifest = loadManifest(MANIFEST);

  if (!o["no-cache"]) {
    const hit = lookup(manifest, key);
    if (hit) { console.log(`cache HIT  ${key} → ${hit.file}  (0 credits)`); return; }
  }

  console.log(`generating [${kind}] → ${o.out}`);
  const r = await generate(readKey(), pollKind, req, o.out, {
    onTick: (s, i) => process.stdout.write(`\r  ${s} (${i})   `),
  });
  process.stdout.write("\n");
  record(manifest, key, { kind, file: r.file, id: r.id, credits: r.credits, bytes: r.bytes });
  saveManifest(MANIFEST, manifest);
  console.log(`done  ${r.file}  id=${r.id}  ${r.credits} credits  ${(r.bytes / 1024).toFixed(0)}KB  (url valid ~24h)`);
}

// run only when invoked directly (not when imported by tests) — pathToFileURL handles the
// Windows file:///C:/ triple-slash that a naive `file://` + path comparison misses.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
}
