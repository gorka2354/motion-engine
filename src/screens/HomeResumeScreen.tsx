import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

/** Green ChatGPT-style badge (placeholder — swap for the real logo asset later). */
const ToolMark: React.FC = () => (
  <div
    style={{
      width: 62,
      height: 62,
      borderRadius: 16,
      background: "#10A37F",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
      <path d="M12 3.2a3 3 0 0 1 2.6 1.5 3 3 0 0 1 3.9 3.9 3 3 0 0 1 0 5.2 3 3 0 0 1-3.9 3.9 3 3 0 0 1-5.2 0 3 3 0 0 1-3.9-3.9 3 3 0 0 1 0-5.2A3 3 0 0 1 9.4 4.7 3 3 0 0 1 12 3.2Z" />
      <path d="M9 12.5l2 1.2 4-2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/**
 * The Tixu "Let's get back to learning" home screen, rebuilt natively.
 * Used inside the phone for the hook scene.
 */
export const HomeResumeScreen: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #EAF3FE 0%, #FBFDFF 58%, #FFFFFF 100%)",
        fontFamily: theme.font.stack,
        paddingTop: 72,
        paddingLeft: 34,
        paddingRight: 34,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 128, lineHeight: 1, marginBottom: 24 }}>🎒</div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: theme.color.ink,
            lineHeight: 1.12,
            letterSpacing: -0.5,
          }}
        >
          Let&apos;s get back
          <br />
          to learning
        </div>
        <div
          style={{
            fontSize: 23,
            fontWeight: 500,
            color: theme.color.muted,
            marginTop: 14,
          }}
        >
          Pick up right where you left off
        </div>
      </div>

      <div style={{ paddingBottom: 44 }}>
        <div
          style={{
            background: theme.color.surface,
            border: `1px solid ${theme.color.hair}`,
            borderRadius: theme.radius.card,
            boxShadow: theme.color.softShadow,
            padding: 22,
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <ToolMark />
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: theme.color.ink }}>
              ChatGPT
            </div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 500,
                color: theme.color.muted,
                marginTop: 3,
              }}
            >
              25% complete
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            background: theme.color.primary,
            borderRadius: theme.radius.button,
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 25,
            fontWeight: 700,
            boxShadow: "0 14px 26px -10px rgba(18,124,224,0.6)",
          }}
        >
          Continue learning
        </div>
      </div>
    </AbsoluteFill>
  );
};
