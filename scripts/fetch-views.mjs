// Collect reference views of a real object from a product page you point it at.
//
//   node scripts/fetch-views.mjs <page-url> [--out out/views/<name>] [--limit 24] [--keep-all]
//
// WHY THIS SHAPE. Building a 3D model from one head-on photo means inventing the depth. The
// missing angles usually already exist — in the gallery of a shop listing or a review. Reverse
// image search cannot help here (TinEye's own docs: it "cannot be used for identifying 3D
// objects"; perceptual hashes only match near-duplicates of one file), and the image-search APIs
// that could have are gone or dying. Pointing at a page sidesteps all of it.
//
// Manners, deliberately:
//   - robots.txt is fetched and honoured; a Disallow means we stop, not that we look for a way in
//   - one page, sequential downloads, real User-Agent, no retry storms
//   - a 403 / bot-wall is reported and the run ends. No evasion.
//
// Licensing is on you: a photo you fetch is someone's copyright. Using it as a modelling
// REFERENCE is ordinary practice; redistributing it, or shipping it as a texture, is not. Press
// kits are usually editorial-use-only and forbid this outright.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { galleryFromHtml, pickBestPerView, robotsAllows } from "./gallery.mjs";
import { classifyView, silhouetteFeatures } from "./pixel-metrics.mjs";

const argv = process.argv.slice(2);
const pageUrl = argv[0];
if (!pageUrl || pageUrl.startsWith("--")) {
  console.error(
    "Usage: node scripts/fetch-views.mjs <page-url> [--out dir] [--limit 24] [--keep-all]",
  );
  process.exit(2);
}
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? def : argv[i + 1];
};
const keepAll = argv.includes("--keep-all");
const limit = parseInt(flag("limit", "24"), 10);
const slug =
  flag("out", null) ??
  path.join(
    "out/views",
    (new URL(pageUrl).pathname.split("/").filter(Boolean).pop() ?? "page")
      .replace(/\.[a-z]+$/i, "")
      .replace(/[^a-z0-9-]+/gi, "-")
      .toLowerCase(),
  );
const outDir = path.resolve(slug);
const MIN_SIDE = 200;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/** Fetch robots.txt and ask gallery.mjs (unit-tested there) whether this path is permitted. */
const checkRobots = async (context, target) => {
  const { origin, pathname } = new URL(target);
  const res = await context.request
    .get(`${origin}/robots.txt`, { timeout: 10_000 })
    .catch(() => null);
  if (!res || !res.ok()) return { allowed: true, why: "no robots.txt" };
  return robotsAllows(await res.text(), pathname);
};

/** Anything → PNG, so the silhouette metrics (pngjs) can read it. ffmpeg is already a dep. */
const toPng = (input, output) => {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", input, output], { stdio: "pipe" });
};

mkdirSync(outDir, { recursive: true });
const tmp = path.join(outDir, "_raw");
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ userAgent: UA });

