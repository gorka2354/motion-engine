import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { theme } from "../../theme";
import { LessonBanner } from "../LumoArt";

const L = theme.lumo;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const OPTIONS = [
  { label: "Keep it short and vague", correct: false },
  { label: "Give clear context and a goal", correct: true },
  { label: "Use as many words as possible", correct: false },
];

const OPTION_H = 76;
const OPTION_GAP = 14;

const CheckBadge: React.FC<{ progress: number }> = ({ progress }) => {
  const scale = interpolate(progress, [0, 1], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const opacity = interpolate(progress, [0, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        right: 18,
        top: "50%",
        translate: "0 -50%",
        width: 34,
        height: 34,
        borderRadius: 999,
        background: theme.color.green,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        scale: String(scale),
        opacity,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2.6">
        <path d="M4 9.5l3 3 7-7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Option: React.FC<{
  label: string;
  correct: boolean;
  select: number;
  tap: number;
}> = ({ label, correct, select, tap }) => {
  const s = correct ? select : 0;
  const bg = interpolateColors(s, [0, 1], ["#FFFFFF", theme.color.greenTint]);
  const border = interpolateColors(
    s,
    [0, 1],
    ["rgba(3,20,35,0.10)", theme.color.green],
  );
  const dim = correct ? 1 : interpolate(select, [0, 1], [1, 0.5]);
  const bounce = correct ? 1 + 0.05 * Math.sin(Math.min(select, 1) * Math.PI) : 1;

  const rippleSize = interpolate(tap, [0, 1], [20, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleOpacity = interpolate(tap, [0, 1], [0.28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        height: OPTION_H,
        borderRadius: 18,
        background: bg,
        border: `2px solid ${border}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 24,
        paddingRight: 60,
        opacity: dim,
        scale: String(bounce),
        overflow: "hidden",
      }}
    >
      {correct && tap > 0 && tap < 1 ? (
        <div
          style={{
            position: "absolute",
            left: "38%",
            top: "50%",
            translate: "-50% -50%",
            width: rippleSize,
            height: rippleSize,
            borderRadius: 999,
            background: theme.color.green,
            opacity: rippleOpacity,
          }}
        />
      ) : null}
      <span
        style={{
          fontFamily: theme.font.stack,
          fontWeight: 600,
          fontSize: 21,
          color: theme.color.ink,
          zIndex: 2,
        }}
      >
        {label}
      </span>
      {correct ? <CheckBadge progress={select} /> : null}
    </div>
  );
};

/**
 * Lumo lesson interior with an inline quiz. A fingertip taps the correct
 * answer, it fills with a check, and Next lights up. With `deep`, it scrolls
 * to a second interaction (yes/no) and answers it too.
 */
export const LumoQuiz: React.FC<{ deep?: boolean }> = ({ deep = false }) => {
  const frame = useCurrentFrame();

  const tap = interpolate(frame, [44, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const select = interpolate(frame, [60, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const scrollY = deep
    ? interpolate(frame, [100, 132], [0, -380], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.65, 0, 0.35, 1),
      })
    : 0;
  const tap2 = deep
    ? interpolate(frame, [146, 156], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      })
    : 0;
  const select2 = deep
    ? interpolate(frame, [156, 180], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      })
    : 0;
  const finger2O = deep
    ? interpolate(frame, [134, 144, 166, 176], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const press2 = interpolate(tap2, [0.7, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const yesBg = interpolateColors(select2, [0, 1], ["#FFFFFF", theme.color.greenTint]);
  const yesBorder = interpolateColors(select2, [0, 1], ["rgba(3,20,35,0.10)", theme.color.green]);
  const yesBounce = 1 + 0.05 * Math.sin(Math.min(select2, 1) * Math.PI);

  const fingerOpacity = interpolate(frame, [30, 42, 96, 108], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const press = interpolate(tap, [0.7, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fingerScale = 1 - press * 0.14;
  const correctIndex = OPTIONS.findIndex((o) => o.correct);
  const fingerTop = correctIndex * (OPTION_H + OPTION_GAP) + OPTION_H / 2;

  const nextBg = interpolateColors(select, [0, 1], ["#D9CDD1", L.accentSolid]);
  const pulseFrom = deep ? 184 : 90;
  const nextPulse =
    frame > pulseFrom ? 1 + 0.02 * Math.sin((frame - pulseFrom) / 7) : 1;

  return (
    <AbsoluteFill
      style={{
        background: theme.color.surface,
        fontFamily: theme.font.stack,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* app bar */}
      <div
        style={{
          paddingTop: 66,
          paddingLeft: 26,
          paddingRight: 26,
          paddingBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.color.hair}`,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" stroke={theme.color.ink} strokeWidth="2.4" fill="none">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 22, fontWeight: 700, color: theme.color.ink }}>
          Your First Real Prompt
        </span>
        <svg width="24" height="24" viewBox="0 0 24 24" stroke={theme.color.ink} strokeWidth="2.2" fill="none">
          <path d="M5 3v18M5 4h11l-2 4 2 4H5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* body (scrolls in deep mode) */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ padding: "26px 30px 0", translate: `0 ${scrollY}px` }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: theme.color.ink,
              lineHeight: 1.15,
              letterSpacing: -0.4,
            }}
          >
            You&apos;ve Used AI Before 👋
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: theme.color.body,
              lineHeight: 1.5,
              marginTop: 14,
            }}
          >
            You&apos;ve typed a question into a chatbot and hoped for the best.
            This lesson turns that into prompts that get real results.
          </div>

          {/* lesson illustration (self-contained coral banner) */}
          <div style={{ marginTop: 20 }}>
            <LessonBanner height={232} />
          </div>

          {/* quiz */}
          <div style={{ marginTop: 26 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: theme.color.muted,
              }}
            >
              Select one that applies
            </div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 700,
                color: theme.color.ink,
                marginTop: 8,
                marginBottom: 18,
                lineHeight: 1.25,
              }}
            >
              What makes a prompt actually work?
            </div>

            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: OPTION_GAP,
              }}
            >
              {OPTIONS.map((o) => (
                <Option
                  key={o.label}
                  label={o.label}
                  correct={o.correct}
                  select={select}
                  tap={tap}
                />
              ))}

              {/* fingertip */}
              <div
                style={{
                  position: "absolute",
                  left: "42%",
                  top: fingerTop,
                  translate: "0 -20%",
                  width: 62,
                  height: 62,
                  borderRadius: 999,
                  background: "rgba(3,20,35,0.16)",
                  border: "2px solid rgba(3,20,35,0.28)",
                  opacity: fingerOpacity,
                  scale: String(fingerScale),
                }}
              />
            </div>
          </div>

          {/* deep mode: a second interaction type (yes/no) */}
          {deep ? (
            <div style={{ marginTop: 36, paddingBottom: 40 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: theme.color.muted,
                }}
              >
                Answer with “yes” or “no”
              </div>
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 700,
                  color: theme.color.ink,
                  marginTop: 8,
                  marginBottom: 18,
                  lineHeight: 1.25,
                }}
              >
                Can you finish this course on the free plan?
              </div>
              <div style={{ position: "relative", display: "flex", gap: 14 }}>
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    height: OPTION_H,
                    borderRadius: 18,
                    background: yesBg,
                    border: `2px solid ${yesBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: theme.color.ink,
                    scale: String(yesBounce),
                  }}
                >
                  Yes
                  <CheckBadge progress={select2} />
                </div>
                <div
                  style={{
                    flex: 1,
                    height: OPTION_H,
                    borderRadius: 18,
                    background: "#fff",
                    border: "2px solid rgba(3,20,35,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: theme.color.ink,
                    opacity: 1 - 0.5 * select2,
                  }}
                >
                  No
                </div>
                {/* second fingertip */}
                <div
                  style={{
                    position: "absolute",
                    left: "26%",
                    top: "54%",
                    width: 62,
                    height: 62,
                    borderRadius: 999,
                    background: "rgba(3,20,35,0.16)",
                    border: "2px solid rgba(3,20,35,0.28)",
                    translate: "-50% -50%",
                    opacity: finger2O,
                    scale: String(1 - press2 * 0.14),
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* sticky Next */}
      <div style={{ padding: "16px 30px 30px" }}>
        <div
          style={{
            height: 68,
            borderRadius: theme.radius.button,
            background: nextBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 24,
            fontWeight: 700,
            scale: String(nextPulse),
            boxShadow: select > 0.5 ? L.buttonGlow : "none",
          }}
        >
          Next
        </div>
      </div>
    </AbsoluteFill>
  );
};
