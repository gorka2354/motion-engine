import React from "react";
import { theme } from "../theme";

/**
 * Minimal modern laptop shell for 16:9 stages: thin dark bezel, 16:10
 * display, camera dot, metal deck below. Screen content goes in as children
 * (design width = width - 2*bezel).
 */
export const LaptopFrame: React.FC<{
  width?: number;
  children: React.ReactNode;
  screenBg?: string;
  style?: React.CSSProperties;
}> = ({ width = 1440, children, screenBg = "#0B0D12", style }) => {
  const bezel = 16;
  const screenW = width - bezel * 2;
  const screenH = (screenW * 10) / 16;

  return (
    <div style={{ width, ...style }}>
      <div
        style={{
          borderRadius: 22,
          padding: bezel,
          background: theme.titanium.frame,
          boxShadow:
            "0 60px 120px -30px rgba(0,0,0,0.65), inset 0 0 0 2px rgba(255,255,255,0.07)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            width: screenW,
            height: screenH,
            borderRadius: 12,
            overflow: "hidden",
            background: screenBg,
          }}
        >
          {children}
        </div>
        {/* camera dot */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            translate: "-50% 0",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "#05080B",
            boxShadow: "inset 0 0 2px rgba(120,160,255,0.7)",
          }}
        />
      </div>
      {/* deck */}
      <div
        style={{
          position: "relative",
          width: width * 1.09,
          marginLeft: -(width * 0.045),
          height: 26,
          borderRadius: "0 0 22px 22px",
          background: "linear-gradient(180deg, #3A424B 0%, #171B21 55%, #0B0E12 100%)",
          boxShadow: "0 40px 70px -24px rgba(0,0,0,0.7)",
        }}
      >
        {/* thumb scoop */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            translate: "-50% 0",
            width: 190,
            height: 11,
            borderRadius: "0 0 14px 14px",
            background: "linear-gradient(180deg, #10141A, #232932)",
          }}
        />
      </div>
    </div>
  );
};
