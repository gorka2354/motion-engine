import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { theme } from "../theme";

/** Real course icon from the app (Claude Advanced Workflows). */
const ToolMark: React.FC = () => (
  <Img
    src={staticFile("home/course-claude.png")}
    style={{ width: 62, height: 62, borderRadius: 16, objectFit: "cover", flexShrink: 0 }}
  />
);

/**
 * The Tixu "Let's get back to learning" home screen, rebuilt natively with the
 * real 3D backpack illustration and the OpenAI mark.
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
        <Img
          src={staticFile("home/backpack.webp")}
          style={{ width: 240, height: 180, objectFit: "contain", marginBottom: 18 }}
        />
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
            <div style={{ fontSize: 25, fontWeight: 700, color: theme.color.ink, lineHeight: 1.2 }}>
              Claude Advanced Workflows
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
