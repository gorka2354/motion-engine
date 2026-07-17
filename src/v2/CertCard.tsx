import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../theme";

/** Static certificate card (the payoff artifact) — animate it from outside. */
export const CertCard: React.FC<{ width?: number }> = ({ width = 560 }) => (
  <div
    style={{
      width,
      background: theme.color.surface,
      border: `1px solid ${theme.color.hair}`,
      borderRadius: 30,
      boxShadow: theme.dark.shadowFloat,
      padding: "30px 36px 28px",
      fontFamily: theme.font.stack,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Img src={staticFile("logo.svg")} style={{ height: 24 }} />
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: theme.color.muted }}>
        CERTIFICATE
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22 }}>
      <div style={{ fontSize: 56, lineHeight: 1 }}>🎓</div>
      <div>
        <div style={{ fontSize: 17, fontWeight: 600, color: theme.color.muted }}>
          Certificate of completion
        </div>
        <div
          style={{
            fontSize: 27,
            fontWeight: 800,
            color: theme.color.ink,
            marginTop: 3,
            letterSpacing: -0.5,
          }}
        >
          Claude Advanced Workflows
        </div>
      </div>
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 22,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: theme.color.muted }}>
        Awarded to Alex Morgan · demo.app
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: theme.color.greenTint,
          border: `1.5px solid ${theme.color.green}`,
          borderRadius: 999,
          padding: "8px 16px",
          fontSize: 15,
          fontWeight: 800,
          color: "#0B8A4F",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#0B8A4F" strokeWidth="2.6">
          <path d="M3.5 9.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Course complete
      </div>
    </div>
  </div>
);
