import React from "react";
import { Z, FONT } from "../zarya.style";

/**
 * The ЗАРЯ // ОРБИТА-1 wordmark in Pixelify Sans — the app's identity mark.
 * `size` sizes the ЗАРЯ; the // ОРБИТА-1 tag scales from it. Set `tag={false}`
 * for the bare hero logo.
 */
export const PixelWordmark: React.FC<{
  size?: number;
  tag?: boolean;
  glow?: boolean;
  color?: string;
}> = ({ size = 22, tag = true, glow = false, color = Z.accent }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: size * 0.42, lineHeight: 1 }}>
    <span
      style={{
        fontFamily: FONT.pixel,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: size * 0.06,
        color,
        textShadow: glow ? `0 0 ${size * 0.9}px rgba(226,35,26,0.55)` : undefined,
      }}
    >
      ЗАРЯ
    </span>
    {tag && (
      <span
        style={{
          fontFamily: FONT.tech,
          fontWeight: 500,
          fontSize: size * 0.62,
          letterSpacing: size * 0.09,
          color: Z.accent2,
          opacity: 0.92,
        }}
      >
        // ОРБИТА-1
      </span>
    )}
  </div>
);
