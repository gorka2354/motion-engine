import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Z, FONT } from "../zarya.style";
import { window01 } from "../../v2/anim";
import { Diamond } from "./icons";

/**
 * A mission-control telemetry caption — the Soviet-space HUD lower-third that
 * replaces a generic subtitle. A red diamond, a Handjet dot-matrix title, and a
 * small tech sub-line, framed like a control-panel readout. Enters/exits via
 * window01; a thin brass rule underlines it.
 */
export const Caption: React.FC<{
  from: number;
  to: number;
  title: string;
  sub?: string;
  y?: number;
  align?: "center" | "left";
  x?: number;
}> = ({ from, to, title, sub, y = 46, align = "center", x = 0 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // Portrait: the window sits high with empty space below, so lift captions into
  // that band instead of pinning them to the very bottom edge.
  const yEff = height > width ? y + height * 0.3 : y;
  const P = height > width;
  const w = window01(f, from, to, 14, 14);
  if (w.opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: yEff,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        paddingLeft: align === "left" ? x : 0,
        opacity: w.opacity,
        transform: `translateY(${(1 - w.enter) * 16}px)`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: align === "center" ? "center" : "flex-start",
          gap: 7,
          maxWidth: P ? width - 80 : Math.min(1180, width - 160),
          textAlign: align === "center" ? "center" : "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: align === "center" ? "center" : "flex-start", flexWrap: "wrap" }}>
          <Diamond size={9} />
          <span style={{ fontFamily: FONT.tech, fontSize: P ? 28 : 34, fontWeight: 700, letterSpacing: "0.05em", color: Z.fg, lineHeight: 1.1 }}>{title}</span>
        </div>
        {sub && (
          <span style={{ fontFamily: FONT.tech, fontSize: P ? 15 : 17, letterSpacing: "0.13em", color: Z.accent2, opacity: 0.92, lineHeight: 1.35 }}>{sub}</span>
        )}
        <div style={{ height: 2, width: "62%", minWidth: 120, background: `linear-gradient(90deg, ${Z.accent}, transparent)`, marginTop: 2 }} />
      </div>
    </div>
  );
};
