import {
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  TorusGeometry,
  Vector2,
} from "three";
import type { ModelHandles } from "../types";
import { loftGeometry } from "../loft";
import { glyphGeometry } from "../glyphs";
import type { GlyphName } from "../glyphs";
import type { PartsContract } from "../contract";

/**
 * Procedural game controller, reconstructed from a single front-on product photo
 * (out/bench/ref/gamepad.png, 442×394 — the probe flagged it `conditional`: fine for form,
 * too low-res for fine surface texture).
 *
 * WHY THE SHAPE IS BUILT THE WAY IT IS. A controller is organic — nothing about it is a box —
 * so the usual primitive kit doesn't apply. What a single front photo DOES give exactly is the
 * outline, so the outline is traced by hand and then LOFTED through depth (`../loft.ts`).
 *
 * The first version extruded that outline at constant thickness instead. It scored 1.4%
 * silhouette drift against the reference and still looked wrong from every other angle — right
 * outline, no volume. That failure is what the L5-fidelity flatness-check now exists to catch
 * (it read 92% side-bbox fill; lofted, the same model reads 78.5%).
 *
 * Depth, the palm swell and the backward sweep of the grips are INFERRED — one head-on photo
 * cannot show them. A side reference would replace that guesswork with measurement.
 *
 * ABXY legends and the round badge are real extruded geometry (`../glyphs.ts`) — drawn as Shape
 * outlines rather than a texture or a loaded typeface, so the factory stays synchronous.
 *
 * Known simplifications, deliberate:
 * - Grip texture (the fine dot pattern) is below the reference's resolution — omitted rather
 *   than invented.
 * - The back (triggers, battery hump) is absent: not visible in the reference.
 */

/** Palette. Sampled colours were lit pixels — body albedo is darkened back (see Gotchas). */
const COL = {
  body: 0x151515,
  bodyTrim: 0x1f1f1f,
  bumper: 0x1a1a1a,
  stick: 0x121212,
  stickRing: 0x0c0c0c,
  dpad: 0x242424,
  button: 0x131313,
  logo: 0xa8a8a8,
  // Deep pigments on purpose: under the bench key light a "correct" bright hue washes out to
  // pastel (same double-lighting trap as the body albedo).
  y: 0xb07c00,
  x: 0x005e9c,
  b: 0xa81813,
  a: 0x237a14,
} as const;

/**
 * Silhouette traced off the reference, right half only, from the top-centre saddle clockwise
 * down to the crotch between the grips; the left half is mirrored. Units: body width = 4.
 */
const OUTLINE_RIGHT: [number, number][] = [
  // The top edge is nearly FLAT in the reference — the saddle sits only ~2% of the object
  // height below the shoulders. Sparse points let splineThru bow into humps, so it's sampled
  // densely here to hold the line down.
  [0.0, 1.28],
  [0.2, 1.31],
  [0.43, 1.34],
  [0.7, 1.36],
  [0.95, 1.375],
  [1.1, 1.37], // shoulder shelf — the bumper sits on this edge
  [1.36, 1.31],
  [1.63, 1.16],
  [1.86, 0.87],
  [1.97, 0.52],
  [2.0, 0.2], // widest point
  [1.95, -0.08],
  [1.84, -0.37],
  [1.7, -0.65],
  [1.54, -0.91],
  [1.35, -1.15],
  [1.13, -1.33],
  [0.87, -1.41], // grip tip
  [0.68, -1.32],
  [0.52, -1.12],
  [0.4, -0.9],
  [0.27, -0.74],
  // Crotch depth is measured, not guessed: in the reference it spans 27% of the object height.
  // Raising it to "widen the gap" (pass 2) just made the grips read as trouser legs.
  [0.0, -0.64],
];

/** The traced outline, mirrored and resampled into a smooth closed contour. */
const bodyOutline = (samples = 120): Vector2[] => {
  const s = new Shape();
  const right = OUTLINE_RIGHT.map(([x, y]) => new Vector2(x, y));
  // mirrored left half, walked back up to the start (skip the shared crotch/saddle points)
  const left = OUTLINE_RIGHT.slice(1, -1)
    .reverse()
    .map(([x, y]) => new Vector2(-x, y));
  s.moveTo(right[0].x, right[0].y);
  s.splineThru(right.slice(1));
  s.splineThru(left);
  s.closePath();
  // Evenly spaced points keep the loft's quads uniform; getPoints() would crowd the curves.
  return s.getSpacedPoints(samples);
};

