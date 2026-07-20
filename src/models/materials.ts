import { Color, MeshPhysicalMaterial, MeshStandardMaterial } from "three";

/**
 * PBR presets with measured numbers, and a validator for the mistakes that keep costing renders.
 *
 * WHY THIS ISN'T IN theme/tokens.ts (hard rule #2): tokens.ts holds BRAND constants — hex swatches,
 * gradients, type scale. These are PHYSICAL constants of real materials: aluminium reflects what
 * aluminium reflects regardless of whose video it appears in. Brand colour still arrives through a
 * factory's `options`, exactly as it does today.
 *
 * Three bugs this exists to stop, each cost a render cycle:
 *
 * 1. **Photo pixel used as albedo.** A pixel is albedo × lighting. Feeding it back in applies the
 *    lighting twice and the model renders washed out.
 * 2. **Half-tone metalness.** `metalness: 0.62` describes no real material. The shader lerps
 *    between dielectric and conductor BRDFs: diffuse is scaled by (1 − m) so the colour goes dull,
 *    while Fresnel heads toward a near-white metallic reflection — so the surface is simultaneously
 *    drab and mirror-like, which is exactly how a phone's side ended up mirroring a white backdrop.
 * 3. **Saturated legends turning pastel.** Partly tone mapping, partly albedo pushed too bright.
 *
 * Sources: physically-based.info spectral measurements (metal reflectance), Substance/Marmoset
 * practice (roughness bands), DONTNOD/Lagarde albedo-range chart.
 */

/** Reflectance tint of a conductor at `metalness: 1`, as sRGB hex. */
export const METAL = {
  /** Anodised or bare aluminium — the default "product chassis" metal. */
  aluminium: 0xf5f6f6,
  stainless: 0xd6d1cb,
  silver: 0xfefdfc,
  gold: 0xffe496,
  copper: 0xf7cfbf,
} as const;

/** Roughness bands measured off real finishes — pick by finish, not by feel. */
export const FINISH = {
  mirror: 0.08,
  polished: 0.15,
  brushed: 0.35,
  beadBlasted: 0.6,
  matte: 0.8,
} as const;

/**
 * Dielectric albedos (`metalness: 0`). Note how dark real "black" plastic is: the temptation is to
 * lighten it, but a matte black polymer genuinely sits near sRGB 20–40.
 */
export const DIELECTRIC = {
  /** Soft-touch black plastic, the standard consumer-device shell. */
  blackPlastic: 0x1e1e1e,
  darkPlastic: 0x2b2b2b,
  greyPlastic: 0x767676,
  /** 18% photographic middle grey — sRGB 118, NOT 128. Useful as a sanity reference. */
  middleGrey: 0x767676,
  whitePlastic: 0xf0efe3,
  rubber: 0x2a2a2a,
  ceramic: 0xe0e0dd,
  /** Display glass when the panel is off. */
  darkGlass: 0x0b0d12,
} as const;

export interface MetalOptions {
  color?: number | string;
  finish?: number;
}

/** A physically-plausible metal: metalness pinned to 1, roughness from a finish band. */
export const metal = (options: MetalOptions = {}): MeshStandardMaterial =>
  new MeshStandardMaterial({
    color: new Color(options.color ?? METAL.aluminium),
    metalness: 1,
    roughness: options.finish ?? FINISH.brushed,
  });

export interface PlasticOptions {
  color?: number | string;
  roughness?: number;
  /** Adds a clearcoat layer — glossy moulded plastic over a rougher base. */
  lacquer?: boolean;
}

/** A physically-plausible dielectric: metalness pinned to 0. */
export const plastic = (options: PlasticOptions = {}): MeshStandardMaterial => {
  const base = {
    color: new Color(options.color ?? DIELECTRIC.blackPlastic),
    metalness: 0,
    roughness: options.roughness ?? 0.6,
  };
  return options.lacquer
    ? new MeshPhysicalMaterial({ ...base, clearcoat: 1, clearcoatRoughness: 0.15 })
    : new MeshStandardMaterial(base);
};

// ── validation ──────────────────────────────────────────────────────────

export type MaterialWarning = { level: "error" | "warning"; message: string };

export interface ValidateOptions {
  /**
   * Lower bound on sRGB luminance for a dielectric albedo. Deliberately 16, not the 50 quoted by
   * the DONTNOD chart: that chart targets photoreal film work, and our own controller uses
   * 0x121212 (18) and 0x151515 (21) as *correct, intentional* soft-touch black. Calibrated against
   * the models in this repo rather than copied.
   */
  minLuma?: number;
  /** Upper bound — above this, an albedo is brighter than fresh snow and has light baked in. */
  maxLuma?: number;
}

const srgbLuma = (c: Color): number => {
  // luminance on the sRGB-encoded value, which is what an artist reads off a swatch
  const hex = c.getHexString();
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

/**
 * Check a material against the physical invariants. Returns findings rather than throwing:
 * `error` is genuinely impossible, `warning` is "almost certainly a mistake, but a stylised scene
 * may want it". Nothing here fails a build on its own — the repo's existing materials predate it
 * and several are deliberately outside the recommended bands.
 */
export const validateMaterial = (
  material: MeshStandardMaterial,
  options: ValidateOptions = {},
): MaterialWarning[] => {
  const { minLuma = 16, maxLuma = 243 } = options;
  const out: MaterialWarning[] = [];
  const name = material.name || "(unnamed)";

  if (material.metalness < 0 || material.metalness > 1) {
    out.push({ level: "error", message: `${name}: metalness ${material.metalness} outside 0..1` });
  }
  if (material.roughness < 0 || material.roughness > 1) {
    out.push({ level: "error", message: `${name}: roughness ${material.roughness} outside 0..1` });
  }
  if (material.metalness > 0.1 && material.metalness < 0.9) {
    out.push({
      level: "warning",
      message:
        `${name}: metalness ${material.metalness} is a half-tone — no real material is part ` +
        `conductor. Diffuse gets scaled by (1−m) while Fresnel heads to a metallic near-white, ` +
        `so the surface goes dull AND mirror-like at once. Use 0 or 1.`,
    });
  }

  // albedo range only means anything for dielectrics; a metal's base colour IS its reflectance
  if (material.metalness < 0.5) {
    const luma = srgbLuma(material.color);
    if (luma < minLuma) {
      out.push({
        level: "warning",
        message: `${name}: albedo luma ${luma.toFixed(0)} below ${minLuma} — darker than real pigment`,
      });
    }
    if (luma > maxLuma) {
      out.push({
        level: "warning",
        message:
          `${name}: albedo luma ${luma.toFixed(0)} above ${maxLuma} — brighter than fresh snow, ` +
          `usually means lighting was baked into the colour (a photo pixel is albedo × light)`,
      });
    }
  }
  return out;
};

/** Validate every material reachable from a model, for use in a factory's test. */
export const validateMaterials = (
  materials: MeshStandardMaterial[],
  options: ValidateOptions = {},
): MaterialWarning[] => materials.flatMap((m) => validateMaterial(m, options));
