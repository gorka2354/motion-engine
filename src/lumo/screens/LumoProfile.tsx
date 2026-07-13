import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../../theme";
import { BottomNav } from "../../components/BottomNav";

const L = theme.lumo;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const Ring: React.FC<{ pct: number; size?: number }> = ({ pct, size = 128 }) => {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(3,20,35,0.10)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={L.accentSolid}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          fontWeight: 800,
          color: theme.color.ink,
        }}
      >
        {Math.round(pct * 100)}%
      </div>
    </div>
  );
};

/** Lumo personalized profile: focus, goal, daily budget, next lesson. */
export const LumoProfile: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [14, 50], [0, 0.33], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #FFF3F5 0%, #FFFBFC 60%, #FFFFFF 100%)",
        fontFamily: theme.font.stack,
        padding: "78px 32px 0",
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, color: theme.color.ink, marginBottom: 20 }}>
        Your learning profile
      </div>

      {/* profile card */}
      <div
        style={{
          background: "linear-gradient(160deg, #FFECF0 0%, #FFF7F9 100%)",
          border: `1px solid ${theme.color.hair}`,
          borderRadius: theme.radius.card,
          padding: 26,
          boxShadow: theme.color.softShadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Ring pct={pct} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: theme.color.muted }}>
              Personal focus
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: theme.color.ink, marginTop: 4 }}>
              Prompt Craft
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: theme.color.hair, margin: "22px 0" }} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={chip}>🎯&nbsp;&nbsp;Work smarter</div>
          <div style={chip}>⏱️&nbsp;&nbsp;15 min/day</div>
        </div>
      </div>

      {/* next lesson */}
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: theme.color.muted, margin: "28px 0 12px" }}>
        Next lesson · 5 min
      </div>
      <div
        style={{
          background: theme.color.surface,
          border: `1px solid ${theme.color.hair}`,
          borderRadius: theme.radius.card,
          padding: 24,
          boxShadow: theme.color.softShadow,
        }}
      >
        <div style={{ fontSize: 25, fontWeight: 800, color: theme.color.ink }}>
          Prompt Engineering Foundations
        </div>
        <div style={{ fontSize: 19, fontWeight: 500, color: theme.color.body, marginTop: 8, lineHeight: 1.4 }}>
          Turn everyday tasks into AI wins.
        </div>
        <div
          style={{
            marginTop: 18,
            height: 56,
            borderRadius: theme.radius.button,
            background: L.ctaGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 21,
            fontWeight: 700,
          }}
        >
          Continue learning
        </div>
      </div>

      <BottomNav active="home" />
    </AbsoluteFill>
  );
};

const chip: React.CSSProperties = {
  flex: 1,
  background: theme.color.surface,
  border: `1px solid ${theme.color.hair}`,
  borderRadius: 14,
  padding: "16px 14px",
  fontSize: 19,
  fontWeight: 700,
  color: theme.color.ink,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};
