import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";
import { HomeResumeScreen } from "../screens/HomeResumeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { PathScreen } from "../screens/PathScreen";
import { LessonQuizScreen } from "../screens/LessonQuizScreen";
import { AiToolsScreen } from "../screens/AiToolsScreen";
import { TapDot } from "./TapDot";
import {
  FloatingPhonePromo,
  FLOATING_PHONE_DURATION,
  HOME_BTN_Y,
  type StagePreset,
} from "./FloatingPhonePromo";
import type { PromoProps, ScreenName } from "./promoSchema";

export const V2_DURATION = FLOATING_PHONE_DURATION; // 44s @ 30fps

/** tixu dark stage — the original inc-3 craft-pass palette. */
const TIXU_STAGE: StagePreset = {
  bg: theme.dark.bg,
  vignette: theme.dark.vignette,
  blobA: theme.color.primary,
  blobB: theme.color.primaryDeep,
  text: theme.dark.text,
  textMuted: theme.dark.textMuted,
  accent: theme.dark.accent,
  scrim: theme.dark.scrim,
  phoneGlow: theme.dark.phoneGlow,
  accentSolid: theme.color.primary,
  ctaGlow: theme.shadow.ctaGlow,
};

/** tixu product screens the scene map navigates between. */
const TIXU_SCREENS: Record<ScreenName, React.ReactNode> = {
  home: (
    <>
      <HomeResumeScreen />
      <TapDot x="50%" y={HOME_BTN_Y} from={112} pressAt={132} to={150} />
    </>
  ),
  profile: <ProfileScreen />,
  library: <LibraryScreen />,
  path: <PathScreen />,
  quiz: <LessonQuizScreen deep />,
  tools: <AiToolsScreen deep />,
};

/**
 * V2 master (tixu.ai) — a thin wrapper over the reusable FloatingPhonePromo
 * engine. Everything tixu-specific (screens, dark palette, wordmark image,
 * certificate content) is supplied here; the storyline stays data (PromoProps
 * / promo.map.ts). See src/lumo for a second brand on the same engine.
 */
export const TixuPromoV2: React.FC<PromoProps> = (props) => (
  <FloatingPhonePromo
    {...props}
    screens={TIXU_SCREENS}
    stage={TIXU_STAGE}
    wordmark={(height) => (
      <Img
        src={staticFile(props.brand.logo)}
        style={{ height, filter: "brightness(0) invert(1)" }}
      />
    )}
    cert={{
      logo: <Img src={staticFile("logo.svg")} style={{ height: 26 }} />,
      courseTitle: "Claude Advanced Workflows",
      awardedTo: "Awarded to Denis · tixu.ai",
    }}
  />
);
