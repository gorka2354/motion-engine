import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { PhoneFrame } from "../device/PhoneFrame";
import { HomeResumeScreen } from "../screens/HomeResumeScreen";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Scene 1 — Hook: headline lands, phone rises into frame on the brand gradient. */
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();

  const wordmark = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const h1Y = interpolate(frame, [4, 24], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const h1O = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const h2Y = interpolate(frame, [16, 36], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const h2O = interpolate(frame, [16, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rise = interpolate(frame, [10, 44], [150, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const appear = interpolate(frame, [10, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floatY = frame > 44 ? Math.sin((frame - 44) / 22) * 7 : 0;

  return (
    <GradientBackground>
      {/* real tixu wordmark */}
      <div
        style={{
          position: "absolute",
          top: 78,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: wordmark,
        }}
      >
        <Img src={staticFile("logo.svg")} style={{ height: 48 }} />
      </div>

      {/* headline */}
      <div
        style={{
          position: "absolute",
          top: 176,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: theme.font.family,
          letterSpacing: -1,
        }}
      >
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: theme.color.ink,
            lineHeight: 1.05,
            opacity: h1O,
            translate: `0 ${h1Y}px`,
          }}
        >
          Everyone has AI.
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 6,
            opacity: h2O,
            translate: `0 ${h2Y}px`,
            color: theme.color.ink,
          }}
        >
          Few use it <span style={{ color: theme.color.primary }}>well</span>.
        </div>
      </div>

      {/* rising phone */}
      <div
        style={{
          position: "absolute",
          top: 486,
          left: "50%",
          translate: `-50% ${rise + floatY}px`,
          opacity: appear,
        }}
      >
        <PhoneFrame width={604}>
          <HomeResumeScreen />
        </PhoneFrame>
      </div>
    </GradientBackground>
  );
};
