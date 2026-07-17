import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { SPRING, stagger01 } from "../v2/anim";
import { Grain } from "./Grain";
import { Glow } from "./Glow";
import { MotionBlur } from "./MotionBlur";
import { Parallax } from "./Parallax";

export const LIB_SANDBOX_DURATION = 150;

/**
 * Isolated test bench for every src/lib primitive (inc-2 validation).
 * Six labeled rows; check with stills at ~25 and ~70.
 */

const Row: React.FC<{
  label: string;
  children: React.ReactNode;
  bg?: string;
}> = ({ label, children, bg = theme.color.surface }) => (
  <div
    style={{
      position: "relative",
      height: 320,
      background: bg,
      borderBottom: `1px solid ${theme.color.hair}`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 24,
        fontFamily: theme.font.family,
        fontSize: 22,
        fontWeight: 700,
        color: theme.color.muted,
        zIndex: 200,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

const Card: React.FC<{ label?: string }> = ({ label = "Card" }) => (
  <div
    style={{
      width: 220,
      height: 120,
      borderRadius: theme.radius.card,
      background: theme.color.surface,
      boxShadow: theme.color.softShadow,
      border: `1px solid ${theme.color.hair}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: theme.font.family,
      fontWeight: 800,
      fontSize: 26,
      color: theme.color.ink,
    }}
  >
    {label}
  </div>
);

/** Fast horizontal shuttle — reads the frame itself so MotionBlur can sample it. */
const ShuttlingCard: React.FC<{ label: string }> = ({ label }) => {
  const f = useCurrentFrame();
  const x = Math.sin(f * 0.22) * 300;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        translate: `calc(-50% + ${x}px) -50%`,
      }}
    >
      <Card label={label} />
    </div>
  );
};

const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      padding: "18px 40px",
      borderRadius: theme.radius.pill,
      background: theme.color.primary,
      color: "#fff",
      fontFamily: theme.font.family,
      fontWeight: 800,
      fontSize: 28,
    }}
  >
    {text}
  </div>
);

export const LibSandbox: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springs = [
    { name: "smooth", config: SPRING.smooth },
    { name: "pop", config: SPRING.pop },
    { name: "bounce", config: SPRING.bounce },
  ];

  return (
    <AbsoluteFill style={{ background: theme.color.surface }}>
      {/* 1 — Grain: light bg (multiply) and dark bg (overlay), off | on halves each */}
      <Row label="Grain — light: off | multiply .35 · dark: off | overlay .35">
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "50%",
            background: theme.gradient.living,
          }}
        >
          <div style={{ position: "absolute", inset: 0, left: "50%", overflow: "hidden" }}>
            <Grain opacity={0.35} blend="multiply" />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: "50%",
            background: theme.color.ink,
          }}
        >
          <div style={{ position: "absolute", inset: 0, left: "50%", overflow: "hidden" }}>
            <Grain opacity={0.35} blend="overlay" />
          </div>
        </div>
      </Row>

      {/* 2 — Glow: plain vs glowing */}
      <Row label="Glow — plain | glow">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 140,
          }}
        >
          <Pill text="Plain" />
          <Glow radius={44} strength={0.65}>
            <Pill text="Glow" />
          </Glow>
        </div>
      </Row>

      {/* 3 — MotionBlur: same shuttle without / with blur */}
      <Row label="MotionBlur — top off | bottom on" bg="#F7FAFE">
        <div style={{ position: "absolute", inset: "0 0 50% 0" }}>
          <ShuttlingCard label="No blur" />
        </div>
        <div style={{ position: "absolute", inset: "50% 0 0 0" }}>
          <MotionBlur shutterAngle={300} samples={12}>
            <ShuttlingCard label="Blur" />
          </MotionBlur>
        </div>
      </Row>

      {/* 4 — Spring presets scale-in from f=10 */}
      <Row label="Spring — smooth | pop | bounce">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 150,
          }}
        >
          {springs.map((s) => {
            const v = spring({ frame: f - 10, fps, config: s.config });
            return (
              <div key={s.name} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 130,
                    height: 130,
                    borderRadius: "50%",
                    background: theme.color.primary,
                    scale: String(v),
                  }}
                />
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: theme.font.family,
                    fontSize: 22,
                    fontWeight: 700,
                    color: theme.color.body,
                  }}
                >
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>
      </Row>

      {/* 5 — stagger01: five chips cascade in from f=10 */}
      <Row label="stagger01 — step 6, dur 16" bg="#F7FAFE">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const p = stagger01(f, i, 10, 6, 16);
            return (
              <div
                key={i}
                style={{
                  padding: "16px 30px",
                  borderRadius: theme.radius.pill,
                  background: theme.color.surface,
                  border: `1px solid ${theme.color.hair}`,
                  boxShadow: theme.color.softShadow,
                  fontFamily: theme.font.family,
                  fontWeight: 700,
                  fontSize: 24,
                  color: theme.color.ink,
                  opacity: p,
                  translate: `0 ${(1 - p) * 26}px`,
                }}
              >
                chip {i + 1}
              </div>
            );
          })}
        </div>
      </Row>

      {/* 6 — Parallax: three depths drifting organically */}
      <Row label="Parallax — depth .25 | .55 | 1">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 120,
          }}
        >
          <Parallax seed="far" depth={0.25} amplitude={70} speed={0.02}>
            <div style={{ width: 90, height: 90, borderRadius: 24, background: theme.color.tint }} />
          </Parallax>
          <Parallax seed="mid" depth={0.55} amplitude={70} speed={0.02}>
            <div style={{ width: 110, height: 110, borderRadius: 28, background: theme.color.gradTop }} />
          </Parallax>
          <Parallax seed="near" depth={1} amplitude={70} speed={0.02}>
            <div style={{ width: 130, height: 130, borderRadius: 32, background: theme.color.primary }} />
          </Parallax>
        </div>
      </Row>
    </AbsoluteFill>
  );
};
