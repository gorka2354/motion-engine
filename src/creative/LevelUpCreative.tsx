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
import { Grain } from "../lib";
import { Music, Sfx } from "../lib/sound";

/**
 * "RPG level-up" performance creative (crypto test task): a real AI street shot
 * of an ordinary guy tapping his phone; each tap he "levels up" — the XP bar
 * fills, the level rolls up, a gold burst (rays + shockwave ring + particles)
 * fires around the badge and his outfit upgrades. Three AI person clips
 * (Seedream 4 → nano-banana outfit edits → Kling 3.0 i2v) are composited under
 * a premium game-UI layer; the burst masks the match-cut between clips. 9:16.
 */

export const LEVELUP_DURATION = 240; // 8s @ 30fps

/** AI person clips, one per level — swapped under the burst. */
const CLIPS = [
  { src: "levelup/clip-lv1.mp4", from: 0, dur: 80 },
  { src: "levelup/clip-lv30.mp4", from: 80, dur: 80 },
  { src: "levelup/clip-final.mp4", from: 160, dur: 80 },
];

/** Level-up beats — frame at which each new level lands. */
const LEVELS = [
  { at: 0, level: 1, xp: 0.14 },
  { at: 80, level: 30, xp: 0.5 },
  { at: 160, level: 62, xp: 0.9 },
] as const;

/** LEVEL UP! text — only on the REAL level-ups (no stray one near the end). */
const CLICKS = [74, 154];
const BEATS = [80, 160]; // level-up moments that fire a burst

// premium palette
const GOLD = "#FFCE3A";
const GOLD_HI = "#FFF1B0";
const GOLD_DK = "#C8901A";
const XP_A = "#39E6A6";
const XP_B = "#22C3FF";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Sound layer — mounted at the ROOT so the ambience bed and the one-shot SFX share one
 * composition-absolute frame-space (ducking lines up). Everything soft, low mixed, no
 * clutter. Vocal "hmm/mm" reaction on the smiles is intentionally left as a slot below —
 * a recorded / CC0 sample beats a synth voice, which would read fake.
 */
const LevelUpSound: React.FC = () => (
  <>
    {/* quiet distant city ambience — sits under everything, dips a touch under each chime */}
    {/* real city ambience (Mixkit "urban park and traffic", CC0/Mixkit-license) — quiet
        background bed, sits under the SFX, dips a touch under each chime */}
    <Music
      src={staticFile("audio/cityAmbient.wav")}
      peak={0.26}
      fadeIn={16}
      fadeOut={26}
      loop={false}
      duckAround={[{ at: 80, depth: 0.35 }, { at: 160, depth: 0.35 }]}
    />
    {/* taps — the two upgrade taps + the final tap in the last clip */}
    <Sfx clip="tap" at={74} volume={0.5} />
    <Sfx clip="tap" at={154} volume={0.5} />
    <Sfx clip="tap" at={218} volume={0.42} />
    {/* soft level-up chimes on the beats */}
    <Sfx clip="levelup" at={80} volume={0.58} />
    <Sfx clip="levelup" at={160} volume={0.58} />
  </>
);

