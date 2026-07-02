import React from "react";
import { Composition } from "remotion";
import { SceneHook } from "./scenes/SceneHook";
import { SceneProfile } from "./scenes/SceneProfile";
import { ScenePath } from "./scenes/ScenePath";
import { SceneLessonQuiz } from "./scenes/SceneLessonQuiz";
import { SceneAiTools } from "./scenes/SceneAiTools";
import { SceneCta } from "./scenes/SceneCta";
import { TixuPromo, SCENE_DURATIONS, TIXU_PROMO_DURATION } from "./TixuPromo";
import { TixuPromoV2, V2_DURATION } from "./v2/TixuPromoV2";

const FPS = 30;
const W = 1080;
const H = 1920;

/**
 * The 30s master (TixuPromo) plus each scene registered standalone for preview
 * and still-checks while dialing in the look.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TixuPromoV2"
        component={TixuPromoV2}
        durationInFrames={V2_DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="TixuPromo"
        component={TixuPromo}
        durationInFrames={TIXU_PROMO_DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition id="SceneHook" component={SceneHook} durationInFrames={SCENE_DURATIONS.hook} fps={FPS} width={W} height={H} />
      <Composition id="SceneProfile" component={SceneProfile} durationInFrames={SCENE_DURATIONS.profile} fps={FPS} width={W} height={H} />
      <Composition id="ScenePath" component={ScenePath} durationInFrames={SCENE_DURATIONS.path} fps={FPS} width={W} height={H} />
      <Composition id="SceneLessonQuiz" component={SceneLessonQuiz} durationInFrames={SCENE_DURATIONS.quiz} fps={FPS} width={W} height={H} />
      <Composition id="SceneAiTools" component={SceneAiTools} durationInFrames={SCENE_DURATIONS.tools} fps={FPS} width={W} height={H} />
      <Composition id="SceneCta" component={SceneCta} durationInFrames={SCENE_DURATIONS.cta} fps={FPS} width={W} height={H} />
    </>
  );
};
