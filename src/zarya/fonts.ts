import { loadFont as loadPixelify } from "@remotion/google-fonts/PixelifySans";
import { loadFont as loadHandjet } from "@remotion/google-fonts/Handjet";
import { loadFont as loadPTSans } from "@remotion/google-fonts/PTSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Zarya's four bundled faces, mirrored from the real app (all OFL, all with a
 * Cyrillic subset — the UI is Russian). One import site so a weight/subset
 * change lives in one place.
 *   PIXELIFY — the ЗАРЯ // ОРБИТА-1 wordmark (pixel display).
 *   HANDJET  — dot-matrix tech labels (СЕССИИ, ПУСКОВОЙ КОМПЛЕКС, ТЯГА, clock).
 *   PT_SANS  — UI body text (buttons, sidebar copy, chips).
 *   MONO     — terminal + code (JetBrains Mono).
 */
export const { fontFamily: PIXELIFY } = loadPixelify("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin", "cyrillic"],
});
export const { fontFamily: HANDJET } = loadHandjet("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin", "cyrillic"],
});
export const { fontFamily: PT_SANS } = loadPTSans("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "cyrillic"],
});
export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin", "cyrillic"],
});
