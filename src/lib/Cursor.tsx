// Traveling cursor for UI demos — the single biggest "real demo vs screens changing
// on their own" upgrade (research 2026-07-11, 3 agents converged). Its own identity
// (bigger than an OS cursor, one accent color, optional trail), eased bezier travel
// (never linear), and it ARRIVES a few frames before a tap fires — pair each arrival
// with a <TapPulse> (or use <TapTarget>, which wires both from one frame).
//
// Two ways to drive it:
//   • simple hop:  from / to / moveStart / moveDur
//   • multi-hop:   stops={[{pos,at}, …]} — cursor is AT pos[i] on frame at[i], eases
//     between consecutive stops, and holds when two stops share a position. Lets one
//     cursor tap A → move → tap B → move → tap C without stacking components.
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_INOUT, clamp01, DUR } from "../v2/anim";
import { hexToRgba } from "./color";
import { theme } from "../theme";

export type CursorStop = { pos: [number, number]; at: number };

export const Cursor: React.FC<{
  // simple-hop form
  from?: [number, number]; // composition px
  to?: [number, number];
  moveStart?: number; // frame the travel begins
  moveDur?: number; // eased travel length (default DUR.hop)
  // multi-hop form (takes precedence when given)
  stops?: CursorStop[];
  // shared
  visibleFrom?: number; // when it fades in (default first-move − 8)
  hideAfter?: number; // optional fade-out frame
  color?: string;
  size?: number; // ring diameter
  trail?: boolean; // faint motion trail while moving
}> = ({
  from,
  to,
  moveStart = 0,
  moveDur = DUR.hop,
  stops,
  visibleFrom,
  hideAfter,
  color = theme.color.primary,
  size = 42,
  trail = true,
}) => {
  const frame = useCurrentFrame();

  // Normalize both forms into a stop list sorted by frame.
  const path: CursorStop[] =
    stops && stops.length
      ? stops
      : [
          { pos: from ?? [0, 0], at: moveStart },
          { pos: to ?? from ?? [0, 0], at: moveStart + moveDur },
        ];

  const firstAt = path[0].at;
  const vis = visibleFrom ?? firstAt - 8;
  if (frame < vis) return null;
  if (hideAfter != null && frame > hideAfter) return null;

  // Position at an arbitrary frame — eased within the active segment, held outside.
  const at = (f: number): { x: number; y: number; moving: boolean } => {
    if (f <= path[0].at) return { x: path[0].pos[0], y: path[0].pos[1], moving: false };
    const last = path[path.length - 1];
    if (f >= last.at) return { x: last.pos[0], y: last.pos[1], moving: false };
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      if (f >= a.at && f < b.at) {
        const moving = a.pos[0] !== b.pos[0] || a.pos[1] !== b.pos[1];
        return {
          x: interpolate(f, [a.at, b.at], [a.pos[0], b.pos[0]], { easing: EASE_INOUT }),
          y: interpolate(f, [a.at, b.at], [a.pos[1], b.pos[1]], { easing: EASE_INOUT }),
          moving,
        };
      }
    }
    return { x: last.pos[0], y: last.pos[1], moving: false };
  };

  const p = at(frame);
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
      {trail && p.moving &&
        [0.35, 0.6].map((back, i) => {
          const tp = at(frame - (i + 1) * 3); // sample a few frames behind
          return <React.Fragment key={i}>{dot(tp.x, tp.y, 1 - back * 0.4, (1 - back) * 0.4)}</React.Fragment>;
        })}
      {dot(p.x, p.y, 1, 1)}
    </div>
  );
};
