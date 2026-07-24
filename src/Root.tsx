import React from "react";
import { Composition } from "remotion";
import { promoSchema } from "./v2/promoSchema";
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
import { LaptopGlbBench, LaptopFactoryBench, LAPTOP_BENCH_DURATION } from "./models/laptop/LaptopBench";
import { GamepadBench, GAMEPAD_BENCH_DURATION } from "./models/gamepad/GamepadBench";
import { PhoneBench, PHONE_BENCH_DURATION } from "./models/phone/PhoneBench";
import { RemoteBench, REMOTE_BENCH_DURATION } from "./models/remote/RemoteBench";
import { PhoneHero, PHONE_HERO_DURATION } from "./models/phone/PhoneHero";
import { HeroManifest, HERO_MANIFEST_DURATION } from "./HeroManifest";
import { JumperPromo, JUMPER_PROMO_DURATION } from "./jumper/JumperPromo";
import { LumoPromo, LumoPromoPremium, LUMO_DURATION } from "./lumo/LumoPromo";
import { LumoStyled, lumoStyledSchema, PREMIUM_CALM } from "./lumo/LumoStyled";
import { LUMO_DEFAULTS } from "./lumo/lumo.map";
import { LevelUpCreative, LEVELUP_DURATION } from "./creative/LevelUpCreative";
import { LevelUpCreativeV2, LEVELUP2_DURATION } from "./creative/LevelUpCreativeV2";
import { LevelUpMorph, LEVELUP_MORPH_DURATION } from "./creative/LevelUpMorph";
import { ZaryaPromo, ZaryaPromoPremium, ZARYA_PROMO_DURATION } from "./zarya/ZaryaPromo";

const FPS = 30;
const W = 1080;
const H = 1920;

