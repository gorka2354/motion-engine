import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { clamp01, springWindow } from "../v2/anim";
import { Grain, TapPulse } from "../lib";
import { Music, Sfx } from "../lib/sound";

/**
 * "RPG level-up" — MORPH cut (v3). Instead of splicing separate clips, each level-up is a
 * continuous keyframe MORPH (start→end image-to-video via our ai-gen layer): the hero taps
 * his phone and his outfit + the whole scene visibly transform on him in one shot — the
 * "magic of levelling up", no montage seam. Two ~7s morph segments (pause → TAP → morph →
 * reaction), UI/tap-pulses/count-up synced to the morph moments, warm grade to golden hour,
 * phone slips into pocket at the end. ~14s, 9:16.
 */

export const LEVELUP_MORPH_DURATION = 420; // 14s @ 30fps

/** Two morph segments back to back (public/levelup2). */
const CLIPS = [
  { src: "levelup2/seg1-morph.mp4", from: 0, dur: 210 }, // Lv.1 → Lv.30 (hoodie → jacket)
  { src: "levelup2/seg2-morph.mp4", from: 210, dur: 210 }, // Lv.30 → final (jacket → overcoat)
];

/** Level lands ON the morph moment of each segment (~4s into each 7s clip). */
const LEVELS = [
  { at: 0, level: 1, xp: 0.14 },
  { at: 120, level: 30, xp: 0.5 },
  { at: 330, level: 62, xp: 0.92 },
] as const;

const TAPS = [100, 310]; // the trigger tap, just before each morph
const BEATS = [120, 330]; // morph moments — burst + LEVEL UP + count-up fire here

