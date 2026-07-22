/**
 * What a class of object IS, in millimetres, before anyone opens a photo.
 *
 * WHY THIS FILE EXISTS. Every factory in this repo used to re-derive real-world proportions from
 * scratch, in prose comments, by eye. That is what produced the puffy controller: depth was driven
 * off ONE number, when a real gamepad's centre housing is ~28 mm deep and its grips are ~60 mm —
 * more than double. No amount of profile-tweaking fixes a wrong premise, and no gate catches it,
 * because the silhouette stays correct the whole time.
 *
 * A single photo cannot supply these numbers: any depth profile that produces the same head-on
 * outline is consistent with the image. Class knowledge is where depth actually comes from; the
 * photo supplies OUTLINE and SURFACE, not volume.
 *
 * Sources are spec sheets and published dimensions, recorded per entry. Where a figure is inferred
 * rather than published it says so — a guess labelled as a guess is usable; a guess labelled as a
 * measurement is how the last model went wrong.
 */

export interface SubPart {
  name: string;
  /** Absolute size in mm, when the part has its own published or measurable dimension. */
  mm?: { width?: number; height?: number; depth?: number };
  /** Angle in degrees where the part is splayed or canted. */
  angleDeg?: number;
  note?: string;
}

/** The six faces of a model, in its own space. */
export type Face = "front" | "back" | "top" | "bottom" | "left" | "right";

/** Outward normal of each face. Lets a part declare which way it is mounted. */
export const FACE_NORMAL: Record<Face, [number, number, number]> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  left: [-1, 0, 0],
  right: [1, 0, 0],
};

/**
 * Where a fact came from, recorded per fact rather than per class.
 *
 * `confidence` is the load-bearing field. "published" means a spec sheet says it in those words;
 * "derived" means a human worked it out from a published figure and the source does NOT say it
 * verbatim. The distinction is not pedantry: the Xbox controller's published input list reads
 * "7 × digital buttons (Y, B, A, X, Menu, View, Xbox)" as one lumped count, so a faithful
 * transcription asserts 7 where this model exposes 4 face buttons — importing that number as
 * "published" would fail a CORRECT model. A wrong count is worse than no count.
 */
export interface Provenance {
  source: string;
  confidence: "published" | "measured" | "derived" | "recalled";
  /** Verbatim, ≤200 chars, so a human can re-check by eye. */
  quote?: string;
}

/**
 * A part the class REQUIRES, with its count and the face it lives on.
 *
 * This is the entry that exists because of a specific failure: the controller shipped with no
 * triggers and no bumpers. Not for want of knowing — the factory's own header named the triggers
 * in prose, and a colour was allocated for a bumper that was never built. Prose gates nothing.
 *
 * `mountsMm` is what turns this file from a test-time oracle into a BUILD-TIME input. A checker
 * that fires after the fact can only ever say "pass one was wrong"; a factory that reads its
 * mount points cannot leave the part out in the first place. gamepadForm.ts already consumes
 * `boundingMm` this way — this generalises the pattern from dimensions to parts.
 */
export interface RequiredPart {
  name: string;
  count: number;
  face: Face;
  /**
   * Regex matched against the keys of the factory's `parts`. Explicit on purpose — a default of
   * `^name` reads as convenient and is wrong here, where the two sticks are `leftStick` and
   * `rightStick` and would both miss `^stick`.
   */
  partsKey: string;
  /** Size in mm, so a count assertion can also assert shape — two bolted-on cubes satisfy a count. */
  mm?: { width?: number; height?: number; depth?: number };
  /**
   * How the part meets the shell. "proud" sits ON the surface, like a face button; "recessed" is
   * set INTO it, like a shoulder bumper sunk into its ledge.
   *
   * This exists because the surface check assumed every part is proud, and said "buried" about a
   * bumper that was correctly sunk into the shoulder — while the render showed the opposite
   * problem. A gate that cannot tell a recessed part from a sunken one will be switched off the
   * first time it is wrong, so it needs the distinction rather than a looser threshold.
   */
  seat?: "proud" | "recessed";
  /** Anchor of each instance, mm from the model's centre. Length should equal `count`. */
  mountsMm?: [number, number, number][];
  prov: Provenance;
}

