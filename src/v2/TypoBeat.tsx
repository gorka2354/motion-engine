import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { clamp01, springWindow } from "./anim";

/**
 * Apple-style typography beat: big tight headline (+ optional sub-line) that
 * springs into place (slight overshoot) and softly blurs away at the end of
 * its window. Positioned in viewport coordinates, independent of the camera.
 * Colors are tuned for the dark stage.
 */
export const TypoBeat: React.FC<{
  title: string;
  sub?: string;
  from: number;
  to: number;
  y?: number;
  size?: number;
  accentWord?: string;
  /** Brand overrides (default: dark-stage tixu palette). */
  color?: string;
  subColor?: string;
  accentColor?: string;
}> = ({
  title,
  sub,
  from,
  to,
  y = 190,
  size = 76,
  accentWord,
  color = theme.dark.text,
  subColor = theme.dark.textMuted,
  accentColor = theme.dark.accent,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, exit, opacity } = springWindow(f, fps, from, to);
  if (opacity <= 0.001) return null;

  const eIn = clamp01(enter);
  const blur = 14 * (1 - eIn) + 12 * exit;
  const ty = 34 * (1 - enter) - 22 * exit;

  const renderTitle = () => {
    if (!accentWord || !title.includes(accentWord)) return title;
    const [a, b] = title.split(accentWord);
    return (
      <>
        {a}
        <span style={{ color: accentColor }}>{accentWord}</span>
        {b}
      </>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: theme.font.family,
        opacity,
        translate: `0 ${ty}px`,
        filter: `blur(${blur}px)`,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: size,
          fontWeight: theme.type.weightHeading,
          letterSpacing: theme.type.letterSpacing,
          lineHeight: theme.type.lineHeight,
          color,
        }}
      >
        {renderTitle()}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: theme.type.sub,
            fontWeight: theme.type.weightSub,
            color: subColor,
            marginTop: 16,
            letterSpacing: -0.3,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
