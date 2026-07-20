import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  ShapeGeometry,
  Shape,
  Vector2,
} from "three";
import type { ModelHandles } from "../types";
import type { PartsContract } from "../contract";
import { loftGeometry } from "../loft";

/**
 * Generic smartphone — the 3D counterpart to `src/device/PhoneFrame` (2D).
 *
 * Deliberately not modelled on any particular handset: a recognisable brand device in a
 * commercial promo is a trademark question, and nothing here needs one. Proportions come from
 * the class (a ~6-inch phone is roughly 147 × 71 × 8 mm), not from a specific product.
 *
 * The screen material is returned in `parts` on purpose. A factory may not load images — that
 * would drag the delayRender race back in (hard rule #6) — but a SCENE can: mount a texture onto
 * `parts.screenMaterial` from a component that owns the loading. The model stays synchronous and
 * unit-testable; the composition decides whether the screen shows a UI or just glows.
 *
 * Body is lofted rather than extruded: a modern handset's sides curve into the back, and a
 * constant-thickness sweep reads as a flat card (see loft.ts for how that failure was found).
 */

/** Albedo, darkened from observed values — sampled pixels are already lit. */
const COL = {
  body: 0x2c2f36,
  rail: 0x4a4f59,
  glass: 0x0b0d12,
  lens: 0x0a0c11,
  lensRing: 0x596170,
  flash: 0xd8cba8,
} as const;

// Class proportions: ~147 × 71 × 7.8 mm. Width is the unit everything else derives from.
const W = 2.0;
const H = W * 2.07;
const D = W * 0.11;

const BEZEL = 0.075;
const CORNER = 0.3;

/** Rounded rectangle centred on the origin. */
const roundedRect = (w: number, h: number, r: number): Shape => {
  const s = new Shape();
  const x = w / 2;
  const y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y);
  s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r);
  s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r);
  s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
};

/** Body outline, sampled evenly so the loft's quads stay uniform. */
const bodyOutline = (samples = 96): Vector2[] => roundedRect(W, H, CORNER).getSpacedPoints(samples);

/**
 * Depth profile. Flat through the middle — that plateau is what makes the front a usable screen
 * plane — with the last sections pulling in so the sides roll into the back instead of ending on
 * a hard rim.
 */
const BODY_SECTIONS = [
  { z: -D / 2, scale: 0.955 },
  { z: -D / 2 + 0.02, scale: 0.985 },
  { z: -D / 2 + 0.05, scale: 1.0 },
  { z: D / 2 - 0.05, scale: 1.0 },
  { z: D / 2 - 0.02, scale: 0.985 },
  { z: D / 2, scale: 0.955 },
];

const FACE_Z = D / 2;

export interface PhoneModelParts extends Record<string, Mesh | Group | MeshStandardMaterial> {
  /** Assign `.map`/`.emissiveMap` from a scene to show real UI on the display. */
  screenMaterial: MeshStandardMaterial;
  screen: Mesh;
  body: Mesh;
  /** Rear camera island — tilt or highlight it in a hero shot. */
  cameraIsland: Group;
  bodyMaterial: MeshStandardMaterial;
}

export interface PhoneModelOptions {
  /** Chassis colour — pass a brand token for a themed device. */
  bodyColor?: string;
  /** Screen glow when no texture is mounted. */
  screenGlow?: string;
  /** 0 = display off (near-black glass), 1 = fully lit. */
  screenOn?: number;
}

/**
 * What a phone is, as an assertion.
 *
 * `surfaceAxis: null` — the parts do not share one mounting face: the screen is on the front, the
 * camera island on the back. A single ray direction would report one of them as buried, which is
 * the same lesson the laptop taught (a hinged lid has no fixed side either).
 */
export const PHONE_CONTRACT: PartsContract = {
  required: ["screen", "body", "cameraIsland"],
  layout: [
    { of: "screen", is: "inFrontOf", than: "body" },
    { of: "cameraIsland", is: "behind", than: "body" },
    { of: "cameraIsland", is: "above", than: "body" }, // sits in the upper corner, not centred
  ],
  proportions: [
    { what: "body", measure: "height", per: "body", perMeasure: "width", range: [1.9, 2.3], note: "a handset is about twice as tall as it is wide" },
    { what: "body", measure: "depth", per: "body", perMeasure: "width", range: [0.05, 0.2], note: "thin slab, not a brick" },
    { what: "screen", measure: "width", per: "body", range: [0.85, 0.99], note: "bezels are thin on a modern phone" },
    { what: "cameraIsland", measure: "width", per: "body", range: [0.2, 0.55] },
  ],
  surfaceAxis: null,
};

