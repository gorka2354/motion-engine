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
import { TixuCourseTeaser, TEASER_DURATION } from "./v2/TixuCourseTeaser";
import { promoSchema } from "./v2/promoSchema";
import { PROMO_DEFAULTS } from "./v2/promo.map";
import { ShotikPromo, SHOTIK_PROMO_DURATION } from "./shotik/ShotikPromo";
import { DesktopStill } from "./shotik/DesktopStill";
import { CardFace } from "./bybit/CardFace";
import { CardBack } from "./bybit/CardBack";
import { ServiceTile } from "./bybit/ServiceTile";
import { BybitGif, BYBIT_GIF_DURATION } from "./bybit/BybitGif";
import { LibSandbox, LIB_SANDBOX_DURATION } from "./lib/LibSandbox";
import { FxSandbox, FX_SANDBOX_DURATION } from "./lib/FxSandbox";
import { InteractionSandbox, INTERACTION_SANDBOX_DURATION } from "./lib/InteractionSandbox";
import { DataSandbox, DATA_SANDBOX_DURATION } from "./lib/DataSandbox";
import { SoundSandbox, SOUND_SANDBOX_DURATION } from "./lib/SoundSandbox";
import { ThreeSandbox, THREE_SANDBOX_DURATION } from "./lib/ThreeSandbox";
import { GltfSandbox, GLTF_SANDBOX_DURATION } from "./lib/GltfSandbox";
import { Showcase3D, SHOWCASE_3D_DURATION } from "./lib/Showcase3D";
import { HeroManifest, HERO_MANIFEST_DURATION } from "./HeroManifest";
import { JumperPromo, JUMPER_PROMO_DURATION } from "./jumper/JumperPromo";
import { LumoPromo, LUMO_DURATION } from "./lumo/LumoPromo";
import { LUMO_DEFAULTS } from "./lumo/lumo.map";

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
        schema={promoSchema}
        defaultProps={PROMO_DEFAULTS}
      />
      <Composition
        id="LumoPromo"
        component={LumoPromo}
        durationInFrames={LUMO_DURATION}
        fps={FPS}
        width={W}
        height={H}
        schema={promoSchema}
        defaultProps={LUMO_DEFAULTS}
      />
      <Composition
        id="TixuCourseTeaser"
        component={TixuCourseTeaser}
        durationInFrames={TEASER_DURATION}
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
      <Composition id="ShotikPromo" component={ShotikPromo} durationInFrames={SHOTIK_PROMO_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="ShotikDesktopStill" component={DesktopStill} durationInFrames={1} fps={FPS} width={1408} height={880} />
      <Composition id="BybitCardFace" component={CardFace} durationInFrames={1} fps={FPS} width={860} height={540} />
      <Composition id="BybitCardBack" component={CardBack} durationInFrames={1} fps={FPS} width={860} height={540} />
      <Composition id="BybitServiceTile" component={ServiceTile} durationInFrames={5} fps={FPS} width={520} height={520} />
      {/* +2 warm-up frames: the FIRST frame painted by the render browser has
          off reflections (per-browser GL warm-up — it follows the first
          painted frame, so --frames offsets DON'T dodge it). Render all 302
          frames, then drop the first 2 in ffmpeg; motion is 300-periodic, so
          frames 2..301 loop just as seamlessly. */}
      <Composition id="BybitCardGif" component={BybitGif} durationInFrames={BYBIT_GIF_DURATION + 2} fps={FPS} width={1080} height={1080} />
      <Composition id="LibSandbox" component={LibSandbox} durationInFrames={LIB_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="FxSandbox" component={FxSandbox} durationInFrames={FX_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="InteractionSandbox" component={InteractionSandbox} durationInFrames={INTERACTION_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="DataSandbox" component={DataSandbox} durationInFrames={DATA_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="SoundSandbox" component={SoundSandbox} durationInFrames={SOUND_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="ThreeSandbox" component={ThreeSandbox} durationInFrames={THREE_SANDBOX_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="GltfSandbox" component={GltfSandbox} durationInFrames={GLTF_SANDBOX_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="Showcase3D" component={Showcase3D} durationInFrames={SHOWCASE_3D_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="HeroManifest" component={HeroManifest} durationInFrames={HERO_MANIFEST_DURATION} fps={FPS} width={1080} height={1080} />
      <Composition id="JumperPromo" component={JumperPromo} durationInFrames={JUMPER_PROMO_DURATION} fps={FPS} width={W} height={H} />
    </>
  );
};
