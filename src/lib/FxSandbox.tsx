import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { theme } from "../theme";
import { clamp01, EASE } from "../v2/anim";
import { MagicMove } from "./MagicMove";
import { morphPath, drawPath01 } from "./morph";

export const FX_SANDBOX_DURATION = 150;

/**
 * Test bench for the transition pack (inc-6): MagicMove, path morph,
 * draw-on. Dark stage like the real V2 videos. Check stills ~20 / 40 / 70.
 */

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div
    style={{
      position: "relative",
      height: 640,
      borderBottom: `1px solid ${theme.dark.hair}`,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 28,
        fontFamily: theme.font.family,
        fontSize: 24,
        fontWeight: 700,
        color: theme.dark.textMuted,
        zIndex: 200,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);

// Same command structure (M + 4C + Z) — morph-compatible.
const BLOB_A =
  "M 100 4 C 152 4 196 48 196 100 C 196 152 152 196 100 196 C 48 196 4 152 4 100 C 4 48 48 4 100 4 Z";
const BLOB_B =
  "M 100 12 C 128 64 136 72 188 100 C 136 128 128 136 100 188 C 72 136 64 128 12 100 C 64 72 72 64 100 12 Z";

const TRAIL =
  "M 40 200 L 180 80 L 320 190 L 460 60 L 600 160 L 740 40";

const Chip: React.FC = () => (
  <div
    style={{
      width: 300,
      height: 96,
      borderRadius: theme.radius.pill,
      background: theme.color.primary,
      color: "#fff",
      fontFamily: theme.font.family,
      fontWeight: 800,
      fontSize: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: theme.shadow.ctaGlow,
    }}
  >
    New course
  </div>
);

const MiniCert: React.FC = () => (
  <div
    style={{
      width: 460,
      height: 260,
      borderRadius: 26,
      background: theme.color.surface,
      boxShadow: theme.dark.shadowFloat,
      fontFamily: theme.font.family,
      padding: "26px 30px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <div
      style={{
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: 3,
        color: theme.color.muted,
      }}
    >
      CERTIFICATE
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ fontSize: 56, lineHeight: 1 }}>🎓</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: theme.color.ink,
          letterSpacing: -0.5,
        }}
      >
        Course complete
      </div>
    </div>
    <div style={{ fontSize: 17, fontWeight: 600, color: theme.color.muted }}>
      Awarded to Denis · tixu.ai
    </div>
  </div>
);

export const FxSandbox: React.FC = () => {
  const f = useCurrentFrame();

  const morphT = EASE(clamp01((f - 10) / 60));
  const drawT = clamp01((f - 10) / 80);
  const trailLen = getLength(TRAIL);
  const tip = getPointAtLength(TRAIL, trailLen * drawT);

  return (
    <AbsoluteFill style={{ background: theme.dark.bg }}>
      {/* 1 — MagicMove: chip flies + spins + morphs into a certificate card */}
      <Row label="MagicMove — chip → certificate, spin 1 (f10–60)">
        <MagicMove
          from={10}
          to={60}
          a={{ x: 250, y: 360, w: 300, h: 96 }}
          b={{ x: 660, y: 340, w: 460, h: 260, rotate: -3 }}
          spin={1}
          renderA={() => <Chip />}
          renderB={() => <MiniCert />}
        />
      </Row>

      {/* 2 — morphPath: blob ↔ star (same command structure) */}
      <Row label="morphPath — blob → star (f10–70)">
        <svg
          width="440"
          height="440"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            translate: "-50% -50%",
            rotate: `${morphT * 90}deg`,
          }}
        >
          <path d={morphPath(BLOB_A, BLOB_B, morphT)} fill={theme.color.primary} />
        </svg>
      </Row>

      {/* 3 — drawPath01: learning-trail draws itself, dot rides the tip */}
      <Row label="drawPath01 — draw-on + tip dot (f10–90)">
        <svg
          width="780"
          height="240"
          viewBox="0 0 780 240"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            translate: "-50% -50%",
          }}
        >
          <path
            d={TRAIL}
            stroke={theme.dark.hair}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={TRAIL}
            stroke={theme.color.primary}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...drawPath01(TRAIL, drawT)}
          />
          {drawT > 0 && drawT < 1 ? (
            <circle cx={tip.x} cy={tip.y} r={16} fill={theme.dark.text} />
          ) : null}
        </svg>
      </Row>
    </AbsoluteFill>
  );
};
