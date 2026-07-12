// Horizontal bar chart — the Data-Stats beat. Bars grow from 0 to their share of
// `max`, staggered so they read left-to-right, and each value counts up in lockstep
// with its bar (one progress source per row → no desync). Horizontal (not vertical)
// so long labels have room. Deterministic; tabular-nums on the values.
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE, clamp01, stagger } from "../v2/anim";
import { theme } from "../theme";

export type BarRow = { label: string; value: number; color?: string };

export const BarStat: React.FC<{
  rows: BarRow[];
  max?: number; // full-bar value (default = largest row)
  at?: number; // first bar starts here (default 0)
  dur?: number; // per-bar grow length (default 22)
  step?: number; // stagger between bars (default 7)
  width?: number; // chart width px (default 820)
  barHeight?: number; // px (default 64)
  gap?: number; // px between rows (default 30)
  decimals?: number;
  prefix?: string;
  suffix?: string;
  accent?: string; // default bar color (default theme.color.primary)
  labelColor?: string;
  valueColor?: string;
}> = ({
  rows,
  max,
  at = 0,
  dur = 22,
  step = 7,
  width = 820,
  barHeight = 64,
  gap = 30,
  decimals = 0,
  prefix = "",
  suffix = "",
  accent = theme.color.primary,
  labelColor = theme.dark.textMuted,
  valueColor = theme.dark.text,
}) => {
  const frame = useCurrentFrame();
  const peak = max ?? Math.max(...rows.map((r) => r.value), 1);

  const fmt = (v: number) =>
    prefix +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(v) +
    suffix;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap, width, fontFamily: theme.font.family }}>
      {rows.map((r, i) => {
        const start = stagger(i, at, step);
        const p = interpolate(frame, [start, start + dur], [0, 1], {
          easing: EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const frac = clamp01((r.value / peak) * p);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: labelColor }}>{r.label}</span>
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: valueColor,
                  fontVariantNumeric: "tabular-nums",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {fmt(r.value * p)}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: barHeight,
                borderRadius: barHeight / 2,
                background: theme.dark.hair,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${frac * 100}%`,
                  borderRadius: barHeight / 2,
                  background: r.color ?? accent,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
