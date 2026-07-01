import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SceneHook } from "./scenes/SceneHook";
import { SceneProfile } from "./scenes/SceneProfile";
import { ScenePath } from "./scenes/ScenePath";
import { SceneLessonQuiz } from "./scenes/SceneLessonQuiz";
import { SceneAiTools } from "./scenes/SceneAiTools";
import { SceneCta } from "./scenes/SceneCta";

// Transition overlap between scenes.
const T = 16;

export const SCENE_DURATIONS = {
  hook: 100,
  profile: 170,
  path: 186,
  quiz: 186,
  tools: 186,
  cta: 150,
} as const;

// TransitionSeries total = sum(sequences) - sum(transitions).
const SUM = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);
export const TIXU_PROMO_DURATION = SUM - 5 * T; // 898 frames ≈ 29.9s @30fps

const cross = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: T })}
  />
);

/** The full 30s master: 6 scenes crossfading into one another. */
export const TixuPromo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
        <SceneHook />
      </TransitionSeries.Sequence>
      {cross}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.profile}>
        <SceneProfile />
      </TransitionSeries.Sequence>
      {cross}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.path}>
        <ScenePath />
      </TransitionSeries.Sequence>
      {cross}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.quiz}>
        <SceneLessonQuiz />
      </TransitionSeries.Sequence>
      {cross}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.tools}>
        <SceneAiTools />
      </TransitionSeries.Sequence>
      {cross}
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
        <SceneCta />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
