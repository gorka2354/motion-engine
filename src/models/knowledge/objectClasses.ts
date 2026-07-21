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

export interface ObjectClass {
  id: string;
  /** Overall bounding box of a representative specimen. */
  boundingMm: { width: number; height: number; depth: number };
  source: string;
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
    subParts: [
      { name: "deck", mm: { depth: 9 } },
      { name: "lid", mm: { depth: 6 } },
      { name: "keycap", mm: { width: 16 }, note: "1u key pitch ~19 mm, cap ~16 mm" },
      { name: "trackpad", mm: { width: 105 } },
    ],
    flatSurfaces: ["deck top", "lid outer", "display"],
  },
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