/** One thickness sample on a face, positioned as a fraction of the mesh's half-extent. */
export interface DepthProbe {
  name: string;
  /** [along-first-perp-axis, along-second-perp-axis], each −1..1. [0,0] is the centre. */
  at: [number, number];
  /** Groups probes so a relation can compare whole regions (e.g. "housing" vs "grip"). */
  role?: string;
}

/**
 * How a class distributes its DEPTH — the fact a photo cannot supply and a silhouette cannot show.
 *
 * A single view fixes the outline and leaves depth free (the bas-relief ambiguity): every depth
 * profile with the same head-on shape is consistent with the image. So "the centre is shallower
 * than the grips" has to be asserted, not measured off a picture. Checked by raycasting the named
 * shell mesh — see depthProfile.ts.
 */
export interface DepthProfile {
  /** Name of the shell mesh to measure — "Body", "Deck". Parts are ignored. */
  mesh: string;
  /** Ray direction: the outward face normal to measure thickness along. */
  axis: [number, number, number];
  probes: DepthProbe[];
  /** median(region) ≤ median(thanRegion) × ratio. Catches one region carrying too much depth. */
  thinner?: { region: string; thanRegion: string; ratio: number }[];
  /** All probes within this factor of each other — a genuinely uniform slab (phone, deck). */
  uniformWithin?: number;
  /** Reported as errors by default; a profile you are unsure of can warn instead. */
  severity?: "error" | "warning";
}

export interface ObjectClass {
  id: string;
  /** Overall bounding box of a representative specimen. */
  boundingMm: { width: number; height: number; depth: number };
  source: string;
  /**
   * How much this entry can be trusted to gate on. "sourced" = every fact carries published or
   * measured provenance, so a violation FAILS. "drafted" = some fact is recalled or derived, so a
   * violation WARNS. Blocking on a half-remembered entry teaches people to delete the classId,
   * which costs more than the gate was worth.
   */
  status: "sourced" | "drafted";
  /** How the class distributes depth across its shell — the check that catches a puffy form. */
  depthProfile?: DepthProfile;
  /** Parts the class must have, with counts and faces. */
  requiredParts?: RequiredPart[];
  /** Parts that carry their own depth — the whole point of the file. */
  subParts?: SubPart[];
  /** Surfaces that are FLAT, which a single lofted profile cannot express. */
  flatSurfaces?: string[];
  notes?: string[];
}

/** width ÷ height and depth ÷ width, derived so a contract can assert them. */
export const ratios = (c: ObjectClass) => ({
  widthOverHeight: c.boundingMm.width / c.boundingMm.height,
  depthOverWidth: c.boundingMm.depth / c.boundingMm.width,
});

