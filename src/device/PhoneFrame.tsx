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
        background: theme.titanium.frame,
        boxShadow: theme.shadow.phone,
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
            background: theme.titanium.island,
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
            background: theme.titanium.homeIndicator,
            zIndex: 60,
          }}
        />
      </div>
    </div>
  );
};
