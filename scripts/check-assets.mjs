// 3D-asset self-check (L5) — validates every Blender→GLB in public/models and guards
// its metadata against an approved fixture. Catches asset bugs BEFORE they reach a
// render: bad geometry (Khronos validator errors), and silent drift in triangle count
// / bounds / UV / normals across regenerations (the 3D analog of the golden-frame Δ=0).
//
// Usage:
//   node scripts/check-assets.mjs            # validate + diff vs fixtures
//   node scripts/check-assets.mjs --accept   # (re)write metadata fixtures after review
import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { validateBytes } from "gltf-validator";
import { NodeIO, getBounds } from "@gltf-transform/core";

const acceptFixture = process.argv.includes("--accept");
const MODELS = path.resolve("public/models");
const FIXTURES = path.resolve("test/asset-fixtures");
const io = new NodeIO();
const round = (a) => a.map((n) => +n.toFixed(3));

/** structural metadata that must stay stable across regenerations */
function assetMeta(doc) {
  const root = doc.getRoot();
  const b = getBounds(root.listScenes()[0]);
  let triangles = 0,
    hasUV = true,
    hasNormal = true;
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute("POSITION");
      triangles += (idx ? idx.getCount() : pos.getCount()) / 3;
      if (!prim.getAttribute("TEXCOORD_0")) hasUV = false;
      if (!prim.getAttribute("NORMAL")) hasNormal = false;
    }
  return {
    meshes: root.listMeshes().length,
    materials: root.listMaterials().length,
    nodes: root.listNodes().length,
    triangles,
    hasUV,
    hasNormal,
    bounds: { min: round(b.min), max: round(b.max) },
  };
}

let failed = 0;
const glbs = readdirSync(MODELS).filter((f) => f.endsWith(".glb"));
console.log(`check-assets — ${glbs.length} GLB in public/models\n`);

for (const file of glbs) {
  const name = file.replace(/\.glb$/, "");
  const glbPath = path.join(MODELS, file);
  const report = await validateBytes(new Uint8Array(readFileSync(glbPath)));
  const { numErrors, numWarnings, numInfos } = report.issues;
  const meta = assetMeta(await io.read(glbPath));

  console.log(`${file}`);
  console.log(
    `  validate: ${numErrors} err · ${numWarnings} warn · ${numInfos} info` +
      `   |  ${meta.meshes} mesh · ${meta.triangles} tris · UV:${meta.hasUV} N:${meta.hasNormal}`,
  );
  // hard-fail on Khronos ERRORS (severity 0) — degenerate prims, NaN accessors, missing
  // required TEXCOORD for a texture, etc. Warnings/infos (NPOT images) are printed, not fatal.
  if (numErrors > 0) {
    report.issues.messages
      .filter((m) => m.severity === 0)
      .forEach((m) => console.log(`    ✗ ERROR ${m.code}: ${m.message} @ ${m.pointer ?? ""}`));
    failed++;
  }

  const fx = path.join(FIXTURES, `${name}.json`);
  if (acceptFixture) {
    mkdirSync(FIXTURES, { recursive: true });
    writeFileSync(fx, JSON.stringify(meta, null, 2) + "\n");
    console.log(`  BASE  fixture written → test/asset-fixtures/${name}.json`);
  } else if (existsSync(fx)) {
    const prev = JSON.parse(readFileSync(fx, "utf8"));
    if (JSON.stringify(prev) !== JSON.stringify(meta)) {
      console.log(`  FAIL  metadata drift vs fixture`);
      console.log(`        was ${JSON.stringify(prev)}`);
      console.log(`        now ${JSON.stringify(meta)}`);
      failed++;
    } else {
      console.log(`  PASS  metadata matches fixture`);
    }
  } else {
    console.log(`  SKIP  no fixture (run with --accept to create)`);
  }
}

console.log(failed ? `\n✗ ${failed} asset issue(s)\n` : `\n✓ all assets valid & unchanged\n`);
process.exit(failed ? 1 : 0);