export const OBJECT_CLASSES: Record<string, ObjectClass> = {
  gamepad: {
    id: "gamepad",
    boundingMm: { width: 153, height: 102, depth: 60 },
    source: "Xbox Series X controller published dimensions",
    // "drafted", not "sourced": the 28 mm face-housing depth below is the single most load-bearing
    // number in this file and it is recalled, not read off a spec sheet. No public source gives
    // per-sub-part depths — not Wikipedia infoboxes, not Wikidata, not PartNet. That figure stays
    // hand-authored, so the entry warns rather than blocks.
    status: "drafted",
    // Housing shallower than grips. The check compares the DEEPEST housing probe to the MEDIAN grip
    // (see depthProfile.ts): measured max-housing/median-grip = 0.72, so the 0.85 gate clears it by
    // ~15% and fails the puffy bug (which drives the ratio to ~1.0). The blind band is 0.72–0.85: a
    // partial collapse that only reaches 0.84 passes — tightening needs a watched mid-collapse
    // fixture, not a guessed number, so it stays at 0.85 with the band documented rather than moved.
    //
    // Two extra grip probes give the median an outlier margin. severity is "warning", not "error":
    // gamepadForm derives its depths from THIS table, so the check catches the loft collapsing its
    // own relief, never a wrong figure in the table — weak, derived signal, consistent with the rest
    // of this "drafted" entry warning rather than blocking. Phone and laptop, which derive nothing
    // from the class, keep the default "error".
    depthProfile: {
      mesh: "Body",
      axis: [0, 0, 1],
      severity: "warning",
      probes: [
        { name: "housing-top", at: [0, 0.55], role: "housing" },
        { name: "housing-mid", at: [0, 0.3], role: "housing" },
        { name: "housing-l", at: [-0.15, 0.4], role: "housing" },
        { name: "housing-r", at: [0.15, 0.4], role: "housing" },
        { name: "grip-l", at: [-0.72, -0.45], role: "grip" },
        { name: "grip-r", at: [0.72, -0.45], role: "grip" },
        { name: "grip-outer-l", at: [-0.78, -0.2], role: "grip" },
        { name: "grip-outer-r", at: [0.78, -0.2], role: "grip" },
      ],
      thinner: [{ region: "housing", thanRegion: "grip", ratio: 0.85 }],
    },
    requiredParts: [
      {
        name: "trigger",
        count: 2,
        face: "top",
        partsKey: "^trigger(Left|Right)$",
        mm: { width: 30, height: 12, depth: 24 },
        seat: "recessed",
        // Behind the bumpers, angled back over each grip. The y figures are MEASURED against the
        // built shell (a downward raycast puts its top at 48.6 mm here, 52.1 mm at the bumper line),
        // not guessed — the first guess put both parts inside the body and the surface check said so.
        mountsMm: [
          [-42, 46, -16],
          [42, 46, -16],
        ],
        prov: {
          source: "en.wikipedia.org/wiki/Xbox_Wireless_Controller (infobox `input`)",
          confidence: "published",
          quote: "2 × analog triggers (LT, RT)",
        },
      },
      {
        name: "bumper",
        count: 2,
        face: "top",
        partsKey: "^bumper(Left|Right)$",
        mm: { width: 28, height: 9, depth: 15 },
        seat: "recessed",
        mountsMm: [
          [-42, 49, 2],
          [42, 49, 2],
        ],
        prov: {
          source: "en.wikipedia.org/wiki/Xbox_Wireless_Controller (infobox `input`)",
          confidence: "published",
          quote: "2 × shoulder buttons (LB, RB)",
        },
      },
      {
        name: "stick",
        count: 2,
        face: "front",
        partsKey: "^(left|right)Stick$",
        mm: { width: 20 },
        prov: {
          source: "en.wikipedia.org/wiki/Xbox_Wireless_Controller (infobox `input`)",
          confidence: "published",
          quote: "2 × clickable Analog sticks",
        },
      },
      {
        name: "dpad",
        count: 1,
        face: "front",
        partsKey: "^dpad$",
        mm: { width: 28 },
        prov: {
          source: "en.wikipedia.org/wiki/Xbox_Wireless_Controller (infobox `input`)",
          confidence: "published",
          quote: "Digital D-pad",
        },
      },
      {
        name: "faceButton",
        count: 4,
        face: "front",
        partsKey: "^button[ABXY]$",
        mm: { width: 11 },
        prov: {
          source: "en.wikipedia.org/wiki/Xbox_Wireless_Controller (infobox `input`)",
          // DERIVED, not published: the infobox lumps all seven digital buttons into one count
          // ("Y, B, A, X, Menu, View, Xbox"). Transcribing 7 verbatim would fail this model, which
          // exposes the four ABXY caps as parts and mounts Menu/View anonymously. The 4 is a human
          // splitting a lumped source figure — recorded as such.
          confidence: "derived",
          quote: "7 × digital buttons (Y, B, A, X, Menu, View, Xbox)",
        },
      },
    ],
    subParts: [
      {
        name: "face-housing",
        mm: { depth: 28 },
        note: "the plate carrying sticks/buttons — LESS THAN HALF the overall depth. Driving the whole body off the 60 mm figure is what inflates the middle into a cushion.",
      },
      {
        name: "grip",
        mm: { depth: 60, width: 42 },
        angleDeg: 22,
        note: "teardrop lobe, splayed outward and swept back; this is where the 60 mm comes from",
      },
      { name: "face-button", mm: { width: 11 }, note: "ABXY cap diameter" },
      { name: "stick", mm: { width: 20 }, note: "outer diameter of the thumbstick cap" },
      { name: "dpad", mm: { width: 28 } },
    ],
    flatSurfaces: [
      "face plate — sags only a few mm across ~130 mm, i.e. a curvature radius in the hundreds of mm: effectively flat, NOT a lens bulge",
    ],
    notes: [
      "Body is not one continuous shell: a shallow central housing plus two deep grip lobes, joined with a fillet.",
      "Depth belongs to the grips. Any single-profile loft will get the centre wrong.",
    ],
  },

  phone: {
    id: "phone",
    boundingMm: { width: 71, height: 147, depth: 8 },
    source: "typical ~6-inch handset",
    status: "drafted",
    // A handset back is a uniform slab: measured 1.00× across the whole face, gate 1.25×. Full
    // signal — createPhoneModel derives nothing from this table.
    //
    // What this actually catches, honestly: NOT a domed centre. The body is a flat-capped loft, and
    // a loft cannot dome its own middle — every section's vertices share a z, so scaling a ring
    // changes its width, never the depth under the centre. What trips it is EDGE de-covering (an
    // over-taper that pulls a probe off the flat cap) or, in future, a body rebuilt as an extruded
    // shell with a camera bump merged in. The doming guard is forward scaffolding for that; probes
    // are held at 0.6 half-extent so a legitimate edge roll-off can't false-fire it.
    depthProfile: {
      mesh: "Body",
      axis: [0, 0, 1],
      probes: [
        { name: "centre", at: [0, 0] },
        { name: "top", at: [0, 0.6] },
        { name: "bottom", at: [0, -0.6] },
        { name: "side", at: [0.6, 0] },
        { name: "corner", at: [0.55, 0.55] },
      ],
      uniformWithin: 1.25,
    },
    subParts: [
      { name: "camera-island", mm: { width: 30, depth: 2 }, note: "raised above the back panel" },
      { name: "screen-bezel", mm: { width: 2 }, note: "modern handsets are near-bezel-less" },
    ],
    flatSurfaces: ["display glass", "back panel"],
    notes: ["Pocketable objects cluster at depth/width 0.07-0.12 — near-planar."],
  },

  laptop: {
    id: "laptop",
    boundingMm: { width: 300, height: 210, depth: 16 },
    source: "13-inch class, lid closed",
    status: "drafted",
    // The deck is a flat slab, measured along Y (the machine lies in the XZ plane): 1.00× across,
    // gate 1.25×. Full signal — createLaptopModel derives nothing from this table.
    //
    // Reachable failure: an over-large edge chamfer, or a deck rebuilt with a wedge taper — NOT a
    // centre bulge, which the extruded slab cannot form. Probes are held at 0.6 half-extent so
    // today's 0.03 bevel is clear; a future premium chamfer near ~0.3 would reach a 0.8 probe and
    // false-fire, so if the deck's bevel grows, pull these further in. A genuinely wedge-profiled
    // deck (a MacBook-Air taper) would legitimately trip this and needs its own sub-class then.
    depthProfile: {
      mesh: "Deck",
      axis: [0, 1, 0],
      probes: [
        { name: "centre", at: [0, 0] },
        { name: "front", at: [0, 0.6] },
        { name: "back", at: [0, -0.6] },
        { name: "left", at: [-0.6, 0] },
        { name: "right", at: [0.6, 0] },
      ],
      uniformWithin: 1.25,
    },
    subParts: [
      { name: "deck", mm: { depth: 9 } },
      { name: "lid", mm: { depth: 6 } },
      { name: "keycap", mm: { width: 16 }, note: "1u key pitch ~19 mm, cap ~16 mm" },
      { name: "trackpad", mm: { width: 105 } },
    ],
    flatSurfaces: ["deck top", "lid outer", "display"],
  },
};

