import React from "react";
import { Img, staticFile } from "remotion";

/**
 * The app's own pixel rocket sprite (logo-rocket-48.png), rendered pixelated so
 * it stays chunky/Stardew at any scale — matches Zarya's launch-pad + titlebar
 * rocket. Replaces the smooth SVG so the promo's rocket IS the app's rocket.
 */
export const PixelRocket: React.FC<{ size?: number; glow?: boolean; style?: React.CSSProperties }> = ({
  size = 120,
  glow = false,
  style,
}) => (
  <Img
    src={staticFile("zarya/logo-rocket-48.png")}
    style={{
      width: size,
      height: size,
      imageRendering: "pixelated",
      filter: glow ? "drop-shadow(0 0 16px rgba(226,35,26,0.6))" : undefined,
      ...style,
    }}
  />
);

/** The pixel "Заря" sunrise sprite (logo-zarya-64.png) — a dawn mark for the boot/CTA. */
export const PixelSunrise: React.FC<{ size?: number; glow?: boolean; style?: React.CSSProperties }> = ({
  size = 64,
  glow = false,
  style,
}) => (
  <Img
    src={staticFile("zarya/logo-zarya-64.png")}
    style={{
      width: size,
      height: size,
      imageRendering: "pixelated",
      filter: glow ? "drop-shadow(0 0 20px rgba(240,102,46,0.55))" : undefined,
      ...style,
    }}
  />
);
