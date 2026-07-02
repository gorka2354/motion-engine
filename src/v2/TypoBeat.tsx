import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { window01 } from "./anim";

/**
 * Apple-style typography beat: big tight headline (+ optional sub-line) that
 * blur-ups into place and softly blurs away at the end of its window.
 * Positioned in viewport coordinates, independent of the camera.
 */
export const TypoBeat: React.FC<{
  title: string;
  sub?: string;
  from: number;
  to: number;
  y?: number;
  size?: number;
  accentWord?: string;
}> = ({ title, sub, from, to, y = 190, size = 76, accentWord }) => {
  const f = useCurrentFrame();
  const { enter, exit, opacity } = window01(f, from, to);
  if (opacity <= 0.001) return null;

  const blur = 16 * (1 - enter) + 12 * exit;
  const ty = 30 * (1 - enter) - 22 * exit;

  const renderTitle = () => {
    if (!accentWord || !title.includes(accentWord)) return title;
    const [a, b] = title.split(accentWord);
    return (
      <>
        {a}
        <span style={{ color: theme.color.primary }}>{accentWord}</span>
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
          fontWeight: 800,
          letterSpacing: -2,
          lineHeight: 1.04,
          color: theme.color.ink,
        }}
      >
        {renderTitle()}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: theme.color.muted,
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
