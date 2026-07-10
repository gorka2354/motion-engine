import React from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";
import { Grain } from "./lib";
import { MotionBlur } from "./lib/MotionBlur";
import { clamp01, springWindow, SPRING } from "./v2/anim";

/**
 * HeroManifest — kinetic-typography brand loop for the portfolio "signature
 * motion" slot. Pure 2D, built entirely on engine primitives (springWindow +
 * blur-up beats, MotionBlur smear, film Grain, token colors). Each beat's
 * accent is one of the three shipped brand presets; the finale rolls the accent
 * through all three — "one engine, many brands", made literal.
 *
 * 300 frames @ 30fps = 10s. Designed to loop seamlessly: the screen is empty at
 * the 300→0 seam (last beat has blurred out, first hasn't entered), the ambient
 * glow drift is periodic over the duration, and grain is random every frame.
 */

export const HERO_MANIFEST_DURATION = 300;

const BLUE = theme.dark.accent; // tixu  #3FA4FF
const PURPLE = theme.shotik.accent; // shotik #7C5CFF
const GOLD = theme.bybit.accent; // bybit  #F7A600

const KineticBeat: React.FC<{
  title: string;
  accentWord: string;
  accentColor: string;
  from: number;
  to: number;
  size?: number;
}> = ({ title, accentWord, accentColor, from, to, size = 104 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, exit, opacity } = springWindow(f, fps, from, to, SPRING.pop);
  if (opacity <= 0.001) return null;

  const eIn = clamp01(enter);
  const blur = 18 * (1 - eIn) + 15 * exit;
  const ty = 44 * (1 - enter) - 28 * exit;

  const [a, b] = title.split(accentWord);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "0 72px",
        opacity,
        filter: `blur(${blur}px)`,
        transform: `translateY(${ty}px)`,
        zIndex: 40,
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontFamily: theme.font.family,
          fontSize: size,
          fontWeight: theme.type.weightHeading,
          letterSpacing: theme.type.letterSpacing,
          lineHeight: 1.0,
          color: theme.dark.text,
        }}
      >
        {a}
        <span style={{ color: accentColor }}>{accentWord}</span>
        {b}
      </div>
    </AbsoluteFill>
  );
};

export const HeroManifest: React.FC = () => {
  const f = useCurrentFrame();
  const D = HERO_MANIFEST_DURATION;
  const p = (f / D) * Math.PI * 2;

  // Ambient glow: periodic drift (loops) + tint that follows the beats.
  const gx1 = Math.sin(p) * 70;
  const gy1 = Math.cos(p) * 54;
  const gx2 = Math.cos(p) * 82;
  const gy2 = Math.sin(p) * 60;
  const glow = interpolateColors(
    f,
    [0, 60, 130, 200, 255, D],
    [BLUE, BLUE, PURPLE, GOLD, BLUE, BLUE],
  );

  // Finale accent rolls blue → purple → gold across the "many brands" beat.
  const brandCycle = interpolateColors(
    f,
    [222, 246, 270, 296],
    [BLUE, PURPLE, GOLD, GOLD],
  );

  const wordmark = interpolate(f, [0, 24], [0, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: theme.dark.bg }}>
      {/* ambient glow blobs — periodic drift, brand-tinted */}
      <div
        style={{
          position: "absolute",
          top: -240 + gy1,
          left: -180 + gx1,
          width: 760,
          height: 760,
          borderRadius: "50%",
          background: glow,
          filter: "blur(160px)",
          opacity: 0.34,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -260 + gy2,
          right: -200 + gx2,
          width: 720,
          height: 720,
          borderRadius: "50%",
          background: glow,
          filter: "blur(170px)",
          opacity: 0.3,
        }}
      />
      <AbsoluteFill style={{ background: theme.dark.vignette }} />

      {/* the manifest — one beat at a time, smeared on entrance */}
      <MotionBlur shutterAngle={210} samples={6}>
        <KineticBeat title="product motion." accentWord="motion" accentColor={BLUE} from={6} to={88} />
        <KineticBeat title="as code." accentWord="code" accentColor={PURPLE} from={82} to={158} />
        <KineticBeat title="one engine." accentWord="engine" accentColor={GOLD} from={152} to={224} />
        <KineticBeat title="many brands." accentWord="brands" accentColor={brandCycle} from={218} to={296} />
      </MotionBlur>

      {/* persistent identity wordmark — constant opacity for a seamless loop */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 84,
          textAlign: "center",
          fontFamily: theme.font.family,
          zIndex: 45,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, color: `rgba(242,247,252,${wordmark})` }}>
          egor pestov
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: `rgba(147,167,188,${wordmark * 1.05})`,
            marginTop: 8,
          }}
        >
          motion developer
        </div>
      </div>

      <Grain opacity={0.06} blend="overlay" />
    </AbsoluteFill>
  );
};
