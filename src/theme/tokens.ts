import { fontFamily } from "../fonts";

/**
 * Design tokens — the single source of truth for every visual constant:
 * colors, gradients, shadows, typography scale, radii, durations, easing.
 * Brand values for the reference EdTech product;
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
  /** V2 dark stage (inc-3 craft pass) — the phone floats on this. */
  dark: {
    bg: "linear-gradient(180deg, #050E1A 0%, #0A2036 52%, #04101E 100%)",
    vignette:
      "radial-gradient(120% 90% at 50% 40%, transparent 52%, rgba(0,0,0,0.42) 100%)",
    text: "#F2F7FC",
    textMuted: "#93A7BC",
    accent: "#3FA4FF", // accent word on dark — primary reads too dim there
    hair: "rgba(255,255,255,0.16)",
    scrim:
      "linear-gradient(180deg, rgba(4,13,24,0.98) 0%, rgba(4,13,24,0.9) 42%, rgba(4,13,24,0))",
    shadowFloat: "0 40px 80px -24px rgba(0,0,0,0.6)",
    phoneGlow: "radial-gradient(closest-side, rgba(18,124,224,0.4), transparent 72%)",
  },
  /** Bybit brand stage (project preset) — near-black + brand yellow. */
  bybit: {
    bg: "linear-gradient(180deg, #0B0B0D 0%, #17181C 55%, #0A0A0C 100%)",
    accent: "#F7A600",
    accentDeep: "#8F6100",
    text: "#F5F6F8",
    textMuted: "#9AA0AB",
    hair: "rgba(255,255,255,0.14)",
    cardFace: "#121318",
    glow: "radial-gradient(closest-side, rgba(247,166,0,0.35), transparent 72%)",
  },
  /** Shotik brand stage (project preset) — graphite dev-tool dark, violet accent. */
  shotik: {
    bg: "linear-gradient(180deg, #0A0C11 0%, #131622 54%, #0A0C10 100%)",
    accent: "#7C5CFF", // MCP violet
    accentDeep: "#5335C8",
    text: "#F4F5F9",
    textMuted: "#9AA3B5",
    hair: "rgba(255,255,255,0.14)",
    panel: "#171A24", // fake desktop windows
    panelLight: "#1E2230",
    screenBg: "linear-gradient(160deg, #1B1F35 0%, #232043 60%, #191C2E 100%)", // desktop wallpaper
    glow: "radial-gradient(closest-side, rgba(124,92,255,0.38), transparent 72%)",
    ctaGlow: "0 24px 48px -14px rgba(124,92,255,0.55)",
  },
  /** Jumper brand stage (project preset) — deep purple-black, magenta-violet accent
   *  (pulled from jumper.xyz: bg #120B1E, accent #D35CFF from the "route" gradient). */
  jumper: {
    bg: "linear-gradient(180deg, #0C0715 0%, #17102A 54%, #0A0611 100%)",
    accent: "#D35CFF", // magenta-violet, the hero gradient's brightest stop
    accentDeep: "#653CA2", // button base
    accentMid: "#A855F7",
    text: "#FFFFFF",
    textMuted: "#9B8FB5",
    hair: "rgba(255,255,255,0.10)",
    card: "#180F2C", // swap widget surface
    cardInner: "#241640", // From/To sub-cards
    heroGrad: "linear-gradient(90deg, #FFFFFF 25%, #DBCFED 50%, #D35CFF 75%)",
    glow: "radial-gradient(closest-side, rgba(211,92,255,0.34), transparent 72%)",
    ctaGlow: "0 24px 48px -14px rgba(211,92,255,0.5)",
  },
  /** Lumo brand stage (fictional EdTech preset) — deep warm charcoal + coral-rose.
   *  Dark stage for the floating phone; light product screens use accentSolid. */
  lumo: {
    bg: "linear-gradient(180deg, #150E13 0%, #251621 52%, #110A0F 100%)",
    vignette:
      "radial-gradient(120% 90% at 50% 40%, transparent 52%, rgba(0,0,0,0.44) 100%)",
    text: "#FAF4F6",
    textMuted: "#B79BA7",
    accent: "#FB7185", // coral-rose accent word on the dark stage
    scrim:
      "linear-gradient(180deg, rgba(17,10,15,0.98) 0%, rgba(17,10,15,0.9) 42%, rgba(17,10,15,0))",
    shadowFloat: "0 40px 80px -24px rgba(0,0,0,0.62)",
    phoneGlow: "radial-gradient(closest-side, rgba(251,113,133,0.42), transparent 72%)",
    blobA: "#FB7185", // living-background glow blob 1
    blobB: "#9F1239", // deep rose glow blob 2
    // solid accent — CTA + in-screen primary on the light product screens
    accentSolid: "#FB7185",
    accentDeep: "#F1466A",
    ctaGradient: "linear-gradient(135deg, #FB7185 0%, #F1466A 100%)",
    ctaGlow: "0 24px 48px -14px rgba(251,113,133,0.55)",
    buttonGlow: "0 14px 26px -10px rgba(251,113,133,0.5)",
    cardHighlight: "0 12px 24px -12px rgba(251,113,133,0.42)",
    tint: "#FFF0F3", // light coral card / ring-track tint
    tintDeep: "#FFE4E9",
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
