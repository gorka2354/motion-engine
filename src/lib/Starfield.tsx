import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { starAt, meteorAt } from "./starfieldMath";

/**
 * A deterministic, pixelated starfield — slow downward drift, per-star twinkle,
 * a two-colour mix (base + a golden minority), and the occasional shooting star.
 * Pure frame-driven (see starfieldMath), so it renders identically every pass.
 * Transparent background: composes over whatever backdrop the scene paints.
 * Engine primitive — colours are props so any brand can restyle it.
 */
export const Starfield: React.FC<{
  count?: number;
  opacity?: number;
  meteors?: boolean;
  baseColor?: string;
  goldColor?: string;
  meteorColor?: string;
}> = ({
  count = 150,
  opacity = 1,
  meteors = true,
  baseColor = "rgb(240,236,216)",
  goldColor = "rgb(224,177,90)",
  meteorColor = "rgb(255,245,232)",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const m = meteors ? meteorAt(frame, width, height) : null;
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <svg width={width} height={height} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: count }, (_, i) => {
          const s = starAt(i, frame, width, height);
          return (
            <rect
              key={i}
              x={Math.round(s.x)}
              y={Math.round(s.y)}
              width={s.size}
              height={s.size}
              fill={s.gold ? goldColor : baseColor}
              opacity={s.alpha}
            />
          );
        })}
        {m && (
          <line
            x1={m.x}
            y1={m.y}
            x2={m.x - m.dx * 46}
            y2={m.y - m.dy * 46}
            stroke={meteorColor}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={m.alpha}
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
