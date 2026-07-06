import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";

/** The captured region as a floating artifact (MagicMove B / A). */
export const ScreenshotCard: React.FC<{ width?: number }> = ({ width = 560 }) => (
  <div
    style={{
      width,
      borderRadius: 22,
      background: theme.shotik.panel,
      border: `1px solid ${theme.shotik.hair}`,
      boxShadow: theme.dark.shadowFloat,
      padding: 14,
      fontFamily: theme.font.stack,
    }}
  >
    <div
      style={{
        height: 300,
        borderRadius: 14,
        background: theme.shotik.panelLight,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {[
        { t: 34, w: 200, c: "#8B7CF7" },
        { t: 74, w: 340, c: "#5E6B85" },
        { t: 114, w: 280, c: "#4EC9B0" },
        { t: 154, w: 400, c: "#FF5C7A" },
        { t: 194, w: 240, c: "#5E6B85" },
        { t: 234, w: 320, c: "#CE9178" },
      ].map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 28,
            top: l.t,
            width: l.w,
            height: 14,
            borderRadius: 5,
            background: l.c,
            opacity: 0.6,
          }}
        />
      ))}
      {/* the red annotation arrow, baked into the shot */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M 420 250 C 380 220 330 190 296 168"
          stroke="#FF4D5E"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <path d="M 286 178 L 296 168 L 306 180 Z" fill="#FF4D5E" />
      </svg>
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 8px 2px",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.shotik.textMuted }}>
        shot_14-03-52.png
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#28C840" }}>✓ copied</div>
    </div>
  </div>
);

/** Claude Code chat card; the screenshot thumb parks into its empty slot. */
export const ClaudeCard: React.FC<{ width?: number; showReply?: boolean }> = ({
  width = 680,
  showReply = false,
}) => (
  <div
    style={{
      width,
      borderRadius: 24,
      background: "#14151B",
      border: `1px solid ${theme.shotik.hair}`,
      boxShadow: theme.dark.shadowFloat,
      padding: "22px 26px",
      fontFamily: theme.font.stack,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "#D97757",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 19,
          fontWeight: 800,
        }}
      >
        ✳
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: theme.shotik.text }}>Claude Code</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: theme.shotik.textMuted }}>terminal</div>
    </div>
    <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end", gap: 14 }}>
      {/* empty slot — the MagicMove parks the screenshot exactly here */}
      <div style={{ width: 250, height: 170, flexShrink: 0 }} />
      <div
        style={{
          padding: "12px 18px",
          borderRadius: "16px 16px 4px 16px",
          background: theme.shotik.panelLight,
          fontSize: 19,
          fontWeight: 600,
          color: theme.shotik.text,
        }}
      >
        see it now?
      </div>
    </div>
    <div
      style={{
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: showReply ? 1 : 0,
      }}
    >
      <div style={{ color: "#D97757", fontSize: 18, fontWeight: 800 }}>✳</div>
      <div style={{ fontSize: 19, fontWeight: 600, color: theme.shotik.textMuted }}>
        Yes — the padding is off by 8px. Fixed.
      </div>
      <div style={{ color: "#28C840", fontWeight: 800, fontSize: 18 }}>✓</div>
    </div>
  </div>
);

/** GitHub repo card — the final morph target. */
export const GitHubCard: React.FC<{ width?: number }> = ({ width = 760 }) => (
  <div
    style={{
      width,
      borderRadius: 26,
      background: theme.shotik.panel,
      border: `1px solid ${theme.shotik.hair}`,
      boxShadow: theme.dark.shadowFloat,
      padding: "30px 34px",
      fontFamily: theme.font.stack,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <Img
        src={staticFile("shotik/icon.png")}
        style={{ width: 84, height: 84, borderRadius: 22 }}
      />
      <div>
        <div style={{ fontSize: 31, fontWeight: 800, color: theme.shotik.text, letterSpacing: -0.5 }}>
          gorka2354/shotik
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: theme.shotik.textMuted, marginTop: 4 }}>
          Screenshots for humans & AI — with a built-in MCP server
        </div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
      {["MIT", "Windows 10/11", "MCP built-in"].map((b) => (
        <div
          key={b}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: `1px solid ${theme.shotik.hair}`,
            fontSize: 15,
            fontWeight: 700,
            color: theme.shotik.textMuted,
          }}
        >
          {b}
        </div>
      ))}
      <div
        style={{
          marginLeft: "auto",
          padding: "11px 22px",
          borderRadius: 12,
          background: theme.shotik.accent,
          color: "#fff",
          fontSize: 17,
          fontWeight: 800,
          boxShadow: theme.shotik.ctaGlow,
        }}
      >
        ★ Star on GitHub
      </div>
    </div>
  </div>
);