/** Look up a required part by name. */
export const requiredPart = (classId: string, name: string): RequiredPart | undefined =>
  OBJECT_CLASSES[classId]?.requiredParts?.find((p) => p.name === name);

/**
 * Mount anchors for a part, converted from millimetres into the model's own units.
 *
 * This is the function that makes the class table a build-time INPUT. A factory calls it and gets
 * the positions it must place the part at; there is no path where the part is silently skipped,
 * because the loop is over the class's mounts rather than over whatever the author remembered.
 *
 * @param unitsPerMm the factory's scale — gamepadForm exports `U` for exactly this
 */
export const mountPoints = (
  classId: string,
  name: string,
  unitsPerMm: number,
): [number, number, number][] => {
  const part = requiredPart(classId, name);
  if (!part) throw new Error(`mountPoints: class "${classId}" declares no part "${name}"`);
  if (!part.mountsMm) {
    throw new Error(
      `mountPoints: "${name}" on class "${classId}" has no mountsMm — either add them or place ` +
        `the part by hand and rely on the count check alone`,
    );
  }
  if (part.mountsMm.length !== part.count) {
    throw new Error(
      `mountPoints: "${name}" declares count ${part.count} but ${part.mountsMm.length} mount(s)`,
    );
  }
  return part.mountsMm.map(([x, y, z]) => [x * unitsPerMm, y * unitsPerMm, z * unitsPerMm]);
};

