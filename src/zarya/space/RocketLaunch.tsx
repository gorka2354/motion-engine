import React from "react";
import { AbsoluteFill, useVideoConfig, spring, interpolate } from "remotion";
import { Z, FONT } from "../zarya.style";
import { clamp01 } from "../../v2/anim";
import { PixelRocket } from "./PixelRocket";
import { PixelBitmapText } from "./PixelBitmapText";
import {
  rocketY,
  countPhase,
  padGlow,
  ember,
  streak,
  overlayFade,
  shake,
  LIFT,
  LAUNCH_TOTAL,
} from "./rocketMath";

/**
 * The "Поехали!" launch overlay — the app's signature moment, re-authored
 * frame-based over the persistent terminal. `f` is the local frame from the
 * ПУСК press; the rocket counts down 3·2·1, then accelerates up and OUT of the
 * top of frame, leaving the terminal behind (the bridge into the sessions hero).
 * Fully deterministic; math lives in rocketMath.ts.
 */
export const RocketLaunch: React.FC<{ f: number; model?: string; thrust?: string }> = ({
  f,
  model = "CLAUDE-OPUS-4-8",
  thrust = "МАКС",
}) => {
  const { width: w, height: h, fps } = useVideoConfig();
  if (f < 0 || f >= LAUNCH_TOTAL) return null;

  const fade = overlayFade(f);
  const { label: count, p: countP } = countPhase(f);
  const ry = rocketY(f, h);
  const glow = padGlow(f);
  const sh = shake(f);
  const lifting = f >= LIFT;

  // headline springs in just after liftoff, then drifts up and fades with the overlay
  const hlIn = spring({ frame: f - (LIFT + 2), fps, config: { damping: 14, stiffness: 170, mass: 0.9 } });
  const hlRise = interpolate(f, [LIFT + 2, LAUNCH_TOTAL], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flameFlick = 0.7 + 0.3 * Math.sin(f * 1.7) * Math.cos(f * 0.9);
  const darken = interpolate(f, [0, LIFT, LAUNCH_TOTAL - 24, LAUNCH_TOTAL], [0.18, 0.42, 0.42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fade, pointerEvents: "none", transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      {/* focus darkening (clears as the overlay ends, revealing the terminal) */}
      <AbsoluteFill style={{ background: `rgba(3,4,10,${darken})` }} />
      {/* pad launch glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 42% at 50% 82%, rgba(255,150,60,${0.32 * glow}), rgba(226,35,26,${0.12 * glow}) 42%, transparent 72%)`,
        }}
      />
      {/* accelerating star streaks */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 90 }, (_, i) => {
          const s = streak(i, f, w, h);
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={s.x}
              y2={s.y + s.len}
              stroke={`rgba(240,236,220,${s.alpha})`}
              strokeWidth={s.width}
              strokeLinecap="round"
            />
          );
        })}
        {/* exhaust embers */}
        {Array.from({ length: 150 }, (_, i) => {
          const e = ember(i, f, w, h);
          if (!e) return null;
          return <circle key={`e${i}`} cx={e.x} cy={e.y} r={e.size} fill={`hsla(${e.hue},100%,60%,${e.alpha})`} />;
        })}
      </svg>

      {/* the rocket (pixel sprite, nose near ry) with a thrust flame while lifting */}
      <div style={{ position: "absolute", left: w / 2, top: ry - 30, transform: "translate(-50%, 0)" }}>
        <PixelRocket size={150} glow />
        {lifting && (
          <div
            style={{
              position: "absolute",
              top: 132,
              left: "50%",
              transform: "translateX(-50%)",
              width: 22,
              height: 60 * flameFlick + 30,
              background: "linear-gradient(180deg, #fff2c0 0%, #f0662e 40%, rgba(226,35,26,0) 100%)",
              borderRadius: "30% 30% 60% 60%",
              imageRendering: "pixelated",
              opacity: 0.92,
            }}
          />
        )}
      </div>

      {/* countdown 3·2·1 */}
      {count && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ opacity: 0.28 + (1 - countP) * 0.6, transform: `scale(${1.25 - countP * 0.35})` }}>
            <PixelBitmapText text={count} px={40} fill={Z.accent2} glow="drop-shadow(0 0 40px rgba(224,177,90,0.55))" />
          </div>
        </AbsoluteFill>
      )}

      {/* ПОЕХАЛИ! — matches the app's .zy-rocket-title: crisp Pixelify, gradient
          fill, letter-spacing spreads in (0.5em→0.12em), one soft glow, NO skew.
          The model id is a small mission-control telemetry line below. */}
      {f >= LIFT + 2 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
          <div style={{ transform: `translateY(${hlRise}px) scale(${0.6 + clamp01(hlIn) * 0.4})`, opacity: Math.min(1, hlIn) }}>
            <PixelBitmapText
              text="ПОЕХАЛИ!"
              px={20}
              gap={1 + (1 - clamp01(hlIn)) * 3}
              gradient
              glow="drop-shadow(0 0 34px rgba(226,35,26,0.55))"
            />
          </div>
          <div
            style={{
              transform: `translateY(${hlRise}px)`,
              opacity: Math.min(1, hlIn) * 0.9,
              fontFamily: FONT.tech,
              fontSize: 22,
              letterSpacing: "0.32em",
              color: Z.accent2,
            }}
          >
            ДВИГАТЕЛЬ · {model} · ТЯГА {thrust}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
