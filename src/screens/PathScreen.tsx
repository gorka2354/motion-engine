import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const W = 574; // phone screen inner width at phoneWidth=610
const CX = W / 2;
const START_Y = 312;
const GAP = 178;

const NODES = [
  { label: "From Helper to System", x: 0, active: true },
  { label: "Show Claude what\n“good” looks like", x: -128 },
  { label: "Break big jobs\ninto steps", x: 122 },
  { label: "Let Claude write\nthe prompt", x: -112 },
  { label: "Build a workspace\nthat runs itself", x: 104 },
];

const PlayTriangle: React.FC<{ c: string; s?: number }> = ({ c, s = 26 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
    <path d="M8 5.5v13l11-6.5L8 5.5Z" />
  </svg>
);

export const PathScreen: React.FC = () => {
  const frame = useCurrentFrame();

  // camera pans down the path
  const pan = interpolate(frame, [12, 150], [0, -132], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const nodes = NODES.map((n, i) => ({
    ...n,
    cx: CX + n.x,
    cy: START_Y + i * GAP,
  }));
  const certY = START_Y + NODES.length * GAP + 6;
  const pathD =
    `M ${nodes[0].cx} ${nodes[0].cy} ` +
    nodes
      .slice(1)
      .map((p) => `L ${p.cx} ${p.cy}`)
      .join(" ") +
    ` L ${CX} ${certY}`;

  const pulse = 1 + 0.045 * Math.sin(frame / 9);

  return (
    <AbsoluteFill style={{ background: theme.color.surface, fontFamily: theme.font.stack }}>
      {/* panning path layer */}
      <div style={{ position: "absolute", inset: 0, translate: `0 ${pan}px` }}>
        <svg width={W} height={certY + 140} style={{ position: "absolute", top: 0, left: 0 }}>
          <path
            d={pathD}
            fill="none"
            stroke="rgba(3,20,35,0.14)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 16"
          />
        </svg>

        {nodes.map((p, i) => {
          const appear = interpolate(frame, [i * 9 + 6, i * 9 + 24], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          });
          const scaleIn = interpolate(appear, [0, 1], [0.6, 1]);
          const size = 92;
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: p.cx - size / 2,
                  top: p.cy - size / 2,
                  width: size,
                  height: size,
                  borderRadius: 999,
                  background: p.active
                    ? "linear-gradient(160deg, #3F9BF0 0%, #127CE0 100%)"
                    : "#EEF2F6",
                  boxShadow: p.active
                    ? "0 16px 30px -10px rgba(18,124,224,0.6)"
                    : "inset 0 -4px 0 rgba(3,20,35,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: appear,
                  scale: String(p.active ? scaleIn * pulse : scaleIn),
                }}
              >
                <PlayTriangle c={p.active ? "#fff" : "#AEB9C2"} />
              </div>
              {/* label */}
              <div
                style={{
                  position: "absolute",
                  left: p.cx - 130,
                  top: p.cy + size / 2 + 10,
                  width: 260,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: p.active ? theme.color.ink : theme.color.muted,
                  lineHeight: 1.2,
                  whiteSpace: "pre-line",
                  opacity: appear,
                }}
              >
                {p.label}
              </div>
              {/* Start pill on the active node */}
              {p.active ? (
                <div
                  style={{
                    position: "absolute",
                    left: p.cx + size / 2 + 14,
                    top: p.cy - 24,
                    background: theme.color.ink,
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                    padding: "10px 20px",
                    borderRadius: 999,
                    opacity: appear,
                  }}
                >
                  Start
                </div>
              ) : null}
            </div>
          );
        })}

        {/* certificate node */}
        <div
          style={{
            position: "absolute",
            left: CX - 54,
            top: certY - 54,
            width: 108,
            height: 108,
            borderRadius: 26,
            background: theme.color.surface,
            border: `2px dashed rgba(3,20,35,0.18)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 54,
          }}
        >
          🎓
        </div>
      </div>

      {/* pinned header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: theme.color.surface,
          paddingTop: 66,
          paddingLeft: 26,
          paddingRight: 26,
          paddingBottom: 18,
          zIndex: 20,
          boxShadow: "0 10px 20px -14px rgba(9,46,92,0.25)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(160deg, #E7F1FE 0%, #F4F9FF 100%)",
            border: `1px solid ${theme.color.hair}`,
            borderRadius: 18,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 34 }}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: theme.color.ink }}>
              Claude Advanced Workflows
            </div>
            <div style={{ marginTop: 8, height: 7, borderRadius: 999, background: "rgba(3,20,35,0.10)" }}>
              <div style={{ width: "6%", height: "100%", borderRadius: 999, background: theme.color.green }} />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.color.muted }}>0/15</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
