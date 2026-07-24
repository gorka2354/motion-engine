import { z } from "zod";
import type { PromoProps } from "./promoSchema";

/**
 * StylePreset overlay (inc: director-layer, Increment 3). "N styles from one
 * brief" = one director timeline × N parameter overlays — NOT N independent
 * generations. `applyStyle` overlays a preset onto a scene-map: the tempo
 * (`pace`) is baked into the props (every frame field scales together), and the
 * non-timing knobs (type / finish / sound / palette) are resolved into `style`
 * for the render path (and the Increment-4 variant loop) to consume.
 *
 * CAMERA STAYS CODE (decision at Inc-3 entry): the zoom / blur / push-back art
 * lives in FloatingPhonePromo behind `// stays code`, entangled with beat frames
 * via `kf` easing. A preset does NOT touch it — extracting it would break that
 * boundary and make the Δ=0 identity non-trivial. Camera restyling waits for a
 * read-only camera descriptor (deferred). So calm↔kinetic differ in pace /
 * finish / type / sound / palette, not in the zoom shot itself.
 *
 * Δ=0 CONTRACT: Premium-Calm is the shipped house style expressed as an IDENTITY
 * overlay — `pace: 1` short-circuits to the SAME props (no arithmetic → no float
 * drift → byte-identical render). Absolute values, never multipliers-of-derived.
 * Pure & DOM-free (node-testable).
 */

export const stylePresetSchema = z.object({
  name: z.string(),
  /** Global tempo multiplier over ALL frame fields (1 = identity; <1 faster). */
  pace: z.number().positive(),
  type: z.object({ scaleMult: z.number().positive(), tracking: z.number() }),
  finish: z.object({
    grain: z.number().min(0).max(1),
    filmGrade: z.number().min(0).max(1),
    letterbox: z.boolean(),
  }),
  sound: z.object({
    sfxDensity: z.number().min(0),
    heroVol: z.number().min(0).max(1),
    tickVol: z.number().min(0).max(1),
  }),
  /** Accent hue-rotate in degrees over the brand palette (0 = brand default). */
  palette: z.object({ hueRotate: z.number() }),
});

export type StylePreset = z.infer<typeof stylePresetSchema>;

/** The shipped house style, as an identity overlay (see Δ=0 contract above). */
export const PREMIUM_CALM: StylePreset = {
  name: "Premium-Calm",
  pace: 1,
  type: { scaleMult: 1, tracking: 0 },
  finish: { grain: 0.08, filmGrade: 0.5, letterbox: false },
  sound: { sfxDensity: 1, heroVol: 0.9, tickVol: 0.5 },
  palette: { hueRotate: 0 },
};

export const KINETIC_ENERGETIC: StylePreset = {
  name: "Kinetic-Energetic",
  pace: 0.82, // ~18% faster
  type: { scaleMult: 1.06, tracking: -0.5 },
  finish: { grain: 0.14, filmGrade: 0.6, letterbox: false },
  sound: { sfxDensity: 1.5, heroVol: 1, tickVol: 0.7 },
  palette: { hueRotate: 0 },
};

export const EDITORIAL_MINIMAL: StylePreset = {
  name: "Editorial-Minimal",
  pace: 1.12, // slower, room to breathe
  type: { scaleMult: 0.96, tracking: 1 },
  finish: { grain: 0, filmGrade: 0.35, letterbox: true },
  sound: { sfxDensity: 0.6, heroVol: 0.8, tickVol: 0.35 },
  palette: { hueRotate: 0 },
};

export const PRESETS = {
  PremiumCalm: PREMIUM_CALM,
  Kinetic: KINETIC_ENERGETIC,
  Editorial: EDITORIAL_MINIMAL,
} as const;

export type PresetName = keyof typeof PRESETS;

const scale = (n: number, pace: number): number => Math.round(n * pace);

/** Scale every frame field in the props by pace. Identity (same reference) when
 *  pace === 1 — the load-bearing guarantee behind the Δ=0 contract. */
function paceProps(props: PromoProps, pace: number): PromoProps {
  if (pace === 1) return props; // identity: no arithmetic, byte-identical
  const win = <T extends { from: number; to: number }>(w: T): T => ({
    ...w,
    from: scale(w.from, pace),
    to: scale(w.to, pace),
  });
  return {
    ...props,
    beats: props.beats.map(win),
    zoomBeat: win(props.zoomBeat),
    nav: props.nav.map((n) => ({ ...n, at: scale(n.at, pace) })),
    floats: {
      certificate: win(props.floats.certificate),
      chips: win(props.floats.chips),
    },
  };
}

export interface StyledPromo {
  props: PromoProps;
  style: StylePreset;
}

/**
 * Overlay a StylePreset onto a scene-map. `props` carries the paced timeline;
 * `style` carries the resolved non-timing knobs. For Premium-Calm the returned
 * `props` is the SAME object as the input (identity → Δ=0).
 */
export function applyStyle(props: PromoProps, preset: StylePreset): StyledPromo {
  return { props: paceProps(props, preset.pace), style: preset };
}
