import { fontFamily } from "./fonts";

/**
 * Tixu brand tokens, extracted from the live product (tixu.ai) on 2026-07-01.
 * Single source of truth for every scene, so the video stays pixel-true.
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
    hair: "rgba(3,20,35,0.08)", // hairline borders
    softShadow: "0 18px 40px -18px rgba(9,46,92,0.20)",
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
