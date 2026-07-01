import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { GradientBackground } from "./GradientBackground";
import { CaptionChip } from "./CaptionChip";
import { PhoneFrame } from "../device/PhoneFrame";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Standard scene stage: brand gradient + optional caption chip + a phone that
 * rises in and gently floats. Keeps the phone size/position consistent across
 * scenes so transitions feel like the content morphing, not the device jumping.
 */
export const PhoneStage: React.FC<{
  caption?: string;
  phoneWidth?: number;
  phoneTop?: number;
  children: React.ReactNode;
}> = ({ caption, phoneWidth = 610, phoneTop = 300, children }) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 26], [70, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const appear = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floatY = frame > 30 ? Math.sin((frame - 30) / 24) * 6 : 0;

  return (
    <GradientBackground>
      {caption ? <CaptionChip text={caption} /> : null}
      <div
        style={{
          position: "absolute",
          top: phoneTop,
          left: "50%",
          translate: `-50% ${rise + floatY}px`,
          opacity: appear,
        }}
      >
        <PhoneFrame width={phoneWidth}>{children}</PhoneFrame>
      </div>
    </GradientBackground>
  );
};
