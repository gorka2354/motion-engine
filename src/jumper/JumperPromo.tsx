// Jumper promo — a real cross-chain transfer on a dark violet brand stage.
// Structured with @remotion/transitions: each act lives in its OWN time slot and the
// stitches are explicit fade transitions, so scenes can't overlap by construction
// (kills the "text appears before the widget left" class of bug). The Swap & Bridge
// widget + "Exchange from" sheet are pixel-faithful re-creations of jumper.xyz; the
// Transfer act drives them like a real user (tap → sheet → pick network → pick token).
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  interpolate,
  Img,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme } from "../theme";
import { Grain } from "../lib/Grain";
import { Music, Sfx } from "../lib/sound";
import { springWindow, window01, kf, clamp01 } from "../v2/anim";
import { SwapWidget, ASSETS } from "./SwapWidget";
import { SelectSheet } from "./SelectSheet";

const { fontFamily: INTER } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const j = theme.jumper;

// ── scene durations + transition length; total drives the composition length ──
// beat length ∝ importance; transfer is longer so every step breathes (see gaps in
// TransferScene's T): look at the widget → look at the sheet → see the pick land.
export const SCENES = { hook: 130, transfer: 410, benefits: 200, cta: 150 };
export const XFADE = 16; // transition frames (each overlaps two scenes)
export const JUMPER_PROMO_DURATION =
  SCENES.hook + SCENES.transfer + SCENES.benefits + SCENES.cta - 3 * XFADE; // 842

// local frame timeline of the transfer flow — shared by TransferScene (visual) AND the
// sound layer (which needs these as composition-absolute frames). Single source so the
// SFX can't drift from the visual after a timing edit (footgun: hand-copied cue frames).
const T = {
  fromTap: 70, fromSheetUp: 76, fromNetTap: 120, fromTokTap: 148, fromSheetDown: 168,
  toTap: 216, toSheetUp: 222, toNetTap: 256, toTokTap: 284, toSheetDown: 304,
  sendTap: 330, amountDone: 362, routeFound: 370,
};

// composition-absolute start frame of each act (transitions overlap two scenes, so each
// start pulls back by one XFADE). Derived from SCENES so it survives duration tweaks.
const START = {
  hook: 0,
  transfer: SCENES.hook - XFADE, // 114
  benefits: SCENES.hook + SCENES.transfer - 2 * XFADE, // 508
  cta: SCENES.hook + SCENES.transfer + SCENES.benefits - 3 * XFADE, // 692
};

const GRID_CHAINS = [
  "ethereum", "arbitrum", "base", "optimism", "solana", "avalanche",
  "bitcoin", "tron", "unichain", "mode", "sui", "celo",
];

// blur-up entrance driven by a LOCAL scene frame `f`
const BlurUp: React.FC<{ f: number; from: number; to?: number; children: React.ReactNode; style?: React.CSSProperties; y?: number }> = ({ f, from, to = 100000, children, style, y = 34 }) => {
  const { fps } = useVideoConfig();
  const w = springWindow(f, fps, from, to);
  const enter = clamp01(w.enter);
  return <div style={{ opacity: w.opacity, transform: `translateY(${(1 - enter) * y}px)`, filter: `blur(${(1 - enter) * 10}px)`, ...style }}>{children}</div>;
};

const Tap: React.FC<{ f: number; at: number; x: number; y: number }> = ({ f, at, x, y }) => {
  if (f < at) return null;
  const p = clamp01((f - at) / 20);
  if (p >= 1) return null;
  const r = 14 + p * 46;
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: 999, border: `3px solid ${j.accent}`, opacity: (1 - p) * 0.85 }} />
      <div style={{ position: "absolute", left: -11, top: -11, width: 22, height: 22, borderRadius: 22, background: j.accent, opacity: (1 - p) * 0.9, boxShadow: `0 0 16px ${j.accent}` }} />
    </div>
  );
};

