import { fontFamily } from "../fonts";

/**
 * Design tokens — the single source of truth for every visual constant:
 * colors, gradients, shadows, typography scale, radii, durations, easing.
 * Brand values extracted from the live product (tixu.ai) on 2026-07-01;
 * consolidated here from per-file hardcodes (inc-1).
 */
export const theme = {
  color: {
    primary: "#127CE0", // rgb(18,124,224) — buttons, active states
    primaryDeep: "#0E63B4",
    ink: "#031423", // headings
    body: "#333D40", // body copy
    muted: "#8B98A2", // secondary text
    green: "#0EAD63", // progress / success
    greenTint: "#E6F7EF",
    tint: "#DCECFC", // light-blue card tint
    gradTop: "#A1CDF7", // hero gradient blue
    gradLavender: "#E7E3FF",
    surface: "#FFFFFF",
    field: "#F1F5F9", // input / chat-bar fill
    hair: "rgba(3,20,35,0.08)", // hairline borders
    softShadow: "0 18px 40px -18px rgba(9,46,92,0.20)",
  },
  /** Device shell (PhoneFrame). */
  titanium: {
    frame: "linear-gradient(150deg, #3A424B 0%, #12161B 46%, #05070A 100%)",
    island: "#05080B",
    homeIndicator: "rgba(3,20,35,0.26)",
  },
  /** Full-frame backdrops. `living` (V2) and `scene` (V1) are near-dupes — unify in the craft pass. */
  gradient: {
    living: "linear-gradient(180deg, #E9F3FE 0%, #F5FAFF 52%, #FFFFFF 100%)",
    scene: "linear-gradient(180deg, #E8F2FE 0%, #F4F9FF 48%, #FFFFFF 100%)",
    vignette:
      "radial-gradient(120% 90% at 50% 42%, transparent 62%, rgba(3,20,35,0.05) 100%)",
  },
  shadow: {
    phone:
      "0 80px 140px -40px rgba(9,46,92,0.45), 0 30px 60px -30px rgba(9,46,92,0.38), inset 0 0 0 2px rgba(255,255,255,0.06)",
    ctaGlow: "0 24px 48px -14px rgba(18,124,224,0.6)", // big end-card CTA
    buttonGlow: "0 14px 26px -10px rgba(18,124,224,0.6)", // in-screen primary buttons
    cardHighlight: "0 12px 24px -12px rgba(18,124,224,0.45)", // selected model card
    sheet: "0 -24px 60px rgba(9,46,92,0.20)", // bottom sheet
  },
  /** Brand-tinted tiles behind provider logos (AiToolsScreen). */
  providerTint: {
    openai: "#E7F7F0",
    openaiNeutral: "#EEF1F5",
    gemini: "#EAF1FE",
    runway: "#EEF0F3",
    flux: "#F0ECFE",
  },
  /** Typography scale for the V2 beat system (px @ 1080-wide master). */
  type: {
    hero: 88, // opening statement beats
    endTitle: 82, // end-card headline
    beat: 72, // standard feature beat
    beatWide: 64, // long single-line beat
    beatZoom: 62, // headline over the zoomed-in display
    cta: 31, // CTA button label
    sub: 30, // beat sub-line
    letterSpacing: -2,
    lineHeight: 1.04,
    lineHeightEnd: 1.06,
    weightHeading: 800,
    weightSub: 600,
  },
  /** Shared animation timings (frames @ 30fps). */
  duration: {
    beatIn: 22, // TypoBeat / window01 enter
    beatOut: 18, // TypoBeat / window01 exit
  },
  /** Cubic-bezier stops; build with `Easing.bezier(...theme.ease.enter)`. */
  ease: {
    enter: [0.16, 1, 0.3, 1], // soft expo-out — the "Apple" entrance
    inOut: [0.65, 0, 0.35, 1], // symmetric — camera moves
    exit: [0.4, 0, 1, 1], // accelerating exits
  },
  radius: {
    pill: 999,
    button: 14,
    card: 22,
    screen: 46,
    phone: 66,
  },
  font: {
    family: fontFamily,
    // Manrope + color-emoji fallback (backpack, robot, wave emoji in the UI).
    stack: `${fontFamily}, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`,
  },
} as const;

export type Theme = typeof theme;