/**
 * Depth profile of the shell, back → front.
 *
 * Deliberately NOT a symmetric lens: a controller's face is close to flat (it has to carry
 * buttons), while the back is a deep rounded swell that fills the palm. A symmetric profile
 * makes a cushion — correct volume, wrong object.
 *
 * The long plateau at scale ≈ 1 between z 0.1 and 0.38 IS the face plate; FACE_Z sits on it.
 */
const BODY_SECTIONS = [
  { z: -0.8, scale: 0.26 }, // rounded back of the palm swell
  { z: -0.68, scale: 0.52 },
  { z: -0.52, scale: 0.72 },
  { z: -0.32, scale: 0.87 },
  { z: -0.12, scale: 0.95 },
  { z: 0.08, scale: 0.99 },
  { z: 0.26, scale: 1.0 }, // widest
  { z: 0.38, scale: 0.99 },
  // The front must stay near full width and STOP — tapering it to a small cap turns the shell
  // into a smooth hill with nowhere to seat the buttons (they sank inside on the first loft).
  // The end cap at 0.9 IS the face plate.
  { z: 0.44, scale: 0.96 },
  { z: 0.47, scale: 0.9 },
];

/** Front face plate, in local Z — the loft's end cap. Everything mounts relative to this. */
const FACE_Z = 0.47;

export interface GamepadModelParts
  extends Record<string, Mesh | Group | MeshStandardMaterial> {
  /** Tilt these to fake stick input. */
  leftStick: Group;
  rightStick: Group;
  /** Push along -Z for a press. */
  buttonA: Group;
  buttonB: Group;
  buttonX: Group;
  buttonY: Group;
  /** Glows when the controller "wakes". */
  logoMaterial: MeshStandardMaterial;
  bodyMaterial: MeshStandardMaterial;
}

/**
 * What a controller must have, regardless of which controller it is.
 *
 * This is knowledge about the OBJECT CLASS, not about this model: any gamepad has two sticks and
 * four face buttons in a diamond, and every one of them sits on the face, not inside the shell.
 * Written as a contract, it becomes a test instead of an assumption — see src/models/contract.ts
 * for why (short version: a loft-profile change once buried every part and nothing caught it).
 */
export const GAMEPAD_CONTRACT: PartsContract = {
  required: ["leftStick", "rightStick", "buttonA", "buttonB", "buttonX", "buttonY"],
  layout: [
    // ABXY diamond
    { of: "buttonY", is: "above", than: "buttonX" },
    { of: "buttonY", is: "above", than: "buttonA" },
    { of: "buttonA", is: "below", than: "buttonB" },
    { of: "buttonX", is: "leftOf", than: "buttonB" },
    // Xbox-style offset layout: the left stick rides high, the right one sits low
    { of: "leftStick", is: "leftOf", than: "rightStick" },
    { of: "leftStick", is: "above", than: "rightStick" },
  ],
  // Class proportions, from the reference photo and from real hardware (a controller is ~153 mm
  // wide, ~102 mm tall, ~60 mm deep; sticks ≈20 mm across, face buttons ≈11 mm). Ranges are wide
  // enough for any controller, tight enough to catch dinner-plate buttons or a squashed body —
  // which pass every other gate, since they break neither silhouette nor arrangement.
  proportions: [
    { what: "model", measure: "width", per: "model", perMeasure: "height", range: [1.3, 1.6], note: "a controller is wider than tall" },
    { what: "model", measure: "depth", per: "model", perMeasure: "width", range: [0.28, 0.5], note: "deep enough to fill a palm" },
    { what: "leftStick", measure: "width", per: "model", range: [0.1, 0.19] },
    { what: "rightStick", measure: "width", per: "model", range: [0.1, 0.19] },
    { what: "buttonA", measure: "width", per: "model", range: [0.045, 0.09] },
    { what: "buttonY", measure: "width", per: "model", range: [0.045, 0.09] },
  ],
  // The two sticks are the same component; so are the four face buttons.
  sameSize: [
    ["leftStick", "rightStick"],
    ["buttonA", "buttonB"],
    ["buttonX", "buttonY"],
  ],
  // The face buttons carry extruded letter glyphs — a button mounted backwards hides its legend
  // while keeping its position, size and spacing intact.
  orientation: [
    { of: "buttonA", points: "forward", minDot: 0.8 },
    { of: "buttonY", points: "forward", minDot: 0.8 },
  ],
  minSeparation: 0.12,
};