// ── ACT 1: hook ──
const HookScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 28, fontFamily: INTER }}>
      <BlurUp f={f} from={8}>
        <Img src={staticFile("jumper/logo.svg")} style={{ width: 360, height: "auto", filter: "drop-shadow(0 8px 40px rgba(211,92,255,0.5))" }} />
      </BlurUp>
      <BlurUp f={f} from={24}>
        <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: "-0.03em", background: j.heroGrad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Find the best route</div>
      </BlurUp>
    </AbsoluteFill>
  );
};

// ── ACT 2: the transfer, performed ──
const TransferScene: React.FC = () => {
  const f = useCurrentFrame();
  // Every step gets a beat to be seen (widget rises 0-34, then a ~1.2s look before the
  // first tap; the sheet holds so the chain list reads; each pick holds before the next).
  // From is deliberate (first time), To is a touch quicker (pattern is now familiar).
  // Flow ends ~40f before the scene so "route found / Review route" breathes before the cut.
  // T (the flow timeline) now lives at module scope — shared with the sound layer.

  // widget rises in; it does NOT exit — the scene transition handles the outro
  const wY = kf(f, [[0, 220], [34, 0]]);
  const wScale = kf(f, [[0, 0.92], [34, 1]]);
  const wOpacity = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  const from = f >= T.fromSheetDown ? ASSETS.eth : undefined;
  const to = f >= T.toSheetDown ? ASSETS.usdc : undefined;
  const amtVal = interpolate(f, [T.sendTap + 4, T.amountDone], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const amount = f > T.sendTap ? amtVal.toFixed(1) : "0";
  const usd = f > T.sendTap ? "$" + Math.round(amtVal * 3684).toLocaleString("en-US") + ".00" : "$0.00";
  const routeFound = f > T.routeFound;

  const sheet = (up: number, down: number) => {
    const y = kf(f, [[up, 1100], [up + 26, 0], [down, 0], [down + 24, 1100]]);
    const op = interpolate(f, [up, up + 14, down + 4, down + 24], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { y, op, active: f >= up && f <= down + 24 };
  };
  const fromSheet = sheet(T.fromSheetUp, T.fromSheetDown);
  const toSheet = sheet(T.toSheetUp, T.toSheetDown);

  return (
    <AbsoluteFill style={{ fontFamily: INTER }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${wY}px) scale(${wScale})`, opacity: wOpacity }}>
          <div style={{ transform: "scale(1.55)" }}>
            <SwapWidget from={from} to={to} amount={amount} usd={usd} ctaLabel={routeFound ? "Review route" : "Connect wallet"} ctaActive={routeFound} />
          </div>
        </div>
      </AbsoluteFill>

      {fromSheet.active && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `translateY(${fromSheet.y}px) scale(1.5)`, opacity: fromSheet.op }}>
            <SelectSheet title="Exchange from" highlightNet={f >= T.fromNetTap ? 0 : undefined} highlightTok={f >= T.fromTokTap ? "ETH" : undefined} />
          </div>
        </AbsoluteFill>
      )}
      {toSheet.active && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `translateY(${toSheet.y}px) scale(1.5)`, opacity: toSheet.op }}>
            <SelectSheet title="Exchange to" highlightNet={f >= T.toNetTap ? 2 : undefined} highlightTok={f >= T.toTokTap ? "USDC" : undefined} />
          </div>
        </AbsoluteFill>
      )}

      <Tap f={f} at={T.fromTap} x={410} y={880} />
      <Tap f={f} at={T.fromNetTap} x={360} y={695} />
      <Tap f={f} at={T.fromTokTap} x={430} y={1305} />
      <Tap f={f} at={T.toTap} x={690} y={880} />
      <Tap f={f} at={T.toNetTap} x={540} y={695} />
      <Tap f={f} at={T.toTokTap} x={430} y={1090} />
      <Tap f={f} at={T.sendTap} x={470} y={1075} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: "translateY(430px)", opacity: window01(f, T.routeFound + 6, SCENES.transfer + 40).opacity }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 26px", borderRadius: 100, background: "rgba(211,92,255,0.12)", border: "1px solid rgba(211,92,255,0.42)" }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: j.accent, boxShadow: `0 0 14px ${j.accent}` }} />
            <span style={{ fontSize: 34, fontWeight: 700, color: "#F4ECFF" }}>Best route found · 1 tx</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── ACT 3: benefits ──
const BenefitsScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cu = (target: number, at: number) => Math.round(interpolate(f, [at, at + 40], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, fontFamily: INTER }}>
      <BlurUp f={f} from={6} style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: j.accent, letterSpacing: "0.02em" }}>4× audited</div>
        <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginTop: 8 }}>One route.<br />Every chain.</div>
      </BlurUp>
      <div style={{ display: "flex", gap: 16 }}>
        {GRID_CHAINS.map((c, i) => {
          const w = clamp01(springWindow(f, fps, 34 + i * 5, 100000).enter);
          return <div key={c} style={{ opacity: w, transform: `scale(${w})` }}><Img src={staticFile(`jumper/chains/${c}.svg`)} style={{ width: 58, height: 58, borderRadius: 58, background: j.cardInner, padding: 8, border: `1px solid ${j.hair}` }} /></div>;
        })}
        <div style={{ width: 74, height: 74, borderRadius: 74, background: j.cardInner, border: `1px solid ${j.hair}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: j.textMuted, opacity: clamp01(springWindow(f, fps, 34 + GRID_CHAINS.length * 5, 100000).enter) }}>+54</div>
      </div>
      <div style={{ display: "flex", gap: 22, opacity: window01(f, 64, 100000).opacity }}>
        {[["66", "Chains", 64], ["31", "Bridges", 78], ["36", "DEXs", 92]].map(([n, label, at]) => (
          <div key={label as string} style={{ minWidth: 190, padding: "24px 30px", borderRadius: 22, background: j.card, border: `1px solid ${j.hair}`, textAlign: "center" }}>
            <div style={{ fontSize: 58, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{cu(Number(n), at as number)}</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: j.textMuted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── ACT 4: CTA ──
const CtaScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = springWindow(f, fps, 20, 100000);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, fontFamily: INTER }}>
      <BlurUp f={f} from={4}>
        <Img src={staticFile("jumper/logo.svg")} style={{ width: 440, height: "auto", filter: "drop-shadow(0 8px 44px rgba(211,92,255,0.55))" }} />
      </BlurUp>
      <div style={{ opacity: w.opacity, transform: `scale(${clamp01(w.enter)})` }}>
        <div style={{ padding: "22px 60px", borderRadius: 100, fontSize: 38, fontWeight: 700, color: "#FCFAFF", background: `linear-gradient(100deg, ${j.accent}, ${j.accentMid})`, boxShadow: j.ctaGlow }}>Jump in →</div>
      </div>
    </AbsoluteFill>
  );
};

// ── sound layer: bed + SFX on composition-absolute cue frames (START + local T) ──
// Lives at the ROOT (not inside the TransitionSeries) so every cue and the music share
// one absolute frame-space → ducking lines up. Cues derive from the same START/T the
// visuals use, so re-timing the flow keeps sound in sync automatically.
const A = START.transfer;
const CUE = {
  hookRise: 4, // soft riser under the logo
  cut1: START.transfer + 2, // scene cut → transfer
  fromTap: A + T.fromTap,
  fromSheet: A + T.fromSheetUp,
  fromNet: A + T.fromNetTap,
  fromTok: A + T.fromTokTap,
  toTap: A + T.toTap,
  toSheet: A + T.toSheetUp,
  toNet: A + T.toNetTap,
  toTok: A + T.toTokTap,
  send: A + T.sendTap,
  success: A + T.routeFound, // hero chime
  cut2: START.benefits - 14, // cut → benefits
  benefitsIn: START.benefits + 6,
  countUp: START.benefits + 64, // stat counters climb 64→132 (local) — sound climbs with them
  cut3: START.cta - 14, // cut → cta
  ctaBtn: START.cta + 20,
};

const JumperSound: React.FC = () => (
  <>
    <Music
      src={staticFile("audio/bed.wav")}
      peak={0.58}
      fadeIn={20}
      fadeOut={44}
      duckAround={[
        { at: CUE.cut1, depth: 0.4 },
        { at: CUE.send, depth: 0.4 },
        { at: CUE.success, depth: 0.6, hold: 12, tail: 22 },
        { at: CUE.cut2, depth: 0.4 },
        { at: CUE.cut3, depth: 0.4 },
        { at: CUE.ctaBtn, depth: 0.4 },
      ]}
    />
    <Sfx clip="whoosh" at={CUE.hookRise} volume={0.3} playbackRate={0.9} />
    <Sfx clip="whoosh" at={CUE.cut1} volume={0.6} />
    {/* From selector */}
    <Sfx clip="tap" at={CUE.fromTap} />
    <Sfx clip="sheet" at={CUE.fromSheet} />
    <Sfx clip="select" at={CUE.fromNet} />
    <Sfx clip="select" at={CUE.fromTok} />
    {/* To selector */}
    <Sfx clip="tap" at={CUE.toTap} />
    <Sfx clip="sheet" at={CUE.toSheet} />
    <Sfx clip="select" at={CUE.toNet} />
    <Sfx clip="select" at={CUE.toTok} />
    {/* confirm + result */}
    <Sfx clip="confirm" at={CUE.send} />
    <Sfx clip="success" at={CUE.success} />
    {/* benefits + cta */}
    <Sfx clip="whoosh" at={CUE.cut2} volume={0.6} />
    <Sfx clip="pop" at={CUE.benefitsIn} volume={0.4} />
    <Sfx clip="count" at={CUE.countUp} volume={0.6} />
    <Sfx clip="whoosh" at={CUE.cut3} volume={0.6} />
    <Sfx clip="confirm" at={CUE.ctaBtn} volume={0.6} />
  </>
);

// ── persistent brand background + sequenced acts ──
export const JumperPromo: React.FC = () => {
  const frame = useCurrentFrame();
  const b1x = 50 + Math.sin(frame / 80) * 8;
  const b1y = 32 + Math.cos(frame / 95) * 5;
  const b2x = 62 + Math.cos(frame / 70) * 7;
  // spring timing (not linear) → transitions ease with life instead of a robotic slide
  const spring = () => springTiming({ config: { damping: 26, stiffness: 100, mass: 1 }, durationInFrames: XFADE });

  return (
    <AbsoluteFill style={{ background: j.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(46% 34% at ${b1x}% ${b1y}%, rgba(211,92,255,0.20), transparent 68%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(40% 30% at ${b2x}% 74%, rgba(101,60,162,0.22), transparent 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 54%, rgba(0,0,0,0.5) 100%)" }} />

      <TransitionSeries>
        {/* varied directions so the cuts don't feel like one repeated motion */}
        <TransitionSeries.Sequence durationInFrames={SCENES.hook}><HookScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={spring()} />
        <TransitionSeries.Sequence durationInFrames={SCENES.transfer}><TransferScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={spring()} />
        <TransitionSeries.Sequence durationInFrames={SCENES.benefits}><BenefitsScene /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-top" })} timing={spring()} />
        <TransitionSeries.Sequence durationInFrames={SCENES.cta}><CtaScene /></TransitionSeries.Sequence>
      </TransitionSeries>

      <Grain opacity={0.05} />
      <JumperSound />
    </AbsoluteFill>
  );
};
