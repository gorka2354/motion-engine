import React from "react";
import { Composition } from "remotion";
import { SceneHook } from "./scenes/SceneHook";
import { SceneLessonQuiz } from "./scenes/SceneLessonQuiz";

const FPS = 30;
const W = 1080;
const H = 1920;

/**
 * Compositions. For now each storyboard scene is registered standalone so we can
 * preview + render stills while dialing in the look. The 30s master (TixuPromo)
 * gets assembled from these once the look is approved.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SceneHook"
        component={SceneHook}
        durationInFrames={3 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="SceneLessonQuiz"
        component={SceneLessonQuiz}
        durationInFrames={6 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
