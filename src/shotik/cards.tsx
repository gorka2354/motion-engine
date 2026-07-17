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

/** Replica of the real Shotik main window (docs/app-dark.png), EN locale. */
export const ShotikAppWindow: React.FC<{ width?: number }> = ({ width = 860 }) => (
  <div
    style={{
      width,
      height: 560,
      borderRadius: 16,
      background: "#141519",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: theme.dark.shadowFloat,
      display: "flex",
      overflow: "hidden",
      fontFamily: theme.font.stack,
    }}
  >
    {/* sidebar */}
    <div
      style={{
        width: 252,
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "22px 14px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px" }}>
        <Img src={staticFile("shotik/icon.png")} style={{ width: 40, height: 40, borderRadius: 11 }} />
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#F2F3F7" }}>Shotik</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#8B93A3" }}>
            screenshots for humans & AI
          </div>
        </div>
      </div>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { icon: "◱", label: "Shots", active: true },
          { icon: "✦", label: "Claude", dot: true },
          { icon: "⚙", label: "Settings" },
        ].map((n) => (
          <div
            key={n.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 10,
              background: n.active ? "#22242C" : "transparent",
              color: n.active ? "#F2F3F7" : "#A7AEBC",
              fontSize: 16.5,
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            {n.label}
            {n.dot ? (
              <span
                style={{
                  marginLeft: "auto",
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: "#37C871",
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", fontSize: 13, fontWeight: 600, color: "#6E7681", padding: "0 8px" }}>
        v0.1.0 · MIT
      </div>
    </div>
    {/* main */}
    <div style={{ flex: 1, padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 25, fontWeight: 800, color: "#F2F3F7", marginRight: "auto" }}>Shots</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 9,
            background: "#1F6FEB",
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 700,
          }}
        >
          ◱ Area
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 5,
              background: "rgba(255,255,255,0.2)",
              fontSize: 12,
              fontFamily: "Consolas, monospace",
            }}
          >
            PrtSc
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.14)",
            color: "#D5D9E2",
            fontSize: 14.5,
            fontWeight: 700,
          }}
        >
          ⟳ Repeat
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 5,
              background: "rgba(255,255,255,0.10)",
              fontSize: 12,
              fontFamily: "Consolas, monospace",
            }}
          >
            Shift+PrtSc
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: 262,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.09)",
              background: "#1A1C22",
            }}
          >
            <div
              style={{
                height: 150,
                background: "linear-gradient(150deg, #3A3168 0%, #52318C 55%, #3A2E60 100%)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  top: 18,
                  width: 150,
                  height: 92,
                  borderRadius: 6,
                  background: "rgba(16,16,24,0.85)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              />
              {i === 0 ? (
                <div
                  style={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    display: "flex",
                    gap: 4,
                  }}
                >
                  {["#F5474F", "#37C871", "#2F5CFF"].map((c) => (
                    <div key={c} style={{ width: 12, height: 12, background: c }} />
                  ))}
                </div>
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#8B93A3" }}>just now</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#6E7681", fontFamily: "Consolas, monospace" }}>
                2560×1440
              </span>
            </div>
          </div>
        ))}
      </div>
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
