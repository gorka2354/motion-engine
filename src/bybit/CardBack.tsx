import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

/**
 * Bybit card BACK (860×540) — objects shown from every angle get designed
 * from every angle: magstripe, signature strip, small wordmark, fine print.
 */
export const CardBack: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(232deg, #17181D 0%, #0F1014 50%, #0B0C10 100%)",
      fontFamily: theme.font.stack,
      overflow: "hidden",
      borderRadius: 36,
    }}
  >
    {/* magstripe */}
    <div
      style={{
        position: "absolute",
        top: 58,
        left: 0,
        right: 0,
        height: 92,
        background: "linear-gradient(180deg, #05060A 0%, #101218 55%, #05060A 100%)",
      }}
    />
    {/* signature strip + CVV */}
    <div
      style={{
        position: "absolute",
        top: 196,
        left: 52,
        width: 520,
        height: 64,
        borderRadius: 8,
        background:
          "repeating-linear-gradient(0deg, #D9DBE0 0px, #D9DBE0 8px, #C9CCD3 8px, #C9CCD3 16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 18,
      }}
    >
      <span style={{ fontFamily: "Consolas, monospace", fontSize: 28, fontWeight: 700, color: "#23252B", fontStyle: "italic" }}>
        •••
      </span>
    </div>
    {/* fine print */}
    <div
      style={{
        position: "absolute",
        top: 292,
        left: 54,
        width: 640,
        fontSize: 13.5,
        lineHeight: 1.6,
        fontWeight: 600,
        color: "rgba(255,255,255,0.28)",
      }}
    >
      This card is issued pursuant to licence by Mastercard International.
      Use of this card is subject to the cardholder agreement.
    </div>
    {/* small wordmark + hologram hint */}
    <div
      style={{
        position: "absolute",
        right: 54,
        bottom: 44,
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: 1.5,
        color: theme.bybit.accent,
        opacity: 0.9,
      }}
    >
      BYBIT
    </div>
    <div
      style={{
        position: "absolute",
        left: 54,
        bottom: 40,
        width: 66,
        height: 44,
        borderRadius: 10,
        background:
          "linear-gradient(120deg, rgba(180,200,255,0.35), rgba(255,210,160,0.3) 40%, rgba(170,255,220,0.3) 70%, rgba(200,180,255,0.32))",
        opacity: 0.6,
      }}
    />
  </AbsoluteFill>
);
