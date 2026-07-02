import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { clamp01, EASE, EASE_OUT } from "./anim";

/**
 * Certificate card that floats out of the device during the pull-back —
 * the payoff of the learning path. Viewport space, gentle tilt and drift.
 */
export const FloatingCertificate: React.FC<{ from: number; to: number }> = ({
  from,
  to,
}) => {
  const f = useCurrentFrame();
  if (f < from || f > to + 2) return null;

  const enter = EASE(clamp01((f - from) / 30));
  const exit = EASE_OUT(clamp01((f - (to - 18)) / 18));
  const opacity = enter * (1 - exit);
  if (opacity <= 0.001) return null;

  const bob = Math.sin((f - from) * 0.04) * 7;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 660 + bob + 70 * (1 - enter),
        width: 620,
        translate: "-50% -50%",
        rotate: "-3deg",
        scale: String(0.74 + 0.26 * enter),
        opacity,
        filter: `blur(${(1 - enter) * 10}px)`,
        zIndex: 55,
        background: theme.color.surface,
        border: `1px solid ${theme.color.hair}`,
        borderRadius: 30,
        boxShadow: "0 50px 90px -30px rgba(9,46,92,0.38)",
        padding: "34px 40px 32px",
        fontFamily: theme.font.stack,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Img src={staticFile("logo.svg")} style={{ height: 26 }} />
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 3,
            color: theme.color.muted,
          }}
        >
          CERTIFICATE
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 26 }}>
        <div style={{ fontSize: 64, lineHeight: 1 }}>🎓</div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 600, color: theme.color.muted }}>
            Certificate of completion
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: theme.color.ink, marginTop: 4, letterSpacing: -0.5 }}>
            Claude Advanced Workflows
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: theme.color.muted }}>
          Awarded to Denis · tixu.ai
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: theme.color.greenTint,
            border: `1.5px solid ${theme.color.green}`,
            borderRadius: 999,
            padding: "9px 18px",
            fontSize: 17,
            fontWeight: 800,
            color: "#0B8A4F",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="#0B8A4F" strokeWidth="2.6">
            <path d="M3.5 9.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Course complete
        </div>
      </div>
    </div>
  );
};
