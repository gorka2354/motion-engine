import React from "react";
import { z } from "zod";
import { AbsoluteFill } from "remotion";
import { FilmGrade } from "../lib/FilmGrade";
import { LumoPromo, LUMO_DURATION } from "./LumoPromo";
import { LUMO_DEFAULTS } from "./lumo.map";
import { stylePresetSchema, PREMIUM_CALM, type StylePreset } from "../v2/stylePreset";

export { LUMO_DURATION };

/** Composition props: the ONE Lumo timeline, looked at through a StylePreset. */
export const lumoStyledSchema = z.object({ style: stylePresetSchema });

/**
 * Lumo through a StylePreset's FINISH + PALETTE — the "N styles from one
 * timeline" flagship, rendered as a real video (director-layer Inc-3/4 wiring).
 * One timeline (LUMO_DEFAULTS), N looks: grade strength, saturation, letterbox.
 *
 * TEMPO IS NOT APPLIED HERE. A preset's `pace` scales the beats — the still/lint
 * path proves that — but the engine's camera + end-card timing is hardcoded at
 * absolute frames (`// stays code` in FloatingPhonePromo: END 1160, zoom/blur
 * windows), so pacing the *full video* desyncs them. Tempo variants wait for the
 * deferred camera descriptor; finish/palette is what renders cleanly today.
 *
 * Δ=0: Premium-Calm (no filter, no bars, filmGrade 0.5 → strength 1) returns
 * exactly the LumoPromoPremium tree, so it reproduces the shipped premium pixel
 * for pixel.
 */
export const LumoStyled: React.FC<{ style: StylePreset }> = ({ style }) => {
  const { finish, palette } = style;
  const strength = finish.filmGrade * 2; // 0.5 → 1.0, the shipped premium default
  const filterOn = palette.hueRotate !== 0 || palette.saturate !== 1;

  const graded = (
    <FilmGrade strength={strength} leakColor="150, 190, 255">
      <LumoPromo {...LUMO_DEFAULTS} />
    </FilmGrade>
  );

  // Identity look → the exact LumoPromoPremium tree (Δ=0).
  if (!filterOn && !finish.letterbox) return graded;

  const bar = "11%"; // cinematic bar height, top + bottom
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill
        style={{ filter: filterOn ? `hue-rotate(${palette.hueRotate}deg) saturate(${palette.saturate})` : undefined }}
      >
        {graded}
      </AbsoluteFill>
      {finish.letterbox && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: bar, background: "#000", zIndex: 100 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bar, background: "#000", zIndex: 100 }} />
        </>
      )}
    </AbsoluteFill>
  );
};

export { PREMIUM_CALM };
