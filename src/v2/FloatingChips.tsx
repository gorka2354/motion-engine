import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { clamp01, EASE_OUT, SPRING } from "./anim";

const CHIPS = [
  { logo: "providers/openai.svg", x: 128, y: 640, delay: 0, drift: 0.9 },
  { logo: "providers/google.svg", x: 952, y: 760, delay: 6, drift: 1.15 },
  { logo: "providers/runway.svg", x: 118, y: 1280, delay: 12, drift: 1.05 },
  { logo: "providers/flux.svg", x: 958, y: 1420, delay: 18, drift: 0.85 },
];

/**
 * Glassy provider chips that drift out from behind the phone with parallax
 * during the AI-tools beat — the "features orbit the device" Apple shot.
 */
export const FloatingChips: React.FC<{ from: number; to: number }> = ({
  from,
  to,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < from || f > to + 2) return null;

  return (
    <>
      {CHIPS.map((c, i) => {
        const t = f - from - c.delay;
        const enter = t < 0 ? 0 : spring({ frame: t, fps, config: SPRING.pop });
        const exit = EASE_OUT(clamp01((f - (to - 16)) / 16));
        const opacity = clamp01(enter) * (1 - exit);
        if (opacity <= 0.001) return null;

        const towardCenter = c.x < 540 ? 1 : -1;
        const startX = c.x + towardCenter * 150; // emerge from behind the phone
        const x = startX + (c.x - startX) * enter;
        const bob = Math.sin((f - from) * 0.045 + i * 1.7) * 9 * c.drift;
        const rot = Math.sin((f - from) * 0.03 + i) * 3;

        return (
          <div
            key={c.logo}
            style={{
              position: "absolute",
              left: x,
              top: c.y + bob,
              width: 118,
              height: 118,
              borderRadius: 30,
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${theme.color.hair}`,
              boxShadow: theme.dark.shadowFloat,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              translate: "-50% -50%",
              rotate: `${rot}deg`,
              scale: String(0.7 + 0.3 * enter),
              opacity,
              filter: `blur(${(1 - clamp01(enter)) * 8}px)`,
              zIndex: 40,
            }}
          >
            <Img
              src={staticFile(c.logo)}
              style={{ width: 58, height: 58, objectFit: "contain" }}
            />
          </div>
        );
      })}
    </>
  );
};
