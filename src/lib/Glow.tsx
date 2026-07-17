import React from "react";
import { theme } from "../theme";
import { hexToRgba } from "./color";

/**
 * Soft double-layer glow that follows the rendered silhouette of its
 * children (drop-shadow based — works on text, cards, logos, SVG).
 */
export const Glow: React.FC<{
  children: React.ReactNode;
  /** Hex color (converted with strength) or any full CSS color. */
  color?: string;
  radius?: number;
  /** 0..1 — alpha of the glow layers when `color` is hex. */
  strength?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  color = theme.color.primary,
  radius = 36,
  strength = 0.5,
  style,
}) => {
  const isHex = color.startsWith("#");
  const outer = isHex ? hexToRgba(color, strength) : color;
  const inner = isHex ? hexToRgba(color, Math.min(1, strength * 0.8)) : color;
  return (
    <div
      style={{
        filter: `drop-shadow(0 0 ${radius * 0.45}px ${inner}) drop-shadow(0 0 ${radius}px ${outer})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
