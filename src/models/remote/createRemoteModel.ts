import {
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector2,
} from "three";
import { Shape } from "three";
import type { BufferGeometry } from "three";
import type { ModelHandles } from "../types";
import type { PartsContract } from "../contract";
import { loftGeometry } from "../loft";
import { OBJECT_CLASSES, mountPoints, partSize } from "../knowledge/objectClasses";
import { glyphGeometry } from "../glyphs";
import { textGeometry } from "../detail/text";

/**
 * Procedural TV/DVD remote — a new object built to test the one-pass pipeline end to end.
 *
 * Method, the whole point: the DOSSIER came first. src/models/knowledge/objectClasses.ts declares
 * what a remote IS — 2 power keys, a 12-key numeric pad, 2 rockers, a nav ring, 4 function keys —
 * with each control's count and its mount point in millimetres. This factory does not decide the
 * layout; it READS it (`mountPoints`) and loops. A control cannot be forgotten, because the loop is
 * over the class's own mounts, and the reference photo only had to supply the outline and the look,
 * not the part list a glare-filled product shot can't be trusted for.
 *
 * The body is one lofted shell: a flat front plateau the keys sit on, a domed back for the palm —
 * the profile a constant-thickness extrusion (footgun: the flat-biscuit remote) could never give.
 */

/** Albedo, darkened from the reference's lit pixels (same double-lighting trap as the other models). */
const COL = {
  body: 0x26282c,
  bodyTrim: 0x35383d,
  key: 0x3b3e44,
  keyTop: 0x484c53,
  rocker: 0x303338,
  power: 0x8a1f18, // deep red — a bright hue washes to pink under the bench key light
  ring: 0x303338,
  ok: 0x3f434a,
  legend: 0xb7bcc4,
  ir: 0x0a0a0c,
} as const;

const CLASS = OBJECT_CLASSES.remote;
const MM = CLASS.boundingMm;

/** Scene units per mm. Width lands at 1.2 units so the tall body frames in the bench camera. */
export const U = 1.2 / MM.width;
const BODY_W = MM.width * U;
const BODY_H = MM.height * U;
const DEPTH = MM.depth * U;
/** Front plane the keys seat on — the frontmost surface, so a key lifted a hair sits proud of it. */
export const FACE_Z = DEPTH * 0.5;

/** Rounded-rectangle ring, sampled evenly so the loft quads stay uniform. */
const roundedRect = (w: number, h: number, r: number, samples = 128): Vector2[] => {
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
  return s.getSpacedPoints(samples);
};

/**
 * Depth stack: a FLAT front plateau (scale 1.0 across the front) so the keypad has a plane to sit
 * on, and a domed back (scale 0.5 → 1.0) for the palm swell the reference shows. Asymmetric on
 * purpose — a symmetric lens would round the button face into a pillow.
 */
const bodySections = () => [
  { z: -DEPTH * 0.5, scale: 0.5 },
  { z: -DEPTH * 0.4, scale: 0.78 },
  { z: -DEPTH * 0.25, scale: 0.94 },
  { z: -DEPTH * 0.1, scale: 1.0 },
  { z: DEPTH * 0.12, scale: 1.0 },
  { z: DEPTH * 0.35, scale: 1.0 },
  { z: DEPTH * 0.46, scale: 0.95 },
  { z: DEPTH * 0.5, scale: 0.85 },
];

export interface RemoteModelParts extends Record<string, Mesh | Group | MeshStandardMaterial> {
  navpad: Group;
  powerL: Group;
  powerR: Group;
  rockerL: Mesh;
  rockerR: Mesh;
  bodyMaterial: MeshStandardMaterial;
  // The numeric pad (num00…num11) and function keys (fnMenu…) are registered by name too, so the
  // class's part-count gate can see them — the d-pad taught us a built-but-unexposed part is a
  // part no gate can check. The shell mesh is deliberately NOT here: it is what parts mount ON, so
  // surface- and stray-checking it against "everything else" is meaningless (it flags itself).
}

export const REMOTE_CONTRACT: PartsContract = {
  classId: "remote",
  required: ["navpad", "powerL", "powerR", "rockerL", "rockerR"],
  proportions: [
    { what: "model", measure: "height", per: "model", perMeasure: "width", range: [3.2, 5.0], note: "a remote is long and narrow" },
    { what: "model", measure: "depth", per: "model", perMeasure: "width", range: [0.4, 0.72], note: "a chunky slab, thick enough to hold — the keys add to the bare body's 0.5" },
    { what: "navpad", measure: "width", per: "model", range: [0.5, 0.95] },
  ],
  sameSize: [
    ["powerL", "powerR"],
    ["rockerL", "rockerR"],
  ],
  // Every control is on the front face, so one axis is meaningful here (unlike the phone/laptop).
  surfaceAxis: [0, 0, 1],
  minSeparation: 0.1,
};