/** Size of a required part in model units, for the axes the class specifies. */
export const partSize = (
  classId: string,
  name: string,
  unitsPerMm: number,
): { width?: number; height?: number; depth?: number } => {
  const mm = requiredPart(classId, name)?.mm ?? {};
  return {
    width: mm.width === undefined ? undefined : mm.width * unitsPerMm,
    height: mm.height === undefined ? undefined : mm.height * unitsPerMm,
    depth: mm.depth === undefined ? undefined : mm.depth * unitsPerMm,
  };
};

/**
 * Sanity-check a built model against its class. Returns complaints; empty means the proportions
 * are consistent with the real object.
 *
 * `tolerance` is generous by default: a stylised promo model is allowed to differ from a spec
 * sheet, but not by 2×. This catches the premise being wrong, not artistic licence.
 */
export const checkAgainstClass = (
  classId: string,
  measured: { width: number; height: number; depth: number },
  tolerance = 0.35,
): string[] => {
  const c = OBJECT_CLASSES[classId];
  if (!c) return [`unknown object class "${classId}"`];
  const want = ratios(c);
  const got = {
    widthOverHeight: measured.width / measured.height,
    depthOverWidth: measured.depth / measured.width,
  };
  const problems: string[] = [];
  for (const key of ["widthOverHeight", "depthOverWidth"] as const) {
    const drift = Math.abs(got[key] - want[key]) / want[key];
    if (drift > tolerance) {
      problems.push(
        `${key} is ${got[key].toFixed(3)}, class "${classId}" implies ${want[key].toFixed(3)} ` +
          `(${(drift * 100).toFixed(0)}% off, max ${(tolerance * 100).toFixed(0)}%) — source: ${c.source}`,
      );
    }
  }
  return problems;
};
