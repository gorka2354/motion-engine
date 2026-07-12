// Traveling cursor for UI demos — the single biggest "real demo vs screens changing
// on their own" upgrade (research 2026-07-11, 3 agents converged). Its own identity
// (bigger than an OS cursor, one accent color, optional trail), eased bezier travel
// (never linear), and it ARRIVES a few frames before the tap fires — pair its arrival
// (moveStart + moveDur) with a TapPulse `at` ~3-6 frames later, never simultaneous.
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_INOUT, clamp01 } from "../v2/anim";
import { hexToRgba } from "./color";
import { theme } from "../theme";

export const Cursor: React.FC<{
  from: [number, number]; // composition px
  to: [number, number];
  moveStart: number; // frame the travel begins
  moveDur?: number; // eased travel length (default 16f)
  visibleFrom?: number; // when it fades in (default moveStart-8)
  hideAfter?: number; // optional fade-out frame
  color?: string;
  size?: number; // ring diameter
  trail?: boolean; // faint motion trail while moving
}> = ({
  from,
  to,
  moveStart,
  moveDur = 16,
  visibleFrom,
  hideAfter,
  color = theme.jumper.accent,
  size = 42,
  trail = true,
}) => {
  const frame = useCurrentFrame();
  const vis = visibleFrom ?? moveStart - 8;
  if (frame < vis) return null;
  if (hideAfter != null && frame > hideAfter) return null;

  const at = (f: number) => ({
    x: interpolate(f, [moveStart, moveStart + moveDur], [from[0], to[0]], {
      easing: EASE_INOUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    y: interpolate(f, [moveStart, moveStart + moveDur], [from[1], to[1]], {
      easing: EASE_INOUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  });

  const p = at(frame);
  const moving = frame > moveStart && frame < moveStart + moveDur;
  const appear = clamp01((frame - vis) / 6);

  const dot = (x: number, y: number, scale: number, opacity: number) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${scale})`,
        width: size,
        height: size,
        borderRadius: 999,
        border: `3px solid ${color}`,
        background: `radial-gradient(closest-side, ${hexToRgba(color, 0.35)}, transparent 72%)`,
        boxShadow: `0 0 18px ${hexToRgba(color, 0.65)}`,
        opacity,
      }}
    />
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: appear }}>
      {trail && moving &&
        [0.35, 0.6].map((back, i) => {
          const tp = at(frame - (i + 1) * 3); // sample a few frames behind
          return <React.Fragment key={i}>{dot(tp.x, tp.y, 1 - back * 0.4, (1 - back) * 0.4)}</React.Fragment>;
        })}
      {dot(p.x, p.y, 1, 1)}
    </div>
  );
};
