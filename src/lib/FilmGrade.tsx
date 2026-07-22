import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * A cinematic finishing pass — the "premium look" a product promo gets in grade.
 *
 * WHY CSS/SVG, NOT @remotion/effects. The Remotion effects library is real and good, but it
 * applies to MEDIA elements (`<Video>`, `<Img>`, `<Solid>`); to grade a whole HTML composition it
 * needs `<HtmlInCanvas>`, which (per the docs, fetched live) requires Chrome 149+ behind an unstable
 * `canvas-draw-element` flag and a spec the Chrome team may change. That is the wrong foundation for
 * a render pipeline that has to be reproducible. Every layer here is plain CSS/SVG: deterministic,
 * headless-safe today, no new runtime. @remotion/effects stays the right tool for a per-element
 * media effect (a glow on a hero <Img>), not a full-frame grade.
 *
 * The look is four subtle layers, in order: a tonal grade on the content, film grain (independent
 * per frame, the way real grain is), a vignette, and a slow warm light leak. Subtle on purpose —
 * "premium" is a whisper, not a filter stack you notice.
 */

/** One SVG turbulence tile as a data-URI background — fractal noise, seeded so it is deterministic. */
const grainTile = (seed: number): string => {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' ` +
    `seed='${seed}' stitchTiles='stitch'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

export interface FilmGradeProps {
  /** Overall intensity, 0 (off) to ~1.5 (strong). 1 is a tasteful default. */
  strength?: number;
  /** Warm leak tint; a cool promo can pass its accent instead. */
  leakColor?: string;
  children?: React.ReactNode;
}

export const FilmGrade: React.FC<FilmGradeProps> = ({
  strength = 1,
  leakColor = "255, 196, 140",
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const s = strength;

  // Grain flips to a fresh noise field every frame — that per-frame independence is what reads as
  // film rather than a dirty lens. A slow modulo keeps the seed a small integer.
  const grain = grainTile(frame % 71);

  // The leak breathes across the whole piece and drifts, so it never sits as a static stain.
  const t = durationInFrames > 1 ? frame / durationInFrames : 0;
  const leakOpacity = interpolate(
    Math.sin(t * Math.PI * 2 - Math.PI / 2),
    [-1, 1],
    [0.02 * s, 0.14 * s],
  );
  const leakX = interpolate(t, [0, 1], [72, 88]);
  const leakY = interpolate(t, [0, 1], [8, 22]);

  return (
    <AbsoluteFill>
      {/* content, with a gentle tonal grade — a touch more contrast, saturation and lift */}
      <AbsoluteFill
        style={{
          filter: `contrast(${1 + 0.06 * s}) saturate(${1 + 0.08 * s}) brightness(${1 + 0.015 * s})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* film grain */}
      <AbsoluteFill
        style={{
          backgroundImage: grain,
          backgroundRepeat: "repeat",
          mixBlendMode: "overlay",
          opacity: 0.09 * s,
          pointerEvents: "none",
        }}
      />

      {/* vignette — pull the eye to centre, darken the corners */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,${0.42 * s}) 100%)`,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      {/* warm light leak, drifting and breathing */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${leakX}% ${leakY}%, rgba(${leakColor}, 0.9) 0%, rgba(${leakColor}, 0) 42%)`,
          mixBlendMode: "screen",
          opacity: leakOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