export const LevelUpCreative: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // current level beat
  const idx = Math.max(0, LEVELS.map((l) => l.at).filter((a) => f >= a).length - 1);
  const cur = LEVELS[idx];
  const beatStart = cur.at;
  const prevLevel = idx === 0 ? 0 : LEVELS[idx - 1].level;

  // XP bar fill (refills low, eases up)
  const p = clamp01((f - beatStart) / 26);
  const xpFill = interpolate(p, [0, 1], [idx === 0 ? 0 : 0.06, cur.xp], {
    extrapolateRight: "clamp",
  });

  // level number rolls up from previous to current
  const rollP = idx === 0 ? 1 : easeOutCubic(clamp01((f - beatStart) / 16));
  const shownLevel = Math.round(prevLevel + (cur.level - prevLevel) * rollP);

  // burst progress on each beat (0→1 over 22f)
  const burst = BEATS.reduce((a, b) => {
    return f >= b && f < b + 22 ? Math.max(a, clamp01((f - b) / 22)) : a;
  }, 0);
  const burstBell = Math.sin(clamp01(burst) * Math.PI); // 0→1→0

  // badge pop on level change / beat
  const pop = springWindow(f, fps, beatStart, beatStart + 30).enter;
  const lvlScale = (1 + 0.32 * (1 - clamp01(pop))) * (1 + 0.14 * burstBell);

  // scale-punch on the footage under the burst (hides the cut)
  const punch = BEATS.reduce((a, b) => {
    const up = clamp01((f - b) / 3);
    const down = clamp01((f - b - 3) / 12);
    return Math.max(a, up * (1 - down));
  }, 0);
  const punchScale = 1 + 0.05 * punch;

  // LEVEL UP! text on clicks
  const luText = CLICKS.reduce((a, c) => {
    const w = f >= c && f < c + 26 ? springWindow(f, fps, c, c + 26) : null;
    return w ? Math.max(a, w.opacity) : a;
  }, 0);
  const luEnter = CLICKS.reduce((a, c) => {
    const w = f >= c && f < c + 26 ? springWindow(f, fps, c, c + 26).enter : 0;
    return Math.max(a, w);
  }, 0);

  return (
    <AbsoluteFill style={{ background: "#0A0A0C", fontFamily: theme.font.stack }}>
      {/* ── AI person clips (scale-punch on beats) ── */}
      <AbsoluteFill style={{ transform: `scale(${punchScale})` }}>
        {CLIPS.map((c) => (
          <Sequence key={c.src} from={c.from} durationInFrames={c.dur}>
            <OffthreadVideo
              src={staticFile(c.src)}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* film grain — unifies clips + kills the AI-clean look */}
      <Grain opacity={0.08} frequency={0.8} blend="soft-light" />

      {/* focus vignette on beat — DARKENS the edges (no overexposure) */}
      {burst > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 80% at 50% 26%, transparent 42%, rgba(0,0,0,${0.4 * burstBell}) 100%)`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* ══ HUD over the head ══ */}
      <div
        style={{
          position: "absolute",
          top: "11%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        {/* burst layer behind the badge */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
          {burst > 0 && burst < 1 ? (
            <>
              {/* soft warm flash behind the badge — the main "pop" (no hard rays) */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 460,
                  height: 460,
                  transform: `translate(-50%,-50%) scale(${0.6 + 0.6 * burst})`,
                  background: `radial-gradient(circle, rgba(255,206,58,${0.5 * burstBell}) 0%, rgba(255,206,58,${0.16 * burstBell}) 36%, transparent 62%)`,
                  borderRadius: "50%",
                  filter: "blur(6px)",
                }}
              />
              {/* subtle blurred sunburst — hint of rays, not mechanical */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 500,
                  height: 500,
                  transform: `translate(-50%,-50%) scale(${0.55 + 0.75 * burst}) rotate(${10 * burst}deg)`,
                  background:
                    "repeating-conic-gradient(from 0deg, rgba(255,224,140,0.28) 0deg 2deg, transparent 2deg 17deg)",
                  borderRadius: "50%",
                  opacity: 0.55 * burstBell,
                  filter: "blur(1.5px)",
                  WebkitMaskImage:
                    "radial-gradient(circle, transparent 27%, #000 42%, transparent 64%)",
                  maskImage:
                    "radial-gradient(circle, transparent 27%, #000 42%, transparent 64%)",
                }}
              />
              {/* thin quick shockwave ring */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 140 + 420 * easeOutCubic(burst),
                  height: 140 + 420 * easeOutCubic(burst),
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  border: `${3 * (1 - burst)}px solid rgba(255,224,140,${0.7 * (1 - burst)})`,
                }}
              />
              {/* natural spark particles — uneven spread, slight gravity, fast fade */}
              {Array.from({ length: 10 }).map((_, i) => {
                const ang = i * 2.399 + 0.5; // golden-angle → organic, not a perfect ring
                const speed = 0.6 + (((i * 37) % 11) / 11) * 0.8;
                const d = easeOutCubic(burst) * 190 * speed;
                const grav = burst * burst * 46; // sparks arc down as they fade
                const s = 3 + ((i * 13) % 4);
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: s,
                      height: s,
                      borderRadius: "50%",
                      background: i % 3 ? GOLD_HI : GOLD,
                      transform: `translate(-50%,-50%) translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d + grav}px)`,
                      opacity: (1 - burst) * (1 - burst) * 0.95,
                      boxShadow: `0 0 8px ${GOLD}`,
                    }}
                  />
                );
              })}
            </>
          ) : null}

          {/* level badge — dark body, gold metallic frame, beveled number */}
          <div
            style={{
              position: "relative",
              transform: `scale(${lvlScale})`,
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              padding: "12px 34px 14px",
              borderRadius: 22,
              background: "linear-gradient(165deg, #202538 0%, #0C0E18 100%)",
              boxShadow: [
                `inset 0 2px 1px rgba(255,255,255,0.18)`,
                `inset 0 -3px 6px rgba(0,0,0,0.55)`,
                `0 0 0 3px ${GOLD_DK}`,
                `0 0 0 4px rgba(0,0,0,0.35)`,
                `0 10px 26px rgba(0,0,0,0.55)`,
                `0 0 26px rgba(255,206,58,${0.25 + 0.4 * burstBell})`,
              ].join(","),
            }}
          >
            {/* gold top-edge sheen on the frame */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 22,
                padding: 3,
                background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD} 40%, ${GOLD_DK})`,
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: 1,
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              }}
            >
              Lv.
            </span>
            <span
              style={{
                fontSize: 82,
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: -2,
                backgroundImage: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 45%, ${GOLD_DK} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.55))",
              }}
            >
              {shownLevel}
            </span>
          </div>
        </div>

        {/* XP bar — recessed track, glossy fill, segments, glowing edge */}
        <div style={{ position: "relative", width: 640 }}>
          <div
            style={{
              position: "relative",
              height: 34,
              borderRadius: 999,
              background: "linear-gradient(180deg,#0B0D16,#04050A)",
              border: `2px solid rgba(255,206,58,0.35)`,
              boxShadow: "inset 0 3px 8px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            {/* fill */}
            <div
              style={{
                position: "relative",
                width: `${xpFill * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${XP_A}, ${XP_B})`,
                boxShadow: `0 0 18px ${XP_B}, inset 0 -3px 6px rgba(0,0,0,0.25)`,
              }}
            >
              {/* glossy top highlight */}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: 6,
                  right: 6,
                  height: "42%",
                  borderRadius: 999,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",
                }}
              />
              {/* glowing leading edge */}
              <div
                style={{
                  position: "absolute",
                  right: -2,
                  top: "50%",
                  width: 14,
                  height: 14,
                  transform: "translateY(-50%)",
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: `0 0 14px 4px ${XP_B}`,
                }}
              />
            </div>
            {/* segment notches */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "repeating-linear-gradient(90deg, transparent 0 62px, rgba(0,0,0,0.45) 62px 65px)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── "LEVEL UP!" burst text ── */}
      {luText > 0.01 ? (
        <div
          style={{
            position: "absolute",
            top: "33%",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: luText,
            transform: `scale(${0.72 + 0.28 * clamp01(luEnter)})`,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              letterSpacing: -1,
              backgroundImage: `linear-gradient(180deg, #fff 0%, ${GOLD_HI} 55%, ${GOLD} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 3px 2px rgba(0,0,0,0.65)) drop-shadow(0 0 22px rgba(255,206,58,0.5))`,
            }}
          >
            LEVEL UP!
          </div>
        </div>
      ) : null}

      <LevelUpSound />
    </AbsoluteFill>
  );
};
