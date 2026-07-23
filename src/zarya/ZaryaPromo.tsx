import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { Z, FONT } from "./zarya.style";
import { clamp01, window01 } from "../v2/anim";
import { Grain } from "../lib/Grain";
import { FilmGrade } from "../lib/FilmGrade";
import { Music, Sfx } from "../lib/sound";
import { Starfield } from "./space/Starfield";
import { PixelWordmark } from "./space/PixelWordmark";
import { PixelRocket } from "./space/PixelRocket";
import { Icon, Diamond } from "./ui/icons";
import { ProductAct, PRODUCT_DURATION, T } from "./ProductAct";

// ── timing (LOCKED exact ints; durations-math test asserts DURATION) ──
export const XFADE = 18;
export const SCENES = { hook: 120, product: PRODUCT_DURATION, benefits: 150, cta: 170 } as const;
export const ZARYA_PROMO_DURATION =
  SCENES.hook + SCENES.product + SCENES.benefits + SCENES.cta - 3 * XFADE; // 1676

// composition-absolute scene starts (each pulls back one XFADE per prior transition)
export const START = {
  hook: 0,
  product: SCENES.hook - XFADE, // 102
  benefits: SCENES.hook + SCENES.product - 2 * XFADE, // 1374
  cta: SCENES.hook + SCENES.product + SCENES.benefits - 3 * XFADE, // 1506
} as const;

