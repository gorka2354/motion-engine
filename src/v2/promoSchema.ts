import { z } from "zod";

/**
 * Declarative contract for the V2 master (inc-5, AI-authoring):
 * the whole storyline is data — edit the map (or pass --props) instead of JSX.
 * Camera art (zoom/pull-back keyframes, blur windows) stays in code.
 */

/** One big-typography story beat, absolute frames, viewport coords. */
export const typoBeatSchema = z.object({
  title: z.string(),
  sub: z.string().optional(),
  /** Word inside `title` tinted with the accent color. */
  accentWord: z.string().optional(),
  from: z.number(),
  to: z.number(),
  y: z.number(),
  /** Typography scale slot from theme.type. */
  size: z.enum(["hero", "beat", "beatWide", "beatZoom"]),
});

export const screenName = z.enum([
  "home",
  "library",
  "profile",
  "path",
  "quiz",
  "tools",
]);

export const promoSchema = z.object({
  brand: z.object({
    /** Wordmark file in public/ (rendered white on the dark stage). */
    logo: z.string(),
    ctaLabel: z.string(),
    endTitleLines: z.array(z.string()),
  }),
  /** Story beats over the floating phone. */
  beats: z.array(typoBeatSchema),
  /** The beat shown over the zoomed-in display (drives the top scrim). */
  zoomBeat: typoBeatSchema,
  /** In-device navigation: which screen appears when, push or tab switch. */
  nav: z.array(
    z.object({
      at: z.number(),
      kind: z.enum(["push", "tab"]),
      screen: screenName,
    }),
  ),
  /** Floating payoff elements (viewport space). */
  floats: z.object({
    certificate: z.object({ from: z.number(), to: z.number() }),
    chips: z.object({ from: z.number(), to: z.number() }),
  }),
});

export type PromoProps = z.infer<typeof promoSchema>;
export type ScreenName = z.infer<typeof screenName>;
