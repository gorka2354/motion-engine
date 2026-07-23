import React from "react";

/** A bitmap font: a glyph table (rows of "0"/"1" strings) + its cell dimensions. */
export interface PixelGlyphs {
  table: Record<string, string[]>;
  w: number; // glyph width in cells
  h: number; // glyph height in cells
}

export interface GradientStop {
  offset: number;
  color: string;
}

/** Deterministic gradient id from the text (no Math.random — render-safe). */
const gid = (s: string): string => "pxt" + [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

/**
 * Renders text in a bitmap (grid) font as run-length `<rect>`s — the chunky,
 * crisp pixel look you can't get from a webfont. Bring any glyph table; fill with
 * a solid colour or a gradient (SVG stops). Cells render at `px` size; `gap` is the
 * empty columns between glyphs (animate it for a spread-in). Engine primitive —
 * originally built for Zarya's launch-console «ПОЕХАЛИ!».
 */
export const PixelText: React.FC<{
  text: string;
  glyphs: PixelGlyphs;
  px?: number;
  gap?: number;
  fill?: string;
  gradient?: GradientStop[];
  gradientAngle?: { x2: number; y2: number };
  glow?: string; // CSS filter (e.g. a drop-shadow)
  style?: React.CSSProperties;
}> = ({ text, glyphs, px = 16, gap = 1, fill = "#ffffff", gradient, gradientAngle = { x2: 1, y2: 0.35 }, glow, style }) => {
  const { table, w: FW, h: FH } = glyphs;
  const space = table[" "] ?? Array.from({ length: FH }, () => "0".repeat(FW));
  const rects: Array<{ x: number; y: number }> = [];
  let col = 0;
  for (const ch of [...text]) {
    const g = table[ch] ?? space;
    for (let r = 0; r < FH; r++) {
      for (let c = 0; c < FW; c++) {
        if (g[r][c] === "1") rects.push({ x: col + c, y: r });
      }
    }
    col += FW + gap;
  }
  const totalW = Math.max(0, col - gap);
  const id = gid(text);
  return (
    <svg
      width={totalW * px}
      height={FH * px}
      viewBox={`0 0 ${totalW} ${FH}`}
      shapeRendering="crispEdges"
      style={{ filter: glow, ...style }}
    >
      {gradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2={gradientAngle.x2} y2={gradientAngle.y2}>
            {gradient.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
      )}
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1.02} height={1.02} fill={gradient ? `url(#${id})` : fill} />
      ))}
    </svg>
  );
};

/** Pure layout helper (unit-testable): the "on" cells for `text` in a glyph table. */
export const pixelTextCells = (text: string, glyphs: PixelGlyphs, gap = 1): Array<{ x: number; y: number }> => {
  const { table, w: FW, h: FH } = glyphs;
  const out: Array<{ x: number; y: number }> = [];
  let col = 0;
  for (const ch of [...text]) {
    const g = table[ch];
    if (g) {
      for (let r = 0; r < FH; r++) for (let c = 0; c < FW; c++) if (g[r][c] === "1") out.push({ x: col + c, y: r });
    }
    col += FW + gap;
  }
  return out;
};