export interface RemoteModelOptions {
  /** Chassis colour — pass a brand token for a variant. */
  bodyColor?: string;
}

export const createRemoteModel = (options: RemoteModelOptions = {}): ModelHandles<RemoteModelParts> => {
  const bodyMaterial = new MeshStandardMaterial({
    color: new Color(options.bodyColor ?? COL.body),
    roughness: 0.5, // hard glossy plastic: a tighter highlight than the gamepad's soft-touch
    metalness: 0.08,
  });
  const keyMaterial = new MeshStandardMaterial({ color: new Color(COL.key), roughness: 0.55, metalness: 0.05 });
  const rockerMaterial = new MeshStandardMaterial({ color: new Color(COL.rocker), roughness: 0.5, metalness: 0.06 });
  const powerMaterial = new MeshStandardMaterial({ color: new Color(COL.power), roughness: 0.42, metalness: 0.08 });
  const ringMaterial = new MeshStandardMaterial({ color: new Color(COL.ring), roughness: 0.5, metalness: 0.08 });
  const okMaterial = new MeshStandardMaterial({ color: new Color(COL.ok), roughness: 0.48, metalness: 0.06 });
  // Legends are a LIT material, never emissive: an emissive legend washes out to pastel under the
  // bench key light (the gamepad's ABXY comment and materials.ts both record this). COL.legend was
  // defined and unused until now — this is what it was for.
  const legendMaterial = new MeshStandardMaterial({ color: new Color(COL.legend), roughness: 0.5, metalness: 0.1 });

  const root = new Group();
  root.name = "Remote";

  // Every named control is registered here so the class part-count gate can see it.
  const parts = { bodyMaterial } as RemoteModelParts;

  const body = new Mesh(loftGeometry(roundedRect(BODY_W, BODY_H, 22 * U), bodySections()), bodyMaterial);
  body.name = "Body";
  root.add(body);

  // ── IR emitter window at the top tip — the one feature that instantly says "remote" ──
  // A near-black glossy disc, not a control (no legend, no class entry): it is a surface feature of
  // the shell, so it goes straight on the body rather than through the part-count gate.
  const irMaterial = new MeshStandardMaterial({ color: new Color(COL.ir), roughness: 0.16, metalness: 0.1 });
  const irWindow = new Mesh(new CylinderGeometry(0.09, 0.09, 0.03, 28), irMaterial);
  irWindow.rotation.x = Math.PI / 2;
  irWindow.position.set(0, BODY_H * 0.44, FACE_Z + 0.002);
  irWindow.name = "IrWindow";
  root.add(irWindow);

  /**
   * A button cap as ONE lathed surface: a straight skirt turning through a chamfer into a slightly
   * dished top. The chamfer is real geometry, not a normal map — it has to catch an actual rim
   * highlight, the exact thing the old disc-on-disc `roundKey` couldn't (grimoire's #1 "fake" tell
   * is a perfectly sharp edge; laptop's slab() makes the same argument for its bevel). ~28 radial
   * segments; caps cache nothing individually but the legend geometry does.
   */
  const CAP_TOP = 0.96;
  const buttonCap = (r: number, h: number, mat: MeshStandardMaterial): Mesh => {
    const pt = (rad: number, y: number): Vector2 => new Vector2(r * rad, h * y);
    const profile = [pt(1, 0), pt(1, 0.5), pt(0.94, 0.72), pt(0.78, 0.9), pt(0.48, 0.99), pt(0, CAP_TOP)];
    const geo = new LatheGeometry(profile, 28);
    geo.rotateX(Math.PI / 2); // lathe revolves around Y; turn the cap to face +Z like everything else
    return new Mesh(geo, mat);
  };

  /**
   * A button: a lathed cap plus a printed legend flush on its dished top. Returns a named Group so
   * the part-count and on-surface gates still see one proud control per mount point.
   */
  const button = (name: string, r: number, mat: MeshStandardMaterial, legend?: BufferGeometry): Group => {
    const g = new Group();
    g.name = name;
    const h = r * 0.5;
    g.add(buttonCap(r, h, mat));
    if (legend) {
      const l = new Mesh(legend, legendMaterial);
      l.position.z = h * CAP_TOP; // sits in the dish; the legend's own depth leaves it half-proud
      g.add(l);
    }
    return g;
  };

  const place = (obj: Group | Mesh, x: number, y: number, lift = 0.006): void => {
    obj.position.set(x, y, FACE_Z + lift);
    root.add(obj);
    parts[obj.name] = obj;
  };

  // ── power keys (from the class mounts) — a real IEC power glyph on each ──
  const powerR = partSize("remote", "power", U).width! / 2;
  const powerGlyph = glyphGeometry("power", { size: powerR * 0.95, depth: 0.012, bevel: 0.003 });
  mountPoints("remote", "power", U).forEach((p, i) => {
    place(button(i === 0 ? "powerL" : "powerR", powerR, powerMaterial, powerGlyph), p[0], p[1]);
  });

  // ── numeric pad — real numerals, one geometry per digit (cached, so repeats are free) ──
  const numR = partSize("remote", "number", U).width! / 2;
  const NUM_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0", "#"];
  mountPoints("remote", "number", U).forEach((p, i) => {
    const legend = textGeometry(NUM_LABELS[i], { size: numR * 0.82, depth: 0.012 });
    place(button(`num${String(i).padStart(2, "0")}`, numR, keyMaterial, legend), p[0], p[1]);
  });

  // ── volume / channel rockers, with + / − at the ends ────────────────────
  const rk = partSize("remote", "rocker", U);
  const rockerLen = rk.height! - rk.width!; // capsule cylinder length = total − 2·radius
  const rockerR = rk.width! / 2;
  const plusGeo = textGeometry("+", { size: rockerR * 0.9, depth: 0.01 });
  const minusGeo = textGeometry("-", { size: rockerR * 0.9, depth: 0.01 });
  mountPoints("remote", "rocker", U).forEach((p, i) => {
    const m = new Mesh(new CapsuleGeometry(rockerR, rockerLen, 6, 16), rockerMaterial);
    // Capsule stands along Y (its default axis) — a tall pill you press top or bottom.
    m.name = i === 0 ? "rockerL" : "rockerR";
    // + near the top, − near the bottom, on the front of the pill — reads instantly as a rocker.
    const zFront = rockerR + 0.004;
    const plus = new Mesh(plusGeo, legendMaterial);
    plus.position.set(0, rk.height! * 0.3, zFront);
    m.add(plus);
    const minus = new Mesh(minusGeo, legendMaterial);
    minus.position.set(0, -rk.height! * 0.3, zFront);
    m.add(minus);
    place(m, p[0], p[1], 0.02);
  });

  // ── navigation ring + OK centre (one concentric part) ───────────────────
  const navOuter = partSize("remote", "navpad", U).width! / 2;
  const navpad = new Group();
  navpad.name = "navpad";
  const ring = new Mesh(new TorusGeometry(navOuter, navOuter * 0.16, 16, 40), ringMaterial);
  navpad.add(ring);
  const ok = new Mesh(new CylinderGeometry(navOuter * 0.46, navOuter * 0.46, 0.06, 28), okMaterial);
  ok.rotation.x = Math.PI / 2;
  ok.position.z = 0.02;
  navpad.add(ok);
  const okLegend = new Mesh(textGeometry("OK", { size: navOuter * 0.3, depth: 0.01 }), legendMaterial);
  okLegend.position.z = 0.055;
  navpad.add(okLegend);
  // four directional cues, so the ring reads as a d-pad rather than a washer
  for (let d = 0; d < 4; d++) {
    const a = (d / 4) * Math.PI * 2;
    const bump = new Mesh(new CylinderGeometry(navOuter * 0.1, navOuter * 0.1, 0.04, 12), ringMaterial);
    bump.rotation.x = Math.PI / 2;
    bump.position.set(Math.cos(a) * navOuter * 0.66, Math.sin(a) * navOuter * 0.66, 0.03);
    navpad.add(bump);
  }
  const navMount = mountPoints("remote", "navpad", U)[0];
  // Lifted a hair proud of the face. At lift 0 the ring's anchor sits exactly on the front surface,
  // the zero-distance hit falls inside the raycaster's near plane and is discarded, and the next
  // surface is the far wall 24 mm back — so a correctly-seated ring reads as floating. A real
  // d-pad stands a little proud anyway.
  place(navpad, navMount[0], navMount[1], 0.02);

  // ── function keys — single-letter legends (menu / return / exit / info) ──
  const fnR = partSize("remote", "functionButton", U).width! / 2;
  const fnNames = ["fnMenu", "fnReturn", "fnExit", "fnInfo"];
  const FN_LABELS = ["M", "R", "E", "i"];
  mountPoints("remote", "functionButton", U).forEach((p, i) => {
    const legend = textGeometry(FN_LABELS[i], { size: fnR * 0.8, depth: 0.012 });
    place(button(fnNames[i], fnR, keyMaterial, legend), p[0], p[1]);
  });

  root.userData.sculptRuntime = {
    nodes: { root, body, navpad },
    materials: { bodyMaterial, keyMaterial, rockerMaterial, powerMaterial },
  };
  return { group: root, parts };
};
