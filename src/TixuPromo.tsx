import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { theme } from "./theme";
import { TransitionFX } from "./components/TransitionFX";
import { SceneHook } from "./scenes/SceneHook";
import { SceneProfile } from "./scenes/SceneProfile";
import { ScenePath } from "./scenes/ScenePath";
import { SceneLessonQuiz } from "./scenes/SceneLessonQuiz";
import { SceneAiTools } from "./scenes/SceneAiTools";
import { SceneCta } from "./scenes/SceneCta";

const W = 1080;
const H = 1920;
const spring = (d: number) => springTiming({ durationInFrames: d, config: { damping: 200 } });

export const SCENE_DURATIONS = {
  hook: 100,
  profile: 182,
  path: 196,
  quiz: 190,
  tools: 196,
  cta: 156,
} as const;

// Transition durations (one per cut) + the accent colour for each cut's FX.
const TDUR = [26, 26, 24, 30, 28];
const TACCENT = [theme.color.primary, theme.color.primary, theme.color.green, theme.color.primary, theme.color.primary];

const SCENE_ORDER = [
  SCENE_DURATIONS.hook,
  SCENE_DURATIONS.profile,
  SCENE_DURATIONS.path,
  SCENE_DURATIONS.quiz,
  SCENE_DURATIONS.tools,
  SCENE_DURATIONS.cta,
];

export const TIXU_PROMO_DURATION =
  SCENE_ORDER.reduce((a, b) => a + b, 0) - TDUR.reduce((a, b) => a + b, 0);

// Timeline frame where each transition's overlap begins (for placing the FX).
const BOUNDARIES: { start: number; dur: number; accent: string }[] = [];
{
  let acc = 0;
  for (let i = 0; i < TDUR.length; i++) {
    const start = acc + SCENE_ORDER[i] - TDUR[i];
    BOUNDARIES.push({ start, dur: TDUR[i], accent: TACCENT[i] });
    acc = start;
  }
}

/** The full ~30s master: 6 scenes, 5 distinct transitions, extra FX on every cut. */
export const TixuPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <SceneHook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={spring(TDUR[0])} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.profile}>
          <SceneProfile />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={spring(TDUR[1])} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.path}>
          <ScenePath />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: TDUR[2] })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.quiz}>
          <SceneLessonQuiz />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={flip({ direction: "from-right" })} timing={spring(TDUR[3])} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.tools}>
          <SceneAiTools />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({ width: W, height: H })} timing={linearTiming({ durationInFrames: TDUR[4] })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <SceneCta />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* extra flair layered on top of each cut */}
      {BOUNDARIES.map((b, i) => {
        const fxDur = b.dur + 14;
        return (
          <Sequence key={`fx${i}`} from={b.start - 5} durationInFrames={fxDur}>
            <TransitionFX durationInFrames={fxDur} accent={b.accent} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