const GOLD = "#FFCE3A";
const GOLD_HI = "#FFF1B0";
const GOLD_DK = "#C8901A";
const XP_A = "#39E6A6";
const XP_B = "#22C3FF";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const LevelUpMorph: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const idx = Math.max(0, LEVELS.map((l) => l.at).filter((a) => f >= a).length - 1);
  const cur = LEVELS[idx];
  const beatStart = cur.at;
  const prevLevel = idx === 0 ? 0 : LEVELS[idx - 1].level;

  const p = clamp01((f - beatStart) / 30);
  const xpFill = interpolate(p, [0, 1], [idx === 0 ? 0 : 0.06, cur.xp], { extrapolateRight: "clamp" });

  const rollP = idx === 0 ? 1 : easeOutCubic(clamp01((f - beatStart) / 18));
  const shownLevel = Math.round(prevLevel + (cur.level - prevLevel) * rollP);

  const burst = BEATS.reduce((a, b) => (f >= b && f < b + 22 ? Math.max(a, clamp01((f - b) / 22)) : a), 0);
  const burstBell = Math.sin(clamp01(burst) * Math.PI);

  const pop = springWindow(f, fps, beatStart, beatStart + 30).enter;
  const lvlScale = (1 + 0.3 * (1 - clamp01(pop))) * (1 + 0.14 * burstBell);

  // warm golden-hour grade ramps over the final segment
  const warm = clamp01((f - 300) / 60);

  // LEVEL UP text fires on the taps (leads into the morph)
  const luText = TAPS.reduce((a, c) => {
    const w = f >= c && f < c + 30 ? springWindow(f, fps, c, c + 30) : null;
    return w ? Math.max(a, w.opacity) : a;
  }, 0);
  const luEnter = TAPS.reduce((a, c) => {
    const w = f >= c && f < c + 30 ? springWindow(f, fps, c, c + 30).enter : 0;
    return Math.max(a, w);
  }, 0);

  return (
    <AbsoluteFill style={{ background: "#0A0A0C", fontFamily: theme.font.stack }}>
      {/* ── morph segments ── */}
      {CLIPS.map((c) => (
        <Sequence key={c.src} from={c.from} durationInFrames={c.dur}>
          <OffthreadVideo src={staticFile(c.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
      ))}

      {warm > 0 ? <AbsoluteFill style={{ background: `rgba(255,150,60,${0.14 * warm})`, pointerEvents: "none" }} /> : null}

      <Grain opacity={0.08} frequency={0.8} blend="soft-light" />

      {/* tap-pulse — the trigger. Ripple over the phone hand (lower-centre), from the same
          progress as the tap SFX so they read as one action (interaction footgun #5). */}
      {TAPS.map((t) => (
        <Sequence key={t} from={t - 6} durationInFrames={22} layout="none">
          <TapPulse at={6} x={0.5} y={0.62} />
        </Sequence>
      ))}

      {/* focus vignette on the morph beat */}
      {burst > 0 ? (
        <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 20%, transparent 46%, rgba(0,0,0,${0.34 * burstBell}) 100%)`, pointerEvents: "none" }} />
      ) : null}

      {/* ══ HUD high above the full-body head ══ */}
      <div style={{ position: "absolute", top: "4.5%", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
          {burst > 0 && burst < 1 ? (
            <>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 440, height: 440, transform: `translate(-50%,-50%) scale(${0.6 + 0.6 * burst})`, background: `radial-gradient(circle, rgba(255,206,58,${0.5 * burstBell}) 0%, rgba(255,206,58,${0.16 * burstBell}) 36%, transparent 62%)`, borderRadius: "50%", filter: "blur(6px)" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 140 + 420 * easeOutCubic(burst), height: 140 + 420 * easeOutCubic(burst), transform: "translate(-50%,-50%)", borderRadius: "50%", border: `${3 * (1 - burst)}px solid rgba(255,224,140,${0.7 * (1 - burst)})` }} />
              {Array.from({ length: 10 }).map((_, i) => {
                const ang = i * 2.399 + 0.5;
                const speed = 0.6 + (((i * 37) % 11) / 11) * 0.8;
                const d = easeOutCubic(burst) * 190 * speed;
                const grav = burst * burst * 46;
                const s = 3 + ((i * 13) % 4);
                return <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: s, height: s, borderRadius: "50%", background: i % 3 ? GOLD_HI : GOLD, transform: `translate(-50%,-50%) translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d + grav}px)`, opacity: (1 - burst) * (1 - burst) * 0.95, boxShadow: `0 0 8px ${GOLD}` }} />;
              })}
            </>
          ) : null}

          <div style={{ position: "relative", transform: `scale(${lvlScale})`, display: "flex", alignItems: "baseline", gap: 12, padding: "12px 34px 14px", borderRadius: 22, background: "linear-gradient(165deg, #202538 0%, #0C0E18 100%)", boxShadow: [`inset 0 2px 1px rgba(255,255,255,0.18)`, `inset 0 -3px 6px rgba(0,0,0,0.55)`, `0 0 0 3px ${GOLD_DK}`, `0 0 0 4px rgba(0,0,0,0.35)`, `0 10px 26px rgba(0,0,0,0.55)`, `0 0 26px rgba(255,206,58,${0.25 + 0.4 * burstBell})`].join(",") }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, padding: 3, background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD} 40%, ${GOLD_DK})`, WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", pointerEvents: "none" }} />
            <span style={{ fontSize: 30, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: 1, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>Lv.</span>
            <span style={{ fontSize: 82, fontWeight: 900, lineHeight: 0.9, letterSpacing: -2, backgroundImage: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 45%, ${GOLD_DK} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.55))" }}>{shownLevel}</span>
          </div>
        </div>

        <div style={{ position: "relative", width: 640 }}>
          <div style={{ position: "relative", height: 34, borderRadius: 999, background: "linear-gradient(180deg,#0B0D16,#04050A)", border: `2px solid rgba(255,206,58,0.35)`, boxShadow: "inset 0 3px 8px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ position: "relative", width: `${xpFill * 100}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${XP_A}, ${XP_B})`, boxShadow: `0 0 18px ${XP_B}, inset 0 -3px 6px rgba(0,0,0,0.25)` }}>
              <div style={{ position: "absolute", top: 2, left: 6, right: 6, height: "42%", borderRadius: 999, background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))" }} />
              <div style={{ position: "absolute", right: -2, top: "50%", width: 14, height: 14, transform: "translateY(-50%)", borderRadius: "50%", background: "#fff", boxShadow: `0 0 14px 4px ${XP_B}` }} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent 0 62px, rgba(0,0,0,0.45) 62px 65px)", pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {luText > 0.01 ? (
        <div style={{ position: "absolute", top: "28%", left: 0, right: 0, textAlign: "center", opacity: luText, transform: `scale(${0.72 + 0.28 * clamp01(luEnter)})` }}>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -1, backgroundImage: `linear-gradient(180deg, #fff 0%, ${GOLD_HI} 55%, ${GOLD} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: `drop-shadow(0 3px 2px rgba(0,0,0,0.65)) drop-shadow(0 0 22px rgba(255,206,58,0.5))` }}>LEVEL UP!</div>
        </div>
      ) : null}

      <MorphSound />
    </AbsoluteFill>
  );
};

const MorphSound: React.FC = () => (
  <>
    <Music src={staticFile("audio/cityAmbient.wav")} peak={0.26} fadeIn={18} fadeOut={30} loop={true} duckAround={[{ at: 120, depth: 0.35 }, { at: 330, depth: 0.35 }]} />
    <Sfx clip="tap" at={100} volume={0.55} />
    <Sfx clip="tap" at={310} volume={0.55} />
    <Sfx clip="levelup" at={120} volume={0.6} />
    <Sfx clip="levelup" at={330} volume={0.6} />
  </>
);
