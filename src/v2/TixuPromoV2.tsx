import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { PhoneFrame } from "../device/PhoneFrame";
import { HomeResumeScreen } from "../screens/HomeResumeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { PathScreen } from "../screens/PathScreen";
import { LessonQuizScreen } from "../screens/LessonQuizScreen";
import { AiToolsScreen } from "../screens/AiToolsScreen";
import { LivingBackground } from "./LivingBackground";
import { ScreenFlow } from "./ScreenFlow";
import { TypoBeat } from "./TypoBeat";
import { TapDot } from "./TapDot";
import { FloatingChips } from "./FloatingChips";
import { FloatingCertificate } from "./FloatingCertificate";
import { clamp01, kf, window01 } from "./anim";

export const V2_DURATION = 1320; // 44s @ 30fps

const PHONE_W = 640;

// ── Beat map (global frames) ────────────────────────────────────────────────
const NAV = { profile: 150, library: 265, path: 420, quiz: 585, tools: 910 } as const;
const ZOOM = { in: [500, 556], out: [800, 855] } as const;
const CERT = { from: 810, to: 905 } as const;
const CHIPS = { from: 935, to: 1010 } as const;
const END = { start: 1160, settle: 1215 } as const;

/** Screen coords: Continue button center inside the 604-wide home screen. */
const HOME_BTN_Y = 604 * (19.5 / 9) - 44 - 34;

/**
 * V2 master — one continuous shot, deep on features. The phone never leaves
 * the frame: screens navigate inside the device (iOS push / tab switch), the
 * camera zooms into the display for the lesson beats and pulls back out.
 * Feature depth: personal plan → library (challenges, tracks, careers) →
 * course path → two lesson interactions → certificate payoff → AI hub with a
 * live chat demo. Big typography blur-ups carry the story.
 */
