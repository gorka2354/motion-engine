// One-call tap: cursor travels in AND the ripple fires, both derived from a single
// `at` frame so they can't desync (footgun #5 — the exact trap the Cursor/TapPulse
// docs warn about, here enforced by construction). The cursor arrives `arriveBefore`
// frames before `at`; the pulse fires on `at`.
//
// The press-scale lives on the TARGET element (this is an overlay, it doesn't own it) —
// drive it from the SAME `at` with tapScale(frame, fps, at) from ../v2/anim:
//   const s = tapScale(frame, fps, TAP);  // <button style={{transform:`scale(${s})`}}/>
//   <TapTarget at={TAP} x={bx} y={by} from={[300,1600]} />
import React from "react";
import { DUR } from "../v2/anim";
import { theme } from "../theme";
import { Cursor } from "./Cursor";
import { TapPulse } from "./TapPulse";

export const TapTarget: React.FC<{
  at: number; // the tap frame — cursor arrival + pulse both derive from this
  x: number;
  y: number; // target point, composition px
  from?: [number, number]; // where the cursor comes from (default: straight below)
  travel?: number; // cursor travel length (default DUR.settle)
  arriveBefore?: number; // frames the cursor lands before the tap (default 8)
  color?: string;
  size?: number; // cursor ring diameter
  pulseSize?: number; // ripple max radius
  trail?: boolean;
  hideCursorAfter?: number; // default at + 30
}> = ({
  at,
  x,
  y,
  from,
  travel = DUR.settle,
  arriveBefore = 8,
  color = theme.color.primary,
  size = 42,
  pulseSize = 56,
  trail = true,
  hideCursorAfter,
}) => {
  const src = from ?? [x, y + 420]; // comes up from below by default (touch-like)
  const moveStart = at - arriveBefore - travel;
  return (
    <>
      <Cursor
        from={src}
        to={[x, y]}
        moveStart={moveStart}
        moveDur={travel}
        hideAfter={hideCursorAfter ?? at + 30}
        color={color}
        size={size}
        trail={trail}
      />
      <TapPulse at={at} x={x} y={y} color={color} size={pulseSize} />
    </>
  );
};