try {
  const robots = await checkRobots(context, pageUrl);
  if (!robots.allowed) {
    console.error(`\nrefusing: ${robots.why}\n`);
    process.exit(1);
  }
  console.log(`\nfetch-views ${pageUrl}\n  ${robots.why}`);

  const page = await context.newPage();
  const response = await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const status = response?.status() ?? 0;
  if (status === 403 || status === 429) {
    console.error(
      `\n  the site returned ${status} — it does not want automated access.\n` +
        `  Stopping here rather than working around it. Save the images by hand and pass them\n` +
        `  to check-fidelity with --reference-side / --reference-quarter.\n`,
    );
    process.exit(1);
  }
  // let lazy-loaded galleries populate, then read the DOM as rendered
  await page.waitForTimeout(1500);
  const html = await page.content();

  const candidates = galleryFromHtml(html, pageUrl, limit);
  console.log(`  found ${candidates.length} candidate image(s)`);
  if (candidates.length === 0) {
    console.error("  nothing usable on the page — is it the product page itself?\n");
    process.exit(1);
  }

  const measured = [];
  const skipped = [];
  for (const [i, candidate] of candidates.entries()) {
    // Pace ourselves. A live run against Wikimedia earned HTTP 429 on half the gallery even
    // though downloads were already sequential — "not parallel" is not the same as "polite".
    if (i > 0) await page.waitForTimeout(400);
    const res = await context.request.get(candidate.url, { timeout: 20_000 }).catch(() => null);
    if (!res || !res.ok()) {
      skipped.push([
        candidate.url,
        res
          ? `HTTP ${res.status()}${res.status() === 429 ? " (rate-limited)" : ""}`
          : "request failed",
      ]);
      continue;
    }
    // NOTE the `src-` prefix: without it a .png source and its converted output collide on one
    // filename, ffmpeg refuses to read and write the same file, and every candidate is silently
    // dropped. That bug reported "downloaded 0" with no reason, which is why skips are now listed.
    const raw = path.join(tmp, `src-c${i}${path.extname(new URL(candidate.url).pathname) || ".img"}`);
    writeFileSync(raw, await res.body());
    const png = path.join(tmp, `c${i}.png`);
    try {
      toPng(raw, png);
    } catch (err) {
      skipped.push([candidate.url, `not a decodable image (${String(err).slice(0, 60)})`]);
      continue;
    }
    const image = PNG.sync.read(readFileSync(png));
    // Below this it is a UI icon, not a product photo. The live run pulled in 60×60 button
    // glyphs that classified as "unknown" and cluttered the report.
    if (image.width < MIN_SIDE || image.height < MIN_SIDE) {
      skipped.push([candidate.url, `too small (${image.width}×${image.height})`]);
      continue;
    }
    // A gallery shot is the product on a clean backdrop; the silhouette metrics assume that.
    const features = silhouetteFeatures(image);
    if (!features) {
      skipped.push([candidate.url, "no subject against the backdrop"]);
      continue;
    }
    measured.push({
      ...candidate,
      file: png,
      features,
      area: image.width * image.height,
      size: `${image.width}×${image.height}`,
      symmetry: features.symmetryH,
    });
  }

  // The most symmetric shot is the head-on one, and its width is the yardstick everything else
  // is judged against: symmetry says "turned", only width says "turned how far". Without that
  // reference a three-quarter photo and a dead-side render are indistinguishable — measured, a
  // ¾ product shot scored LOWER symmetry (0.610) than a true profile (0.694).
  const frontRef = measured.reduce((a, b) => (b.symmetry > a.symmetry ? b : a), measured[0]);
  const frontAspect = frontRef?.features.aspect ?? null;
  const classified = measured.map((m) => {
    const view = classifyView(m.features, { frontAspect });
    return { ...m, view: view.view, confidence: view.confidence };
  });

  console.log(
    `  downloaded ${classified.length}, classifying` +
      (frontAspect ? ` (front width reference: ${frontAspect.toFixed(3)})` : "") +
      `…\n`,
  );
  for (const c of classified) {
    console.log(
      `    ${String(c.view).padEnd(13)} sym=${c.symmetry.toFixed(3)} ${c.size.padEnd(11)} ${c.url.slice(0, 72)}`,
    );
  }
  for (const [url, why] of skipped) {
    console.log(`    ${"skipped".padEnd(13)} ${why.padEnd(24)} ${url.slice(0, 60)}`);
  }

  const best = pickBestPerView(classified);
  console.log("");
  for (const [view, item] of Object.entries(best)) {
    const dest = path.join(outDir, `${view}.png`);
    writeFileSync(dest, readFileSync(item.file));
    console.log(`  → ${path.relative(process.cwd(), dest)}  (${item.size}, from ${item.source})`);
  }
  if (Object.keys(best).length === 0) {
    console.log("  no image could be classified into a view — nothing written");
  }
  if (!keepAll) rmSync(tmp, { recursive: true, force: true });
  else console.log(`\n  all downloads kept in ${path.relative(process.cwd(), tmp)}`);

  console.log(
    `\nUse them as references:\n` +
      `  npm run check-fidelity <Comp> -- --reference ${path.relative(process.cwd(), path.join(outDir, "front.png"))} \\\n` +
      `      --reference-side ${path.relative(process.cwd(), path.join(outDir, "side.png"))}\n`,
  );
} finally {
  await context.close();
  await browser.close();
}
