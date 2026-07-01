import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { PhoneFrame } from "../device/PhoneFrame";
import { HomeResumeScreen } from "../screens/HomeResumeScreen";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Scene 6 — CTA: phone pulls back, brand payoff + call to action. */
export const SceneCta: React.FC = () => {
  const frame = useCurrentFrame();

  const appear = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 34], [0.92, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const floatY = frame > 30 ? Math.sin((frame - 30) / 24) * 5 : 0;

  const textO = interpolate(frame, [26, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [26, 48], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const ctaO = interpolate(frame, [40, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaPulse = frame > 62 ? 1 + 0.02 * Math.sin((frame - 62) / 7) : 1;

  return (
    <GradientBackground>
      {/* receding phone */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: "50%",
          translate: `-50% ${floatY}px`,
          scale: String(scale),
          opacity: appear,
        }}
      >
        <PhoneFrame width={560}>
          <HomeResumeScreen />
        </PhoneFrame>
      </div>

      {/* brand payoff + CTA */}
      <div
        style={{
          position: "absolute",
          left: 44,
          right: 44,
          bottom: 96,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          fontFamily: theme.font.family,
          opacity: textO,
          translate: `0 ${textY}px`,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 1, color: theme.color.primary }}>
          tixu
        </div>
        <div
          style={{
            fontSize: 66,
            fontWeight: 800,
            color: theme.color.ink,
            lineHeight: 1.06,
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          Learn AI.
          <br />
          Actually use it.
        </div>
        <div
          style={{
            width: "100%",
            height: 88,
            borderRadius: 20,
            background: theme.color.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 29,
            fontWeight: 800,
            boxShadow: "0 20px 40px -14px rgba(18,124,224,0.65)",
            opacity: ctaO,
            scale: String(ctaPulse),
          }}
        >
          Start free · tixu.ai
        </div>
      </div>
    </GradientBackground>
  );
};
