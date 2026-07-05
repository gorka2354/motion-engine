import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { GradientBackground } from "../components/GradientBackground";
import { PhoneFrame } from "../device/PhoneFrame";
import { LessonQuizScreen } from "../screens/LessonQuizScreen";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Scene 4 — Inside a lesson: the interactive quiz (tap -> green). The money shot. */
export const SceneLessonQuiz: React.FC = () => {
  const frame = useCurrentFrame();

  const capO = interpolate(frame, [4, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const capY = interpolate(frame, [4, 22], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

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
      {/* caption chip */}
      <div
        style={{
          position: "absolute",
          top: 132,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: capO,
          translate: `0 ${capY}px`,
        }}
      >
        <div
          style={{
            background: theme.color.surface,
            border: `1px solid ${theme.color.hair}`,
            borderRadius: theme.radius.pill,
            padding: "14px 28px",
            fontFamily: theme.font.family,
            fontWeight: 700,
            fontSize: 26,
            color: theme.color.ink,
            boxShadow: theme.color.softShadow,
          }}
        >
          Lessons that actually teach
        </div>
      </div>

      {/* phone with the live quiz */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: "50%",
          translate: `-50% ${rise + floatY}px`,
          opacity: appear,
        }}
      >
        <PhoneFrame width={612}>
          <LessonQuizScreen />
        </PhoneFrame>
      </div>
    </GradientBackground>
  );
};
