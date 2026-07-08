import { loadFont } from "@remotion/google-fonts/Manrope";

// Tixu uses Manrope across the whole product.
export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "cyrillic"],
});
