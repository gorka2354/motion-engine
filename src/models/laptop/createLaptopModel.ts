import {
  BoxGeometry,
  Color,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  CylinderGeometry,
} from "three";
import type { ModelHandles } from "../types";
import type { PartsContract } from "../contract";

/**
 * Procedural laptop — the code-authored counterpart to public/models/laptop-hinged.glb.
 *
 * Authored against `laptop.sculpt-spec.json` (component tree, dimensions, palettes and the
 * material/lighting contract all live there; the spec passes img2threejs' --strict-quality gate).
 * The spec is the design document; this file is the implementation. The generator that ships
 * with that skill was deliberately NOT used — see docs/TESTING.md for why.
 *
 * Two properties this file must keep:
 *
 * 1. **No DOM, no async.** No canvas textures and no image loading, so the factory runs in the
 *    vitest `node` project and needs no delayRender/continueRender dance in Remotion. Every
 *    surface is a flat PBR material; detail comes from geometry.
 * 2. **No name lookups.** Everything a rig needs to animate is returned in `parts` as a live
 *    reference, so a <primitive> reparent can't invalidate it (footgun #7).
 *
 * Colours are the palettes measured off the reference by the skill's PBR-evidence extractor.
 * They are engineering constants of the object (anodised metal, keycap plastic), not brand
 * tokens — anything brand-specific comes in through `options`.
 */

/**
 * Albedo, NOT the sampled pixel colour.
 *
 * The skill's PBR extractor reports the palette it measures off the reference — but those pixels
 * are already lit. Feeding them back in as baseColor applies the lighting twice and the model
 * renders visibly washed out (first pass of this factory did exactly that). These are the
 * measured palettes darkened back toward plausible albedo; the reference values are kept in
 * laptop.sculpt-spec.json under each material's referencePbr.
 */
const COL = {
  body: 0x3a4050,
  keycap: 0x474d5d,
  trim: 0x181c25,
  trackpad: 0x333846,
  screenOff: 0x20263a,
} as const;

/** Deck footprint. Everything else is positioned off these. */
const DECK_W = 3.2;
const DECK_D = 2.15;
const DECK_H = 0.09;
/** Rear edge of the deck — the hinge line. The lid pivots here, nowhere else. */
const HINGE_Z = -DECK_D / 2;

const LID_W = 3.15;
const LID_LEN = 2.0;
const LID_H = 0.06;

export interface LaptopModelParts extends Record<string, Mesh | Group | MeshStandardMaterial> {
  /** Rotate `.rotation.x` to open: 0 = closed, about -1.78 rad = fully open. */
  lid: Group;
  /** The slab everything else sits on. */
  deck: Mesh;
  /** The whole keycap array as one instanced mesh. */
  keycaps: Mesh;
  trackpad: Mesh;
  /** Mutate `.emissiveIntensity` to ramp the display on. */
  screenMaterial: MeshStandardMaterial;
  /** Exposed so a scene can tint the chassis without reaching into the graph. */
  bodyMaterial: MeshStandardMaterial;
}

/**
 * What a laptop is, as an assertion. Same idea as GAMEPAD_CONTRACT: knowledge about the object
 * CLASS, not about this particular model.
 *
 * `surfaceAxis: null` because a clamshell has no single mounting face — keys sit on the deck's
 * top, the screen rides a lid that swings through 100°. Position and proportion still apply.
 */