export const TixuPromoV2: React.FC = () => {
  const f = useCurrentFrame();

  // ── Camera ──
  const zoomAmt = kf(f, [
    [ZOOM.in[0], 0],
    [ZOOM.in[1], 1],
    [ZOOM.out[0], 1],
    [ZOOM.out[1], 0],
  ]);
  const y = kf(f, [
    [0, 1250],
    [28, 1250],
    [95, 170],
    [ZOOM.in[0], 170],
    [ZOOM.in[1], 20],
    [ZOOM.out[0], 20],
    [ZOOM.out[1], 170],
    [END.start, 170],
    [END.settle, -160],
  ]);
  const s = kf(f, [
    [0, 0.9],
    [95, 0.94],
    [ZOOM.in[0], 0.94],
    [ZOOM.in[1], 1.5],
    [ZOOM.out[0], 1.5],
    [ZOOM.out[1], 0.96],
    [END.start, 0.96],
    [END.settle, 0.78],
  ]);
  const rx = kf(f, [
    [0, 14],
    [95, 0],
  ]);
  const ry = Math.sin(f * 0.02) * 2.2 * (1 - zoomAmt);
  const floatY = Math.sin(f * 0.045) * 5 * (1 - 0.7 * zoomAmt);
  const phoneO = kf(f, [
    [30, 0],
    [55, 1],
  ]);

  // ── Persistent top wordmark (hidden during zoom and the ending block) ──
  const logoO =
    kf(f, [
      [8, 0],
      [30, 0.92],
    ]) *
    (1 - zoomAmt) *
    (1 - clamp01((f - 1140) / 20));

  // ── Glass sweep across the display (twice, very subtle) ──
  const sweeps = [112, 990].map((start) => {
    const p = clamp01((f - start) / 70);
    return { p, o: p > 0 && p < 1 ? 0.1 * Math.sin(Math.PI * p) : 0 };
  });

  // ── Ending block ──
  const endLogo = window01(f, 1170, 1400);
  const endTitle = window01(f, 1182, 1400);
  const endCta = window01(f, 1196, 1400);
  const ctaPulse = f > 1222 ? 1 + 0.012 * Math.sin((f - 1222) / 8) : 1;

  return (
    <LivingBackground>
      {/* persistent wordmark */}
      <div
        style={{
          position: "absolute",
          top: 84,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: logoO,
          zIndex: 60,
        }}
      >
        <Img src={staticFile("logo.svg")} style={{ height: 40 }} />
      </div>

      {/* ── typography beats ── */}
      <TypoBeat title="Everyone has AI." from={8} to={54} y={520} size={theme.type.hero} />
      <TypoBeat
        title="Few use it well."
        accentWord="well"
        from={50}
        to={104}
        y={520}
        size={theme.type.hero}
      />
      <TypoBeat
        title="A plan that knows you."
        sub="Your focus, your goal, your pace."
        from={158}
        to={250}
        y={168}
        size={theme.type.beat}
      />
      <TypoBeat
        title="Courses, challenges, careers."
        sub="A track for whatever you're after."
        from={273}
        to={405}
        y={168}
        size={theme.type.beatWide}
      />
      <TypoBeat
        title="One clear path."
        sub="Chapters, lessons, a certificate."
        from={428}
        to={495}
        y={168}
        size={theme.type.beat}
      />
      <TypoBeat
        title="Finish certified."
        sub="A personal certificate for every course."
        from={815}
        to={905}
        y={168}
        size={theme.type.beat}
      />
      <TypoBeat
        title="Every AI. One app."
        sub="ChatGPT · Gemini · Runway · Flux — built in."
        from={920}
        to={1130}
        y={168}
        size={theme.type.beat}
      />

      {/* ── camera + device ── */}
      <AbsoluteFill style={{ perspective: 1600 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            translate: "-50% -50%",
            transform: `translate(0px, ${y + floatY}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`,
            opacity: phoneO,
          }}
        >
          <PhoneFrame width={PHONE_W}>
            <ScreenFlow
              steps={[
                {
                  at: 0,
                  kind: "push",
                  node: (
                    <>
                      <HomeResumeScreen />
                      <TapDot x="50%" y={HOME_BTN_Y} from={112} pressAt={132} to={150} />
                    </>
                  ),
                },
                { at: NAV.profile, kind: "push", node: <ProfileScreen /> },
                { at: NAV.library, kind: "push", node: <LibraryScreen /> },
                { at: NAV.path, kind: "push", node: <PathScreen /> },
                { at: NAV.quiz, kind: "push", node: <LessonQuizScreen deep /> },
                { at: NAV.tools, kind: "tab", node: <AiToolsScreen deep /> },
              ]}
            />
          </PhoneFrame>
          {/* glass light sweep */}
          <div
            style={{
              position: "absolute",
              inset: 18,
              borderRadius: theme.radius.screen,
              overflow: "hidden",
              pointerEvents: "none",
              zIndex: 70,
            }}
          >
            {sweeps.map((sw, i) =>
              sw.o > 0 ? (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: "-30%",
                    left: `${-60 + sw.p * 200}%`,
                    width: "42%",
                    height: "160%",
                    rotate: "14deg",
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
                    opacity: sw.o,
                  }}
                />
              ) : null,
            )}
          </div>
        </div>
      </AbsoluteFill>

      {/* scrim + headline over the zoomed lesson */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 360,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.96) 42%, rgba(255,255,255,0))",
          opacity: window01(f, 591, 700).opacity * zoomAmt,
          zIndex: 45,
        }}
      />
      <TypoBeat title="Learn by doing." from={591} to={700} y={96} size={theme.type.beatZoom} />

      {/* certificate payoff during the pull-back */}
      <FloatingCertificate from={CERT.from} to={CERT.to} />

      {/* floating provider chips during the AI-tools beat */}
      <FloatingChips from={CHIPS.from} to={CHIPS.to} />

      {/* ── ending block ── */}
      <div
        style={{
          position: "absolute",
          top: 1352,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: endLogo.opacity,
          translate: `0 ${26 * (1 - endLogo.enter)}px`,
          filter: `blur(${14 * (1 - endLogo.enter)}px)`,
        }}
      >
        <Img src={staticFile("logo.svg")} style={{ height: 44 }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1432,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: theme.font.family,
          fontSize: theme.type.endTitle,
          fontWeight: theme.type.weightHeading,
          letterSpacing: theme.type.letterSpacing,
          lineHeight: theme.type.lineHeightEnd,
          color: theme.color.ink,
          opacity: endTitle.opacity,
          translate: `0 ${30 * (1 - endTitle.enter)}px`,
          filter: `blur(${16 * (1 - endTitle.enter)}px)`,
        }}
      >
        Learn AI.
        <br />
        Actually use it.
      </div>
      <div
        style={{
          position: "absolute",
          top: 1680,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: endCta.opacity,
          translate: `0 ${26 * (1 - endCta.enter)}px`,
          filter: `blur(${12 * (1 - endCta.enter)}px)`,
        }}
      >
        <div
          style={{
            width: 620,
            height: 96,
            borderRadius: 26,
            background: theme.color.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: theme.font.family,
            fontSize: theme.type.cta,
            fontWeight: theme.type.weightHeading,
            boxShadow: theme.shadow.ctaGlow,
            scale: String(ctaPulse),
          }}
        >
          Start free · tixu.ai
        </div>
      </div>
    </LivingBackground>
  );
};
