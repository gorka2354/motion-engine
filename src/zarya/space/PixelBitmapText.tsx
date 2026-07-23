import React from "react";
import { PixelText, type PixelGlyphs, type GradientStop } from "../../lib/PixelText";

/**
 * Zarya's on-canvas 5×7 bitmap font (verbatim from the app's LaunchPad.tsx `PXF`)
 * — the chunky blocky pixel type the launch console draws «ПОЕХАЛИ!» and the
 * 3·2·1 countdown in. Exposed as a glyph table for the engine's <PixelText>.
 */
const PXF: Record<string, string[]> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "00110", "00001", "00001", "11110"],
  П: ["11111", "10001", "10001", "10001", "10001", "10001", "10001"],
  О: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  Е: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  Х: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  А: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  Л: ["00111", "01001", "01001", "01001", "01001", "01001", "10001"],
  И: ["10001", "10001", "10011", "10101", "11001", "10001", "10001"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
};

export const ZARYA_GLYPHS: PixelGlyphs = { table: PXF, w: 5, h: 7 };

/** The brand red→orange→gold gradient stops (Заря·Космос accent). */
const BRAND_GRAD: GradientStop[] = [
  { offset: 0, color: "#e2231a" },
  { offset: 0.52, color: "#f0662e" },
  { offset: 1, color: "#e0b15a" },
];

/** Thin Zarya wrapper over the engine <PixelText> — the app's pixel font + brand gradient. */
export const PixelBitmapText: React.FC<{
  text: string;
  px?: number;
  gap?: number;
  fill?: string;
  gradient?: boolean;
  glow?: string;
  style?: React.CSSProperties;
}> = ({ text, px = 16, gap = 1, fill = "#f2e9d6", gradient = false, glow, style }) => (
  <PixelText
    text={text}
    glyphs={ZARYA_GLYPHS}
    px={px}
    gap={gap}
    fill={fill}
    gradient={gradient ? BRAND_GRAD : undefined}
    glow={glow}
    style={style}
  />
);