export const LAPTOP_CONTRACT: PartsContract = {
  required: ["lid", "deck", "keycaps", "trackpad"],
  layout: [
    { of: "keycaps", is: "above", than: "deck" }, // keys sit ON the deck, not through it
    { of: "trackpad", is: "inFrontOf", than: "keycaps" }, // palm rest is toward the user
    // NOTE: no rule about where the lid sits. It's on a hinge — closed it covers the keyboard,
    // open it stands behind it. A contract states invariants of the CLASS, and the position of a
    // moving part isn't one. (Asserting "lid behind keys" failed on the model's own closed
    // default state, which is how this got noticed.)
  ],
  proportions: [
    { what: "deck", measure: "width", per: "deck", perMeasure: "depth", range: [1.3, 1.7], note: "a 13-inch deck is ~300×210 mm" },
    { what: "deck", measure: "height", per: "deck", perMeasure: "width", range: [0.01, 0.08], note: "the machine reads thin" },
    { what: "keycaps", measure: "width", per: "deck", range: [0.7, 0.98] },
    { what: "trackpad", measure: "width", per: "deck", range: [0.15, 0.45] },
  ],
  surfaceAxis: null,
};

export interface LaptopModelOptions {
  /** Display glow colour — pass a brand token here (theme.<brand>.accent). */
  screenGlow?: string;
  /** Chassis colour override; defaults to the measured anodised grey-blue. */
  bodyColor?: string;
}

/**
 * Rounded rectangle in XY. Real rounded corners, because a laptop silhouette with hard 90°
 * corners reads as a cardboard box — and grimoire/build/geometry_patterns.md lists
 * "every edge perfectly sharp" as a procedural-model failure tell.
 */
const roundedRect = (w: number, h: number, r: number): Shape => {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

/**
 * Extruded slab lying in the XZ plane with a real chamfer on its edges.
 * The chamfer is geometry, not a normal map: it has to catch an actual rim highlight from the
 * key light, which is one of the spec's critical review features.
 */
const slab = (w: number, d: number, h: number, corner: number, bevel: number): ExtrudeGeometry => {
  const geo = new ExtrudeGeometry(roundedRect(w - bevel * 2, d - bevel * 2, corner), {
    depth: h - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2); // shape XY → floor plane XZ, extrusion becomes height
  geo.center();
  return geo;
};

/**
 * Keyboard rows in key units (1u = a letter key), front row last. Widths are authored from the
 * reference, not generated: real keyboards have wide modifiers and a long spacebar, and evenly
 * sized keys are the giveaway of a faked keyboard.
 */
const KEY_ROWS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25],
];

const KB_W = 2.84;
const KB_D = 1.42;
const KB_CZ = -0.28; // keyboard sits toward the hinge; palm rest and trackpad in front of it
const KEY_GAP = 0.026;
const KEY_H = 0.022;

/**
 * One InstancedMesh for every keycap: ~57 boxes as separate meshes would be 57 draw calls for
 * what is visually one surface. Per-instance width comes from the row layout via the matrix.
 */
