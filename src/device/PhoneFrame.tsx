import React from "react";
import { theme } from "../theme";
import { StatusBar } from "./StatusBar";

export const PHONE_ASPECT = 19.5 / 9; // iPhone-ish screen ratio

/**
 * Reusable device shell. Renders a titanium-style frame with a rounded screen,
 * dynamic island, status bar and home indicator. Screens go in as children.
 */
export const PhoneFrame: React.FC<{
  width?: number;
  statusBar?: boolean;
  statusTime?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width = 604, statusBar = true, statusTime, children, style }) => {
  const bezel = 18;
  const screenW = width - bezel * 2;
  const screenH = screenW * PHONE_ASPECT;
  const height = screenH + bezel * 2;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: theme.radius.phone,
        padding: bezel,
        background:
          "linear-gradient(150deg, #3A424B 0%, #12161B 46%, #05070A 100%)",
        boxShadow:
          "0 80px 140px -40px rgba(9,46,92,0.45), 0 30px 60px -30px rgba(9,46,92,0.38), inset 0 0 0 2px rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: screenW,
          height: screenH,
          borderRadius: theme.radius.screen,
          overflow: "hidden",
          background: theme.color.surface,
        }}
      >
        {children}
        {statusBar ? <StatusBar time={statusTime} /> : null}
        {/* dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            translate: "-50% 0",
            width: 116,
            height: 33,
            borderRadius: 999,
            background: "#05080B",
            zIndex: 60,
          }}
        />
        {/* home indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            translate: "-50% 0",
            width: 132,
            height: 6,
            borderRadius: 999,
            background: "rgba(3,20,35,0.26)",
            zIndex: 60,
          }}
        />
      </div>
    </div>
  );
};
