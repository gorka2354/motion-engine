import { z } from "zod";

/**
 * Analyzer output (inc: director-layer, Increment 2). The Analyzer step of the
 * motion-promo pipeline reads a product (URL / screens / copy) and emits ONE
 * `<brand>.brief.ts` of this shape — the durable artifact the Director then
 * turns into a scene-map. Today that recon lives only in session memory; a small
 * typed brief makes motion-promo + freelance runs repeatable and structurally
 * grounds the pipeline in real product specifics
 * (feedback_realism_over_abstraction) instead of the agent's memory.
 *
 * VERBATIM RULE: `copy` holds strings lifted from the product, never invented.
 */

/** Promo categories (motion-promo skill, vika 04). */
export const briefCategory = z.enum([
  "feature-demo",
  "product-tour",
  "brand-hero",
  "data-stats",
  "explainer",
  "launch",
  "social-teaser",
  "testimonial",
  "comparison",
]);

/** Narrative frameworks (motion-promo skill, vika 04). */
export const briefFramework = z.enum([
  "hook-demo-benefits-cta",
  "show-dont-tell",
  "pas",
  "bab",
]);

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "expected #rgb or #rrggbb");

export const briefSchema = z.object({
  product: z.object({ name: z.string(), url: z.string() }),
  category: briefCategory,
  framework: briefFramework,
  /** Maps into theme.<brand>; `accent` must equal that brand token's accent. */
  palette: z.object({
    accent: hex,
    /** Short read of the background family, e.g. "deep-space navy". */
    bgFamily: z.string(),
    /** Accent-glow strength used on the stage, 0–1. */
    glowAlpha: z.number().min(0).max(1),
  }),
  /** Product features, ranked; exactly one is the hero (see {@link heroFeatures}). */
  features: z
    .array(
      z.object({
        label: z.string(),
        rank: z.number().int().positive(),
        isHero: z.boolean(),
      }),
    )
    .min(1),
  /** The single emotional beat the promo is built around. */
  heroBeat: z.object({ feature: z.string(), why: z.string() }),
  /** Verbatim copy lifted from the product — never invented. */
  copy: z.object({
    headline: z.string(),
    cta: z.string(),
    lines: z.array(z.string()).default([]),
  }),
  /** Asset paths under public/ (logos, icons) the build uses. */
  assets: z.array(z.string()).default([]),
});

export type Brief = z.infer<typeof briefSchema>;
export type BriefCategory = z.infer<typeof briefCategory>;
export type BriefFramework = z.infer<typeof briefFramework>;

/** The hero-tagged features — the Director needs exactly one anchor. */
export const heroFeatures = (b: Brief) => b.features.filter((f) => f.isHero);
