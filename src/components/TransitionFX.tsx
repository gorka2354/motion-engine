import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Deterministic sparkle field (no Math.random — would flicker per frame).
const SPARKS = [
  { a: 0.2, d: 32, s: 13, c: "primary" },
  { a: 0.9, d: 44, s: 8, c: "white" },
  { a: 1.7, d: 26, s: 15, c: "green" },
  { a: 2.5, d: 40, s: 9, c: "primary" },
  { a: 3.3, d: 30, s: 12, c: "white" },
  { a: 4.0, d: 46, s: 8, c: "primary" },
  { a: 4.8, d: 24, s: 14, c: "green" },
  { a: 5.6, d: 42, s: 10, c: "white" },
];

const colorOf = (c: string) =>
  c === "primary" ? theme.color.primary : c === "green" ? theme.color.green : "#FFFFFF";

/**
 * Extra flair layered on top of a scene transition: a diagonal light sweep, a
 * soft camera flash, an accent-colored expanding ring, and sparkle particles.
 * Runs over its own local frame window (0..durationInFrames).
 */
export const TransitionFX: React.FC<{ durationInFrames: number; accent?: string }> = ({
  durationInFrames,
  accent = theme.color.primary,
}) => {
  const frame = useCurrentFrame();
  const p = Math.min(Math.max(frame / durationInFrames, 0), 1);

  const sweepX = interpolate(p, [0, 1], [-75, 75]);
  const sweepO = interpolate(p, [0, 0.5, 1], [0, 0.5, 0]);
  const flash = interpolate(p, [0, 0.5, 1], [0, 0.1, 0]);
  const ringSize = interpolate(p, [0, 1], [40, 980]);
  const ringO = interpolate(p, [0, 0.4, 1], [0, 0.32, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* soft flash */}
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />

      {/* accent expanding ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          width: ringSize,
          height: ringSize,
          borderRadius: 999,
          border: `3px solid ${accent}`,
          translate: "-50% -50%",
          opacity: ringO,
        }}
      />

      {/* diagonal light sweep */}
      <div
        style={{
          position: "absolute",
          top: "-25%",
          left: `${sweepX}%`,
          width: "45%",
          height: "150%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
          filter: "blur(26px)",
          rotate: "15deg",
          opacity: sweepO,
        }}
      />

      {/* sparkles */}
      {SPARKS.map((sp, i) => {
        const x = 50 + Math.cos(sp.a) * sp.d * p;
        const y = 52 + Math.sin(sp.a) * sp.d * p;
        const o = interpolate(p, [0, 0.25, 1], [0, 1, 0]);
        const sc = interpolate(p, [0, 1], [0.4, 1.1]);
        const col = colorOf(sp.c);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: sp.s,
              height: sp.s,
              borderRadius: 999,
              background: col,
              translate: "-50% -50%",
              opacity: o,
              scale: String(sc),
              boxShadow: `0 0 12px ${col}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