/**
 * Composition registry, grouped by purpose:
 *   1. Product promos     — the finished, portfolio-facing videos.
 *   2. Stills              — building blocks rendered standalone (card faces, desktop still).
 *   3. Engine sandboxes    — dev benches for the src/lib toolkit primitives.
 *   4. 3D benches          — @remotion/three pipeline test stands.
 * Registration order is cosmetic (only affects the Studio sidebar) — each
 * composition renders independently.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── 1. Product promos ─────────────────────────────────────────── */}
      {/* The floating-phone engine: dark stage, camera rig, data-driven (schema + defaultProps). */}
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
      {/* Same promo through the cinematic finishing pass (FilmGrade) — premium variant for portfolio. */}
      <Composition
        id="LumoPromoPremium"
        component={LumoPromoPremium}
        durationInFrames={LUMO_DURATION}
        fps={FPS}
        width={W}
        height={H}
        schema={promoSchema}
        defaultProps={LUMO_DEFAULTS}
      />
      {/* Same Lumo timeline through a StylePreset's finish/palette — the "N styles from one
          timeline" flagship. Render variants with --props='{"style": <preset>}'. */}
      <Composition
        id="LumoStyled"
        component={LumoStyled}
        durationInFrames={LUMO_DURATION}
        fps={FPS}
        width={W}
        height={H}
        schema={lumoStyledSchema}
        defaultProps={{ style: PREMIUM_CALM }}
      />
      {/* Jumper — cross-chain bridge promo, authored from a URL (TransitionSeries). */}
      <Composition id="JumperPromo" component={JumperPromo} durationInFrames={JUMPER_PROMO_DURATION} fps={FPS} width={W} height={H} />
      {/* Shotik — 16:9 brand preset, LaptopFrame, MagicMove chain as the transition language. */}
      <Composition id="ShotikPromo" component={ShotikPromo} durationInFrames={SHOTIK_PROMO_DURATION} fps={FPS} width={1920} height={1080} />
      {/* Zarya — AI terminal, Soviet space-age. Persistent window on a starfield, TransitionSeries acts. */}
      <Composition id="ZaryaPromo" component={ZaryaPromo} durationInFrames={ZARYA_PROMO_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="ZaryaPromoPremium" component={ZaryaPromoPremium} durationInFrames={ZARYA_PROMO_DURATION} fps={FPS} width={1920} height={1080} />
      {/* 9:16 social cut — the SAME aspect-responsive component re-laid-out for portrait (own scale/camera, captions lifted into the lower band). */}
      <Composition id="ZaryaPromoV" component={ZaryaPromo} durationInFrames={ZARYA_PROMO_DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="ZaryaPromoVPremium" component={ZaryaPromoPremium} durationInFrames={ZARYA_PROMO_DURATION} fps={FPS} width={1080} height={1920} />
      {/* Level-Up — crypto RPG creative, AI-generated footage (ai-gen layer) under a Remotion UI. */}
      <Composition id="LevelUpCreative" component={LevelUpCreative} durationInFrames={LEVELUP_DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="LevelUpCreativeV2" component={LevelUpCreativeV2} durationInFrames={LEVELUP2_DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="LevelUpMorph" component={LevelUpMorph} durationInFrames={LEVELUP_MORPH_DURATION} fps={FPS} width={1080} height={1920} />
      {/* +2 warm-up frames: the FIRST frame painted by the render browser has
          off reflections (per-browser GL warm-up — it follows the first
          painted frame, so --frames offsets DON'T dodge it). Render all 302
          frames, then drop the first 2 in ffmpeg; motion is 300-periodic, so
          frames 2..301 loop just as seamlessly. */}
      <Composition id="BybitCardGif" component={BybitGif} durationInFrames={BYBIT_GIF_DURATION + 2} fps={FPS} width={1080} height={1080} />
      <Composition id="HeroManifest" component={HeroManifest} durationInFrames={HERO_MANIFEST_DURATION} fps={FPS} width={1080} height={1080} />

      {/* ── 2. Stills (building blocks, rendered standalone) ───────────── */}
      <Composition id="ShotikDesktopStill" component={DesktopStill} durationInFrames={1} fps={FPS} width={1408} height={880} />
      <Composition id="BybitCardFace" component={CardFace} durationInFrames={1} fps={FPS} width={860} height={540} />
      <Composition id="BybitCardBack" component={CardBack} durationInFrames={1} fps={FPS} width={860} height={540} />
      <Composition id="BybitServiceTile" component={ServiceTile} durationInFrames={5} fps={FPS} width={520} height={520} />

      {/* ── 3. Engine sandboxes (dev benches for src/lib primitives) ───── */}
      <Composition id="LibSandbox" component={LibSandbox} durationInFrames={LIB_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="FxSandbox" component={FxSandbox} durationInFrames={FX_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="InteractionSandbox" component={InteractionSandbox} durationInFrames={INTERACTION_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="DataSandbox" component={DataSandbox} durationInFrames={DATA_SANDBOX_DURATION} fps={FPS} width={W} height={H} />
      <Composition id="SoundSandbox" component={SoundSandbox} durationInFrames={SOUND_SANDBOX_DURATION} fps={FPS} width={W} height={H} />

      {/* ── 4. 3D benches (@remotion/three pipeline) ──────────────────── */}
      <Composition id="ThreeSandbox" component={ThreeSandbox} durationInFrames={THREE_SANDBOX_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="GltfSandbox" component={GltfSandbox} durationInFrames={GLTF_SANDBOX_DURATION} fps={FPS} width={1920} height={1080} />
      <Composition id="Showcase3D" component={Showcase3D} durationInFrames={SHOWCASE_3D_DURATION} fps={FPS} width={1920} height={1080} />
      {/* A/B stand for the two model sources — same rig, flat backdrop, so a
          fidelity diff measures the model itself. Square keeps the subject big. */}
      <Composition id="LaptopGlbBench" component={LaptopGlbBench} durationInFrames={LAPTOP_BENCH_DURATION} fps={FPS} width={1080} height={1080} />
      <Composition id="LaptopFactoryBench" component={LaptopFactoryBench} durationInFrames={LAPTOP_BENCH_DURATION} fps={FPS} width={1080} height={1080} />
      {/* photo-sourced model: traced from a single product shot, no GLB counterpart */}
      <Composition id="GamepadBench" component={GamepadBench} durationInFrames={GAMEPAD_BENCH_DURATION} fps={FPS} width={1080} height={1080} />
      <Composition id="PhoneBench" component={PhoneBench} durationInFrames={PHONE_BENCH_DURATION} fps={FPS} width={1080} height={1080} />
      <Composition id="RemoteBench" component={RemoteBench} durationInFrames={REMOTE_BENCH_DURATION} fps={FPS} width={1080} height={1080} />
      {/* beauty rig: studio softboxes + contact shadow. Separate comp because a gradient
          backdrop and a floor shadow would corrupt check-fidelity silhouette measurement. */}
      <Composition id="PhoneHero" component={PhoneHero} durationInFrames={PHONE_HERO_DURATION} fps={FPS} width={1080} height={1080} />
    </>
  );
};
