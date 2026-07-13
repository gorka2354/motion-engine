import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../../theme";
import { GlyphTile, HeroArt } from "../LumoArt";

const L = theme.lumo;

/**
 * Lumo home ("Welcome back") — resume-your-course screen. Generic EdTech
 * layout, coral accent, self-contained art (no product screenshots).
 */
export const LumoHome: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #FFF3F5 0%, #FFFBFC 58%, #FFFFFF 100%)",
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
        <HeroArt size={210} />
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: theme.color.ink,
            lineHeight: 1.12,
            letterSpacing: -0.5,
            marginTop: 10,
          }}
        >
          Welcome back
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
          <GlyphTile icon="spark" size={62} />
          <div>
            <div
              style={{
                fontSize: 25,
                fontWeight: 700,
                color: theme.color.ink,
                lineHeight: 1.2,
              }}
            >
              Prompt Engineering Foundations
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
            background: L.ctaGradient,
            borderRadius: theme.radius.button,
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 25,
            fontWeight: 700,
            boxShadow: L.buttonGlow,
          }}
        >
          Continue learning
        </div>
      </div>
    </AbsoluteFill>
  );
};
