/**
 * Director CLI — the variant loop (inc: director-layer, Increment 4). Run via
 * `npm run direct` (tsx; Node 20 can't strip TS types on its own). Overlays each
 * StylePreset onto a schema-authored promo's scene-map, prints the linter gate
 * table, and writes per-variant props JSON that Remotion renders with --props.
 * Stills are opt-in (--render) since a real render is slow; the default is a fast
 * dry pass (gate table + props JSON) — still-first, approve-before-animate.
 *
 * Usage:
 *   npm run direct -- lumo                              # gate table + props JSON
 *   npm run direct -- lumo --render --frames=30,300,900 # + render stills at frames
 *
 * Only schema-authored promos work here (Zarya/Jumper are grandfathered JSX — see
 * inc/inc-director-layer.md, D3). Today that's Lumo.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { LUMO_DEFAULTS } from "../src/lumo/lumo.map";
import { planVariants, gateTable } from "../src/v2/direct";

const BASES = {
  lumo: { comp: "LumoPromo", props: LUMO_DEFAULTS },
} as const;
type Brand = keyof typeof BASES;

const argv = process.argv.slice(2);
const brand = (argv.find((a) => !a.startsWith("-")) ?? "lumo") as Brand;
const doRender = argv.includes("--render");
const frames = (argv.find((a) => a.startsWith("--frames="))?.split("=")[1] ?? "30,300,860,1000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const base = BASES[brand];
if (!base) {
  console.error(`unknown brand "${brand}" — schema-authored promos: ${Object.keys(BASES).join(", ")}`);
  process.exit(1);
}

const variants = planVariants(base.props);
console.log(`\nDirector · variant loop · ${brand} (${base.comp})\n`);
console.log(gateTable(variants));

const outDir = "out/variants";
mkdirSync(outDir, { recursive: true });
console.log("");
for (const v of variants) {
  const f = `${outDir}/${brand}-${v.preset}.props.json`;
  writeFileSync(f, JSON.stringify(v.styled.props, null, 2));
  console.log(`  wrote ${f}`);
}

if (!doRender) {
  console.log(`\n(dry) add --render to render stills — e.g. npm run direct -- ${brand} --render --frames=${frames.join(",")}`);
  process.exit(0);
}

console.log(`\nRendering stills for gate-passing variants @ frames ${frames.join(",")} …`);
for (const v of variants.filter((x) => x.pass)) {
  const props = `${outDir}/${brand}-${v.preset}.props.json`;
  for (const fr of frames) {
    const out = `${outDir}/${brand}-${v.preset}-f${fr}.png`;
    console.log(`  ${v.preset} @ ${fr} → ${out}`);
    execFileSync(
      "npx",
      ["remotion", "still", base.comp, out, `--frame=${fr}`, `--props=${props}`],
      { stdio: "inherit", shell: true },
    );
  }
}
console.log("\ndone.");
