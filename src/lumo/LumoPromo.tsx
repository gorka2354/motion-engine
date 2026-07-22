import React from "react";
import { theme } from "../theme";
import { FilmGrade } from "../lib/FilmGrade";
import {
  FloatingPhonePromo,
  FLOATING_PHONE_DURATION,
  HOME_BTN_Y,
  type StagePreset,
} from "../v2/FloatingPhonePromo";
import { TapDot } from "../v2/TapDot";
import type { PromoProps, ScreenName } from "../v2/promoSchema";
import { LumoWordmark } from "./LumoArt";
import { LumoHome } from "./screens/LumoHome";
import { LumoProfile } from "./screens/LumoProfile";
import { LumoLibrary } from "./screens/LumoLibrary";
import { LumoPath } from "./screens/LumoPath";
import { LumoQuiz } from "./screens/LumoQuiz";
import { LumoTools } from "./screens/LumoTools";

export const LUMO_DURATION = FLOATING_PHONE_DURATION; // 44s @ 30fps

const L = theme.lumo;

/** Lumo dark stage, mapped from the theme preset into the engine's StagePreset. */
const LUMO_STAGE: StagePreset = {
  bg: L.bg,
  vignette: L.vignette,
  blobA: L.blobA,
  blobB: L.blobB,
  text: L.text,
  textMuted: L.textMuted,
  accent: L.accent,
  scrim: L.scrim,
  phoneGlow: L.phoneGlow,
  accentSolid: L.ctaGradient,
  ctaGlow: L.ctaGlow,
};

/** Lumo product screens the scene map navigates between. */
const LUMO_SCREENS: Record<ScreenName, React.ReactNode> = {
  home: (
    <>
      <LumoHome />
      <TapDot x="50%" y={HOME_BTN_Y} from={112} pressAt={132} to={150} />
    </>
  ),
  profile: <LumoProfile />,
  library: <LumoLibrary />,
  path: <LumoPath />,
  quiz: <LumoQuiz deep />,
  tools: <LumoTools deep />,
};

/**
 * Lumo master — a second brand on the reusable FloatingPhonePromo engine.
 * Fictional EdTech product; all content is original. Storyline = lumo.map.ts.
 */
export const LumoPromo: React.FC<PromoProps> = (props) => (
  <FloatingPhonePromo
    {...props}
    screens={LUMO_SCREENS}
    stage={LUMO_STAGE}
    wordmark={(height) => <LumoWordmark height={height} />}
    cert={{
      logo: <LumoWordmark height={22} color={theme.color.ink} />,
      courseTitle: "Prompt Engineering Foundations",
      awardedTo: "Awarded to Alex · lumo.app",
    }}
  />
);

/**
 * The same promo through the cinematic finishing pass — grain, vignette, grade, a slow light leak.
 * A SEPARATE composition on purpose: the shipped LumoPromo keeps its golden baseline (Δ=0), and
 * this is the premium variant to compare against and to render for portfolio.
 */
export const LumoPromoPremium: React.FC<PromoProps> = (props) => (
  <FilmGrade leakColor="150, 190, 255">
    <LumoPromo {...props} />
  </FilmGrade>
);