const buildKeycaps = (material: MeshStandardMaterial, topY: number): InstancedMesh => {
  const total = KEY_ROWS.reduce((n, row) => n + row.length, 0);
  const rowDepth = KB_D / KEY_ROWS.length;
  const unit = (KB_W - KEY_GAP) / 14; // 14 key units across
  const mesh = new InstancedMesh(new BoxGeometry(1, KEY_H, rowDepth - KEY_GAP), material, total);
  const m = new Matrix4();
  let i = 0;
  KEY_ROWS.forEach((row, r) => {
    const z = KB_CZ - KB_D / 2 + rowDepth * (r + 0.5);
    let x = -KB_W / 2;
    row.forEach((units) => {
      const w = units * unit - KEY_GAP;
      m.makeScale(w, 1, 1);
      m.setPosition(x + w / 2 + KEY_GAP / 2, topY + KEY_H / 2, z);
      mesh.setMatrixAt(i++, m);
      x += units * unit;
    });
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
};

export const createLaptopModel = (
  options: LaptopModelOptions = {},
): ModelHandles<LaptopModelParts> => {
  const bodyMaterial = new MeshStandardMaterial({
    color: new Color(options.bodyColor ?? COL.body),
    roughness: 0.42,
    metalness: 0.55,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: new Color(COL.trim),
    roughness: 0.72,
    metalness: 0.25,
  });
  const keycapMaterial = new MeshStandardMaterial({
    color: new Color(COL.keycap),
    roughness: 0.68,
    metalness: 0.18,
  });
  const trackpadMaterial = new MeshStandardMaterial({
    color: new Color(COL.trackpad),
    roughness: 0.28,
    metalness: 0.3,
  });
  // Emissive, not a bright albedo: the panel is a light source that spills onto the deck.
  // Intensity starts low so a scene can ramp it (Laptop3DIntro does exactly this with the GLB).
  const screenMaterial = new MeshStandardMaterial({
    color: new Color(COL.screenOff),
    roughness: 0.18,
    metalness: 0,
    emissive: new Color(options.screenGlow ?? "#8fa0ff"),
    emissiveIntensity: 0.9,
  });

  const root = new Group();
  root.name = "Laptop";

  // ── deck ────────────────────────────────────────────────────────────────
  const deck = new Mesh(slab(DECK_W, DECK_D, DECK_H, 0.09, 0.03), bodyMaterial);
  deck.name = "Deck";
  deck.position.y = DECK_H / 2;
  root.add(deck);

  const deckTop = DECK_H;

  // recessed keyboard plate — the dark well the keycaps sit in
  const plate = new Mesh(new BoxGeometry(KB_W + 0.08, 0.014, KB_D + 0.08), trimMaterial);
  plate.position.set(0, deckTop - 0.004, KB_CZ);
  root.add(plate);

  const keycaps = buildKeycaps(keycapMaterial, deckTop);
  keycaps.name = "Keycaps";
  root.add(keycaps);

  // trackpad: inset panel in the palm rest, slightly smoother than the chassis
  const trackpad = new Mesh(slab(0.95, 0.62, 0.012, 0.02, 0.004), trackpadMaterial);
  trackpad.position.set(0, deckTop - 0.002, 0.62);
  root.add(trackpad);

  // ── hinge + lid ─────────────────────────────────────────────────────────
  const hinge = new Mesh(new CylinderGeometry(0.035, 0.035, 2.9, 20), trimMaterial);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, deckTop - 0.01, HINGE_Z + 0.05);
  root.add(hinge);

  /**
   * Pivot group ON the hinge line. This is the whole point of the model: rotating a lid about
   * its own centre sinks half of it through the deck. The lid is authored CLOSED (lying flat
   * over the deck, growing forward in +Z) so `lid.rotation.x` reads as the open angle.
   */
  const lid = new Group();
  lid.name = "Lid";
  lid.position.set(0, deckTop, HINGE_Z);
  root.add(lid);

  const lidShell = new Mesh(slab(LID_W, LID_LEN, LID_H, 0.085, 0.025), bodyMaterial);
  lidShell.position.set(0, 0, LID_LEN / 2);
  lid.add(lidShell);

  // bezel sits on the inner face (pointing down while closed, at the viewer once open)
  const bezel = new Mesh(new BoxGeometry(LID_W - 0.06, 0.008, LID_LEN - 0.06), trimMaterial);
  bezel.position.set(0, -LID_H / 2 + 0.002, LID_LEN / 2);
  lid.add(bezel);

  const screen = new Mesh(new PlaneGeometry(2.86, 1.72), screenMaterial);
  screen.rotation.x = Math.PI / 2; // face -Y while closed → toward the viewer when open
  screen.position.set(0, -LID_H / 2 - 0.004, LID_LEN / 2 + 0.02);
  screen.name = "ScreenFace";
  lid.add(screen);

  const parts: LaptopModelParts = { lid, deck, keycaps, trackpad, screenMaterial, bodyMaterial };
  // Mirrors the upstream skill's convention — handy when debugging in the Studio inspector.
  root.userData.sculptRuntime = {
    nodes: { root, deck, lid, keycaps },
    materials: { bodyMaterial, screenMaterial, trimMaterial, keycapMaterial, trackpadMaterial },
  };
  return { group: root, parts };
};