/** Deep-space stage — bg + drifting nebula + vignette + starfield. Continuous behind every cut. */
export const SpaceStage: React.FC<{ starOpacity?: number; children?: React.ReactNode }> = ({ starOpacity = 1, children }) => {
  const f = useCurrentFrame();
  const ax = 38 + Math.sin(f / 90) * 6;
  const ay = 30 + Math.cos(f / 110) * 4;
  const bx = 66 + Math.cos(f / 78) * 5;
  return (
    <AbsoluteFill style={{ background: Z.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(46% 40% at ${ax}% ${ay}%, rgba(226,35,26,0.13), transparent 66%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(40% 34% at ${bx}% 74%, rgba(224,177,90,0.09), transparent 70%)` }} />
      <Starfield opacity={starOpacity} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 92% at 50% 42%, transparent 52%, rgba(0,0,0,0.55) 100%)" }} />
      {children}
    </AbsoluteFill>
  );
};

// ── ACT 1: hook — brand entrance ──
const HookScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const P = height > width; // portrait
  const w = spring({ frame: f, fps, config: { damping: 16, stiffness: 150, mass: 0.9 } });
  const subW = window01(f, 22, 200, 16, 12);
  const promptW = window01(f, 40, 200, 16, 12);
  const caret = Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
      <div style={{ transform: `translateY(${(1 - Math.min(1, w)) * 40}px) scale(${0.9 + Math.min(1, w) * 0.1})`, opacity: clamp01(w) }}>
        <PixelWordmark size={P ? 92 : 150} glow />
      </div>
      <div style={{ opacity: subW.opacity, transform: `translateY(${(1 - subW.enter) * 14}px)`, textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: FONT.tech, fontSize: P ? 22 : 30, letterSpacing: "0.24em", color: Z.accent2 }}>КОСМИЧЕСКИЙ CLI-АГЕНТ</div>
        <div style={{ fontFamily: FONT.ui, fontSize: P ? 18 : 22, letterSpacing: "0.04em", color: Z.fgDim }}>A new dawn for your terminal</div>
      </div>
      {/* ghosted terminal prompt — reads "AI terminal" instantly */}
      <div style={{ opacity: promptW.opacity * 0.72, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT.mono, fontSize: 19, marginTop: 6 }}>
        <span style={{ color: Z.termCyan }}>PS</span>
        <span style={{ color: Z.fgFaint }}>~\zarya</span>
        <span style={{ color: Z.accent2 }}>❯</span>
        {caret && <span style={{ width: 11, height: 22, background: Z.accent2, display: "inline-block", opacity: 0.9 }} />}
      </div>
    </AbsoluteFill>
  );
};

// ── ACT 3: benefits — the anti-cloud-terminal pitch, 4 plates with hierarchy ──
const BENEFITS: Array<{ lead?: boolean; title: string; sub: string; icon: "lock" | "blocks" | "bolt" | "code" }> = [
  { lead: true, title: "100% ЛОКАЛЬНО", sub: "весь код и данные — на твоей машине", icon: "lock" },
  { lead: true, title: "БЕЗ АККАУНТА · БЕЗ ТЕЛЕМЕТРИИ", sub: "ничего не уходит наружу", icon: "blocks" },
  { title: "СВОЙ КЛЮЧ", sub: "Anthropic · OpenAI · Ollama · OpenAI-compatible", icon: "bolt" },
  { title: "MIT · ОТКРЫТЫЙ КОД", sub: "работает даже офлайн (Ollama)", icon: "code" },
];
const BenefitsScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const P = height > width; // portrait
  const head = window01(f, 6, 100000, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: P ? 26 : 34 }}>
      <div style={{ opacity: head.opacity, transform: `translateY(${(1 - head.enter) * 16}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.tech, fontSize: P ? 20 : 26, letterSpacing: "0.2em", color: Z.accent }}>ТВОЙ ТЕРМИНАЛ · ТВОЯ МАШИНА</div>
        <div style={{ fontFamily: FONT.pixel, fontSize: P ? 42 : 66, color: Z.fg, marginTop: 12, letterSpacing: "0.02em" }}>Всё остаётся у тебя</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: P ? "1fr" : "1fr 1fr", gap: P ? 14 : 20, width: P ? 900 : 1180 }}>
        {BENEFITS.map((b, i) => {
          const w = clamp01(spring({ frame: f - (30 + i * 10), fps, config: { damping: 20, stiffness: 150 } }));
          return (
            <div
              key={b.title}
              style={{
                opacity: w,
                transform: `translateY(${(1 - w) * 24}px) scale(${0.96 + w * 0.04})`,
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: b.lead ? "28px 30px" : "22px 30px",
                borderRadius: 14,
                background: Z.bgElev1,
                border: `1px solid ${b.lead ? Z.borderStrong : Z.border}`,
                boxShadow: b.lead ? "0 20px 44px -22px rgba(226,35,26,0.35)" : "none",
              }}
            >
              <span style={{ width: 46, height: 46, borderRadius: 10, background: "rgba(226,35,26,0.12)", border: `1px solid ${Z.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: Z.accent, flexShrink: 0 }}>
                <Icon name={b.icon} size={24} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT.tech, fontSize: b.lead ? 26 : 22, letterSpacing: "0.06em", color: Z.fg }}>{b.title}</div>
                <div style={{ fontFamily: FONT.ui, fontSize: 15, color: Z.fgDim, marginTop: 4 }}>{b.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── ACT 4: CTA ──
const CtaScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const P = height > width; // portrait
  const w = spring({ frame: f, fps, config: { damping: 16, stiffness: 140, mass: 0.9 } });
  const btn = clamp01(spring({ frame: f - 26, fps, config: { damping: 18, stiffness: 150 } }));
  const sub = window01(f, 20, 100000, 16, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
      <div style={{ position: "absolute", top: P ? "20%" : "16%", opacity: clamp01(w) * 0.9 }}>
        <PixelRocket size={P ? 88 : 108} glow />
      </div>
      <div style={{ transform: `scale(${0.9 + Math.min(1, w) * 0.1})`, opacity: clamp01(w), marginTop: 40 }}>
        <PixelWordmark size={P ? 92 : 132} glow />
      </div>
      <div style={{ opacity: sub.opacity, fontFamily: FONT.tech, fontSize: P ? 18 : 26, letterSpacing: "0.2em", color: Z.accent2, textAlign: "center" }}>A NEW DAWN FOR YOUR TERMINAL</div>
      <div style={{ opacity: btn, transform: `translateY(${(1 - btn) * 16}px)`, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: P ? "13px 22px" : "16px 34px", borderRadius: 10, background: Z.accentGrad, boxShadow: Z.ctaGlow }}>
          <Diamond size={P ? 7 : 9} color="#fff2ec" />
          <span style={{ fontFamily: FONT.mono, fontSize: P ? 16 : 24, fontWeight: 700, color: "#fff2ec", letterSpacing: "0.02em" }}>github.com/gorka2354/zarya-terminal</span>
        </div>
      </div>
      <div style={{ opacity: btn * 0.8, fontFamily: FONT.ui, fontSize: P ? 14 : 16, color: Z.fgFaint, marginTop: 2 }}>Windows · macOS · Linux · MIT · Electron</div>
    </AbsoluteFill>
  );
};

// ── sound layer (composition-absolute cues from START.product + local T) ──
const A = START.product;
const Snd: React.FC = () => (
  <>
    <Music
      src={staticFile("audio/bed.wav")}
      peak={0.42}
      fadeIn={22}
      fadeOut={50}
      duckAround={[
        { at: A + T.rocketStart, depth: 0.35 },
        { at: A + T.rocketStart + 20, depth: 0.6, hold: 20, tail: 28 },
        { at: A + T.glitch, depth: 0.7, hold: 30, tail: 10 },
        { at: A + T.dawn, depth: 0.4, hold: 30, tail: 30 },
        { at: A + T.marker, depth: 0.5, hold: 20, tail: 24 },
        { at: START.benefits, depth: 0.4 },
        { at: START.cta, depth: 0.4 },
      ]}
    />
    <Sfx clip="whoosh" at={6} volume={0.3} playbackRate={0.9} />
    {/* unified-bar typing ticks */}
    <Sfx clip="typeTick" at={A + T.type1 + 6} volume={0.3} />
    <Sfx clip="typeTick" at={A + T.type1 + 20} volume={0.3} />
    <Sfx clip="typeTick" at={A + T.type2 + 6} volume={0.3} />
    <Sfx clip="typeTick" at={A + T.type2 + 22} volume={0.3} />
    <Sfx clip="typeTick" at={A + T.type3 + 6} volume={0.3} />
    <Sfx clip="typeTick" at={A + T.askType + 8} volume={0.3} />
    <Sfx clip="typeTick" at={A + T.askType + 26} volume={0.3} />
    {/* terminal blocks */}
    <Sfx clip="tap" at={A + T.cmd1} />
    <Sfx clip="pop" at={A + T.cmd1 + 2} volume={0.4} />
    <Sfx clip="tap" at={A + T.cmd2} />
    <Sfx clip="pop" at={A + T.cmd2 + 2} volume={0.4} />
    <Sfx clip="tap" at={A + T.cmd3} />
    <Sfx clip="select" at={A + T.navDown} volume={0.4} />
    <Sfx clip="success" at={A + T.rerun} volume={0.5} />
    {/* agent (inline reply) → bar morphs into the choice selector */}
    <Sfx clip="sheet" at={A + T.agentIn} volume={0.4} />
    <Sfx clip="pop" at={A + T.patch} volume={0.5} />
    <Sfx clip="morph" at={A + T.qMorph} volume={0.55} />
    <Sfx clip="select" at={A + T.qPick} volume={0.6} />
    {/* launch pad → countdown → liftoff */}
    <Sfx clip="sheet" at={A + T.lpIn} volume={0.45} />
    <Sfx clip="select" at={A + T.pickOpus} />
    <Sfx clip="select" at={A + T.thrustUp} />
    <Sfx clip="confirm" at={A + T.pusk} volume={0.6} />
    <Sfx clip="countTick" at={A + T.rocketStart} volume={0.5} />
    <Sfx clip="countTick" at={A + T.rocketStart + 10} volume={0.5} />
    <Sfx clip="countTick" at={A + T.rocketStart + 20} volume={0.5} />
    <Sfx clip="rumble" at={A + T.rocketStart + 26} volume={0.48} />
    <Sfx clip="success" at={A + T.rocketStart + 30} volume={0.64} />
    {/* hero: power-loss → dawn → restore */}
    <Sfx clip="powerDown" at={A + T.glitch} volume={0.56} />
    <Sfx clip="powerUp" at={A + T.dawn} volume={0.52} />
    <Sfx clip="dawnChime" at={A + T.dawn + 10} volume={0.46} />
    <Sfx clip="success" at={A + T.marker} volume={0.52} />
    {/* features */}
    <Sfx clip="whoosh" at={A + T.ideIn} volume={0.4} />
    <Sfx clip="sheet" at={A + T.histIn} volume={0.4} />
    <Sfx clip="select" at={A + T.themeIn} volume={0.4} />
    {/* benefits + cta */}
    <Sfx clip="whoosh" at={START.benefits} volume={0.5} />
    <Sfx clip="whoosh" at={START.cta} volume={0.5} />
    <Sfx clip="confirm" at={START.cta + 26} volume={0.6} />
  </>
);

const spr = () => springTiming({ config: { damping: 26, stiffness: 100, mass: 1 }, durationInFrames: XFADE });

/** Zarya master — persistent window on a starfield, four acts stitched with ascending slides. */
export const ZaryaPromo: React.FC = () => (
  <SpaceStage>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES.hook}>
        <HookScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={spr()} />
      <TransitionSeries.Sequence durationInFrames={SCENES.product}>
        <ProductAct />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={spr()} />
      <TransitionSeries.Sequence durationInFrames={SCENES.benefits}>
        <BenefitsScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={spr()} />
      <TransitionSeries.Sequence durationInFrames={SCENES.cta}>
        <CtaScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Grain opacity={0.05} />
    <Snd />
  </SpaceStage>
);

/** The cinematic finishing pass — FilmGrade over the master, for portfolio render. */
export const ZaryaPromoPremium: React.FC = () => (
  <FilmGrade leakColor="255, 176, 120" strength={0.9}>
    <ZaryaPromo />
  </FilmGrade>
);
