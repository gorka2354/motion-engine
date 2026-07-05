import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SpringConfig } from "remotion";
import { clamp01, SPRING } from "../v2/anim";

/** Center-based rect in viewport px. */
export type MagicRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
};

/**
 * Keynote-style "Magic Move": element A flies, resizes, spins and cross-fades
 * into element B over [from..to]. Contents render at their natural rect size
 * and are scaled (non-uniformly) with the box, so the silhouette morphs
 * continuously. Springy progress — overshoot lands with the premium snap.
 *
 * Before `from` it shows A parked at rect a; after `to` it shows B parked at
 * rect b (disable with showBefore/showAfter).
 */
export const MagicMove: React.FC<{
  from: number;
  to: number;
  a: MagicRect;
  b: MagicRect;
  renderA: () => React.ReactNode;
  renderB: () => React.ReactNode;
  /** Extra full turns during the flight (the "с кручением" part). */
  spin?: number;
  config?: Partial<SpringConfig>;
  showBefore?: boolean;
  showAfter?: boolean;
  style?: React.CSSProperties;
}> = ({
  from,
  to,
  a,
  b,
  renderA,
  renderB,
  spin = 0,
  config = SPRING.pop,
  showBefore = true,
  showAfter = true,
  style,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if ((f < from && !showBefore) || (f > to && !showAfter)) return null;

  const p =
    f < from
      ? 0
      : spring({ frame: f - from, fps, config, durationInFrames: to - from });
  const lerp = (u: number, v: number) => u + (v - u) * p;

  const w = lerp(a.w, b.w);
  const h = lerp(a.h, b.h);
  const rot = lerp(a.rotate ?? 0, (b.rotate ?? 0) + spin * 360);
  // cross-fade through the middle of the flight
  const cross = clamp01((p - 0.32) / 0.36);

  const layer = (
    base: MagicRect,
    content: React.ReactNode,
    opacity: number,
  ) => (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: base.w,
        height: base.h,
        translate: "-50% -50%",
        scale: `${w / base.w} ${h / base.h}`,
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {content}
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: lerp(a.x, b.x),
        top: lerp(a.y, b.y),
        width: w,
        height: h,
        translate: "-50% -50%",
        rotate: `${rot}deg`,
        ...style,
      }}
    >
      {cross < 1 ? layer(a, renderA(), 1 - cross) : null}
      {cross > 0 ? layer(b, renderB(), cross) : null}
    </div>
  );
};
