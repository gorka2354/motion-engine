import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

/**
 * Bybit card face (860×540, credit-card ratio) — rendered once to PNG and
 * baked onto the 3D card in Blender (same pipeline as the laptop screen).
 * Style follows bybit.com/cards: near-black body, brand-yellow wordmark.
 */
export const CardFace: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(128deg, #1A1B21 0%, #101116 46%, #0B0C10 100%)",
      fontFamily: theme.font.stack,
      overflow: "hidden",
      // rounded corners + transparent outside → the PNG alpha shapes the card
      borderRadius: 36,
    }}
  >
    {/* subtle brand-yellow sweep */}
    <div
      style={{
        position: "absolute",
        right: -180,
        top: -220,
        width: 520,
        height: 520,
        borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(247,166,0,0.16), transparent 72%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -140,
        bottom: -260,
        width: 480,
        height: 480,
        borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(247,166,0,0.07), transparent 75%)",
      }}
    />

    {/* wordmark */}
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 52,
        fontSize: 54,
        fontWeight: 800,
        letterSpacing: 2,
        color: theme.bybit.accent,
      }}
    >
      BYBIT
    </div>
    <div
      style={{
        position: "absolute",
        top: 108,
        left: 54,
        fontSize: 19,
        fontWeight: 700,
        letterSpacing: 5,
        color: "rgba(255,255,255,0.45)",
      }}
    >
      CARD
    </div>

    {/* chip */}
    <div
      style={{
        position: "absolute",
        left: 52,
        top: 216,
        width: 104,
        height: 76,
        borderRadius: 14,
        background: "linear-gradient(140deg, #E8C56B 0%, #C79A3B 55%, #A87E28 100%)",
        boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, top: 24, height: 2.5, background: "rgba(20,16,4,0.35)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 49, height: 2.5, background: "rgba(20,16,4,0.35)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 36, width: 2.5, background: "rgba(20,16,4,0.35)" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 66, width: 2.5, background: "rgba(20,16,4,0.35)" }} />
    </div>

    {/* contactless */}
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      style={{ position: "absolute", left: 186, top: 226, opacity: 0.7 }}
      stroke="#fff"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    >
      <path d="M7.5 9.5 a4.2 4.2 0 0 1 0 5" />
      <path d="M10.5 7.2 a8 8 0 0 1 0 9.6" />
      <path d="M13.5 4.9 a11.8 11.8 0 0 1 0 14.2" />
    </svg>

    {/* number */}
    <div
      style={{
        position: "absolute",
        left: 54,
        bottom: 118,
        fontFamily: "Consolas, monospace",
        fontSize: 38,
        letterSpacing: 6,
        color: "rgba(255,255,255,0.88)",
        fontWeight: 600,
      }}
    >
      ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;4519
    </div>

    {/* mastercard */}
    <div style={{ position: "absolute", right: 90, bottom: 40, width: 64, height: 64, borderRadius: 999, background: "#F79E1B", opacity: 0.88 }} />
    <div style={{ position: "absolute", right: 128, bottom: 40, width: 64, height: 64, borderRadius: 999, background: "#EB001B", opacity: 0.92 }} />
  </AbsoluteFill>
);