export interface GamepadModelOptions {
  /** Chassis colour — the reference is Carbon Black; pass a brand token for a variant. */
  bodyColor?: string;
  /** Xbox-nexus glow; defaults to a neutral warm white. */
  logoGlow?: string;
}

export const createGamepadModel = (
  options: GamepadModelOptions = {},
): ModelHandles<GamepadModelParts> => {
  const bodyMaterial = new MeshStandardMaterial({
    color: new Color(options.bodyColor ?? COL.body),
    roughness: 0.82, // matte soft-touch plastic: broad, weak speculars
    metalness: 0.04,
  });
  const trimMaterial = new MeshStandardMaterial({
    color: new Color(COL.bodyTrim),
    roughness: 0.7,
    metalness: 0.06,
  });
  const stickMaterial = new MeshStandardMaterial({
    color: new Color(COL.stick),
    roughness: 0.55,
    metalness: 0.1,
  });
  const ringMaterial = new MeshStandardMaterial({
    color: new Color(COL.stickRing),
    roughness: 0.45,
    metalness: 0.15,
  });
  const dpadMaterial = new MeshStandardMaterial({
    color: new Color(COL.dpad),
    roughness: 0.6,
    metalness: 0.08,
  });
  const buttonMaterial = new MeshStandardMaterial({
    color: new Color(COL.button),
    roughness: 0.4,
    metalness: 0.1,
  });
  const logoMaterial = new MeshStandardMaterial({
    color: new Color(COL.logo),
    roughness: 0.35,
    emissive: new Color(options.logoGlow ?? "#cfd6e4"),
    emissiveIntensity: 0.32,
  });

  const root = new Group();
  root.name = "Gamepad";

  // ── body: the traced outline LOFTED through depth ─────────────────────
  // Not an extrusion. A constant-thickness sweep of this outline scored 1.4% silhouette drift
  // and still looked like a biscuit (side view filled 92% of its bbox). Sections scaled along a
  // lens curve give the shell an actual bulge, and `warp` sweeps the grips backwards — the one
  // thing section scaling can't express, and the thing that makes a controller read as held.
  const body = new Mesh(
    loftGeometry(bodyOutline(), BODY_SECTIONS, {
      warp: (x, y, z) => {
        // grips curl back and inward below the waist; 0 above it, growing toward the tips
        const g = Math.min(1, Math.max(0, -(y + 0.15) / 1.25));
        const curl = g * g;
        return [x * (1 - curl * 0.06), y, z - curl * 0.62];
      },
    }),
    bodyMaterial,
  );
  body.name = "Body";
  root.add(body);

  /** Mount a part on the face plate at (x, y), lifted by `lift` above the shell. */
  const mount = (obj: Group | Mesh, x: number, y: number, lift = 0): void => {
    obj.position.set(x, y, FACE_Z + lift);
    root.add(obj);
  };

  // ── analog sticks ─────────────────────────────────────────────────────
  // The cap is CONCAVE, and that's the whole read of a stick. First pass used a squashed sphere
  // and it domed outward like a bead. Built instead as: collar ring + a rim torus + a floor set
  // below the rim, so the silhouette dips inward exactly where the reference does.
  const stick = (): Group => {
    const g = new Group();
    const well = new Mesh(new CylinderGeometry(0.31, 0.29, 0.07, 36), trimMaterial);
    well.rotation.x = Math.PI / 2;
    well.position.z = -0.05;
    g.add(well);
    // stem of the cap
    const stem = new Mesh(new CylinderGeometry(0.2, 0.22, 0.11, 32), stickMaterial);
    stem.rotation.x = Math.PI / 2;
    g.add(stem);
    // knurled rim the thumb sits against
    const rim = new Mesh(new TorusGeometry(0.195, 0.032, 14, 40), ringMaterial);
    rim.position.z = 0.05;
    g.add(rim);
    // dished floor, recessed below the rim
    const floor = new Mesh(new CircleGeometry(0.185, 32), stickMaterial);
    floor.position.z = 0.028;
    g.add(floor);
    return g;
  };
  const leftStick = stick();
  const rightStick = stick();
  mount(leftStick, -1.11, 0.68, 0.02);
  mount(rightStick, 0.5, 0.04, 0.02);

  // ── d-pad: dished disc + a real cross ─────────────────────────────────
  // First pass built the cross from 4-sided cylinders and the two arms ended up skewed against
  // each other. Two boxes are simpler and actually orthogonal.
  const dpad = new Group();
  const dpadBase = new Mesh(new CylinderGeometry(0.3, 0.3, 0.06, 36), trimMaterial);
  dpadBase.rotation.x = Math.PI / 2;
  dpad.add(dpadBase);
  const ARM_L = 0.5;
  const ARM_W = 0.17;
  const armH = new Mesh(new BoxGeometry(ARM_L, ARM_W, 0.06), dpadMaterial);
  armH.position.z = 0.045;
  dpad.add(armH);
  const armV = new Mesh(new BoxGeometry(ARM_W, ARM_L, 0.06), dpadMaterial);
  armV.position.z = 0.045;
  dpad.add(armV);
  mount(dpad, -0.59, -0.01, 0.02);

  // ── ABXY: black button + coloured insert (glyphs need a texture — see header) ──
  const faceButton = (tint: number, letter: GlyphName): Group => {
    const g = new Group();
    const base = new Mesh(new CylinderGeometry(0.125, 0.125, 0.07, 28), buttonMaterial);
    base.rotation.x = Math.PI / 2;
    g.add(base);
    // A real extruded letter, not a coloured dot: the legend is the whole point of ABXY, and
    // geometry gets it without a canvas texture or a loaded font (hard rule #6).
    // No emissive — an earlier pass lit these and they washed out to pastel against black.
    const glyph = new Mesh(
      glyphGeometry(letter, { size: 0.125, depth: 0.02, bevel: 0.004 }),
      new MeshStandardMaterial({ color: new Color(tint), roughness: 0.42, metalness: 0 }),
    );
    glyph.position.z = 0.045;
    g.add(glyph);
    return g;
  };
  const buttonY = faceButton(COL.y, "Y");
  const buttonX = faceButton(COL.x, "X");
  const buttonB = faceButton(COL.b, "B");
  const buttonA = faceButton(COL.a, "A");
  mount(buttonY, 1.02, 0.9, 0.02);
  mount(buttonX, 0.74, 0.63, 0.02);
  mount(buttonB, 1.3, 0.63, 0.02);
  mount(buttonA, 1.02, 0.35, 0.02);

  // ── nexus logo + the small view/menu/share cluster ────────────────────
  // Round badge: a dark dished base with the lit ring + cross sitting proud of it.
  const logo = new Group();
  const logoBase = new Mesh(new CylinderGeometry(0.14, 0.14, 0.05, 32), trimMaterial);
  logoBase.rotation.x = Math.PI / 2;
  logo.add(logoBase);
  const logoRing = new Mesh(
    glyphGeometry("nexus", { size: 0.2, depth: 0.018, bevel: 0.003 }),
    logoMaterial,
  );
  logoRing.position.z = 0.032;
  logo.add(logoRing);
  const logoCross = new Mesh(
    glyphGeometry("X", { size: 0.105, depth: 0.016, bevel: 0.003 }),
    logoMaterial,
  );
  logoCross.position.z = 0.03;
  logo.add(logoCross);
  mount(logo, -0.08, 1.1, 0.02);

  const smallButton = (r: number): Mesh => {
    const m = new Mesh(new CylinderGeometry(r, r, 0.05, 24), trimMaterial);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  mount(smallButton(0.08), -0.34, 0.64, 0.01); // view
  mount(smallButton(0.08), 0.26, 0.64, 0.01); // menu
  mount(smallButton(0.07), -0.04, 0.42, 0.01); // share

  const parts: GamepadModelParts = {
    leftStick,
    rightStick,
    buttonA,
    buttonB,
    buttonX,
    buttonY,
    logoMaterial,
    bodyMaterial,
  };
  root.userData.sculptRuntime = {
    nodes: { root, body, leftStick, rightStick, dpad },
    materials: { bodyMaterial, stickMaterial, buttonMaterial, logoMaterial },
  };
  return { group: root, parts };
};
