import React from "react";
import { Starfield as StarfieldBase } from "../../lib/Starfield";
import { Z } from "../zarya.style";

/**
 * Zarya's cosmic backdrop — the engine <Starfield> primitive tinted with the
 * brand's warm-white + brass-gold stars. Thin wrapper so the promo keeps one
 * import; the deterministic math and rendering live in src/lib.
 */
export const Starfield: React.FC<{ count?: number; opacity?: number; meteors?: boolean }> = (props) => (
  <StarfieldBase {...props} baseColor={`rgb(${Z.star})`} goldColor={`rgb(${Z.starGold})`} />
);
