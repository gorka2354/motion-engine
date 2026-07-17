// Big Animated Number (BAN) — a value that rolls up to its target and decelerates
// into it (expo-out), the backbone of Data-Stats / metric beats. tabular-nums keeps
// the glyph width fixed so the number doesn't jiggle as digits change (a subtle but
// real footgun with proportional figures). Formatting via Intl.NumberFormat is
// deterministic (no Date/random), so it's render-safe.
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE, clamp01, DUR } from "../v2/anim";
import { theme } from "../theme";

export const Counter: React.FC<{
  to: number;
  from?: number; // default 0
  startAt?: number; // frame the roll begins (default 0)
  dur?: number; // roll length (default DUR.settle + 10 ≈ 1s)
  decimals?: number; // fixed fraction digits (default 0)
  separator?: boolean; // thousands separator (default true)
  prefix?: string; // e.g. "$"
  suffix?: string; // e.g. "%", "K", "×"
  color?: string;
  size?: number; // font px (default 120)
  weight?: number; // font weight (default 800)
  style?: React.CSSProperties; // extra overrides (position, etc.)
}> = ({
  to,
  from = 0,
  startAt = 0,
  dur = DUR.settle + 10,
  decimals = 0,
  separator = true,
  prefix = "",
  suffix = "",
  color = theme.dark.text,
  size = 120,
  weight = 800,
  style,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [startAt, startAt + dur], [from, to], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appear = clamp01((frame - startAt) / 6);

  const text = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: separator,
  }).format(v);

  return (
    <span
      style={{
        fontFamily: theme.font.family,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: -1,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum"',
        opacity: appear,
        ...style,
      }}
    >
      {prefix}
      {text}
      {suffix}
    </span>
  );
};
