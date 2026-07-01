import React from "react";
import { useCurrentFrame } from "remotion";
import { GradientBackground } from "./GradientBackground";
import { CaptionChip } from "./CaptionChip";
import { PhoneFrame } from "../device/PhoneFrame";

/**
 * Standard scene stage: brand gradient + optional caption chip + a gently
 * floating phone. Entrance motion is intentionally left to the scene transitions
 * (slide/wipe/flip) so the phone is fully present as it moves in — no double
 * animation, no two static phones crossfading.
 */
export const PhoneStage: React.FC<{
  caption?: string;
  phoneWidth?: number;
  phoneTop?: number;
  children: React.ReactNode;
}> = ({ caption, phoneWidth = 610, phoneTop = 300, children }) => {
  const frame = useCurrentFrame();
  const floatY = Math.sin(frame / 24) * 6;

  return (
    <GradientBackground>
      {caption ? <CaptionChip text={caption} /> : null}
      <div
        style={{
          position: "absolute",
          top: phoneTop,
          left: "50%",
          translate: `-50% ${floatY}px`,
        }}
      >
        <PhoneFrame width={phoneWidth}>{children}</PhoneFrame>
      </div>
    </GradientBackground>
  );
};