export const createPhoneModel = (options: PhoneModelOptions = {}): ModelHandles<PhoneModelParts> => {
  const on = options.screenOn ?? 1;
  const bodyMaterial = new MeshStandardMaterial({
    color: new Color(options.bodyColor ?? COL.body),
    roughness: 0.52,
    metalness: 0.35, // anodised aluminium is satin; high metalness mirrors the backdrop white
  });
  const railMaterial = new MeshStandardMaterial({
    color: new Color(COL.rail),
    roughness: 0.3,
    metalness: 0.75,
  });
  const screenMaterial = new MeshStandardMaterial({
    color: new Color(COL.glass),
    roughness: 0.08, // glass: tight highlight
    metalness: 0.1,
    emissive: new Color(options.screenGlow ?? "#8ea6ff"),
    emissiveIntensity: 0.55 * on,
  });
  const lensMaterial = new MeshStandardMaterial({
    color: new Color(COL.lens),
    roughness: 0.05,
    metalness: 0.4,
  });
  const ringMaterial = new MeshStandardMaterial({
    color: new Color(COL.lensRing),
    roughness: 0.25,
    metalness: 0.85,
  });

  const root = new Group();
  root.name = "Phone";

  const body = new Mesh(loftGeometry(bodyOutline(), BODY_SECTIONS), bodyMaterial);
  body.name = "Body";
  root.add(body);

  // ── display: inset behind a thin bezel so the glass reads as recessed, not painted on ──
  // The screen has to follow the body's rounded corners. A plain PlaneGeometry pushes square
  // corners past the shell and the phone reads as a sticker on a pebble.
  const screen = new Mesh(
    new ShapeGeometry(roundedRect(W - BEZEL * 2, H - BEZEL * 2, CORNER - BEZEL), 12),
    screenMaterial,
  );
  screen.name = "Screen";
  screen.position.z = FACE_Z + 0.002;
  root.add(screen);

  // punch-hole camera — a small dark disc reads as the cutout at this scale
  const punchHole = new Mesh(new CylinderGeometry(0.045, 0.045, 0.01, 20), lensMaterial);
  punchHole.rotation.x = Math.PI / 2;
  punchHole.position.set(0, H / 2 - 0.22, FACE_Z + 0.006);
  root.add(punchHole);

  // ── rear camera island: raised plate + two lenses + flash ──
  const cameraIsland = new Group();
  cameraIsland.name = "CameraIsland";
  const plate = new Mesh(new BoxGeometry(0.78, 0.78, 0.045), railMaterial);
  cameraIsland.add(plate);
  const lens = (x: number, y: number, r: number): Group => {
    const g = new Group();
    const ring = new Mesh(new CylinderGeometry(r, r, 0.05, 24), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const glass = new Mesh(new CylinderGeometry(r * 0.72, r * 0.72, 0.055, 24), lensMaterial);
    glass.rotation.x = Math.PI / 2;
    g.add(glass);
    g.position.set(x, y, -0.02);
    return g;
  };
  cameraIsland.add(lens(-0.17, 0.17, 0.17));
  cameraIsland.add(lens(0.17, -0.17, 0.17));
  const flash = new Mesh(new CylinderGeometry(0.045, 0.045, 0.05, 16), new MeshStandardMaterial({
    color: new Color(COL.flash),
    roughness: 0.4,
    emissive: new Color(COL.flash),
    emissiveIntensity: 0.15,
  }));
  flash.rotation.x = Math.PI / 2;
  flash.position.set(0.17, 0.17, -0.02);
  cameraIsland.add(flash);
  // upper-left of the BACK: mirrored in X because the back faces the other way
  cameraIsland.position.set(-W / 2 + 0.62, H / 2 - 0.62, -FACE_Z - 0.02);
  root.add(cameraIsland);

  // ── side rails: power on the right, volume pair on the left ──
  const rail = (x: number, y: number, h: number): Mesh => {
    const m = new Mesh(new BoxGeometry(0.03, h, D * 0.5), railMaterial);
    m.position.set(x, y, 0);
    return m;
  };
  root.add(rail(W / 2 + 0.006, 0.55, 0.42)); // power
  root.add(rail(-W / 2 - 0.006, 0.95, 0.3)); // volume up
  root.add(rail(-W / 2 - 0.006, 0.58, 0.3)); // volume down

  const parts: PhoneModelParts = { screen, screenMaterial, body, cameraIsland, bodyMaterial };
  root.userData.sculptRuntime = {
    nodes: { root, body, screen, cameraIsland },
    materials: { bodyMaterial, screenMaterial, railMaterial, lensMaterial },
  };
  return { group: root, parts };
};
