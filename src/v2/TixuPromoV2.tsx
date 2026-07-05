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
import { MotionBlur } from "../lib/MotionBlur";
import { clamp01, kf, window01 } from "./anim";
import type { PromoProps, ScreenName } from "./promoSchema";

export const V2_DURATION = 1320; // 44s @ 30fps

const PHONE_W = 640;

// ── Camera art (stays code — not part of the authoring surface) ────────────
const ZOOM = { in: [500, 556], out: [800, 855] } as const;
const END = { start: 1160, settle: 1215 } as const;

/** Windows where the camera actually travels — only then is motion blur paid for. */
const BLUR_WINDOWS: [number, number][] = [
  [16, 100], // intro rise
  [495, 560], // zoom in
  [795, 860], // zoom out
  [1150, 1224], // end pull-back
];

/** Screen coords: Continue button center inside the 604-wide home screen. */
const HOME_BTN_Y = 604 * (19.5 / 9) - 44 - 34;

/** Typography scale slots exposed to the scene map. */
const SIZE: Record<PromoProps["beats"][number]["size"], number> = {
  hero: theme.type.hero,
  beat: theme.type.beat,
  beatWide: theme.type.beatWide,
  beatZoom: theme.type.beatZoom,
};

/** Named product screens the scene map can navigate between. */
const SCREENS: Record<ScreenName, React.ReactNode> = {
  home: (
    <>
      <HomeResumeScreen />
      <TapDot x="50%" y={HOME_BTN_Y} from={112} pressAt={132} to={150} />
    </>
  ),
  profile: <ProfileScreen />,
  library: <LibraryScreen />,
  path: <PathScreen />,
  quiz: <LessonQuizScreen deep />,
  tools: <AiToolsScreen deep />,
};

/** Camera zoom progress — shared by the rig and the overlay layers. */
const zoomAt = (f: number) =>
  kf(f, [
    [ZOOM.in[0], 0],
    [ZOOM.in[1], 1],
    [ZOOM.out[0], 1],
    [ZOOM.out[1], 0],
  ]);

/**
 * The device + camera transform. Lives in its own component (reading the
 * frame itself) so CameraMotionBlur can resample it at fractional frames.
 */
const CameraRig: React.FC<{ nav: PromoProps["nav"] }> = ({ nav }) => {
  const f = useCurrentFrame();
  const zoomAmt = zoomAt(f);

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

  // Glass sweep across the display (twice, very subtle).
  const sweeps = [112, 990].map((start) => {
    const p = clamp01((f - start) / 70);
    return { p, o: p > 0 && p < 1 ? 0.1 * Math.sin(Math.PI * p) : 0 };
  });

  return (
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
        {/* ambient brand glow lifts the device off the dark stage */}
        <div
          style={{
            position: "absolute",
            inset: -150,
            background: theme.dark.phoneGlow,
            filter: "blur(46px)",
            zIndex: -1,
          }}
        />
        <PhoneFrame width={PHONE_W}>
          <ScreenFlow
            steps={nav.map((step) => ({
              at: step.at,
              kind: step.kind,
              node: SCREENS[step.screen],
            }))}
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
  );
};

/**
 * V2 master — one continuous shot, deep on features, on a dark brand stage.
 * Fully data-driven (inc-5): the storyline (beats, navigation, floats, brand
 * copy) comes from PromoProps / promo.map.ts; this component is the engine.
 */
export const TixuPromoV2: React.FC<PromoProps> = ({
  brand,
  beats,
  zoomBeat,
  nav,
  floats,
}) => {
  const f = useCurrentFrame();
  const zoomAmt = zoomAt(f);

  // ── Persistent top wordmark (hidden during zoom and the ending block) ──
  // Fade fully by half-zoom: the white wordmark must be gone before the
  // rising screen edge passes under it (ghost-over-display bug otherwise).
  const logoO =
    kf(f, [
      [8, 0],
      [30, 0.92],
    ]) *
    (1 - clamp01(zoomAmt / 0.5)) *
    (1 - clamp01((f - 1140) / 20));

  // ── Ending block ──
  const endLogo = window01(f, 1170, 1400);
  const endTitle = window01(f, 1182, 1400);
  const endCta = window01(f, 1196, 1400);
  const ctaPulse = f > 1222 ? 1 + 0.012 * Math.sin((f - 1222) / 8) : 1;

  const inBlurWindow = BLUR_WINDOWS.some(([a, b]) => f >= a && f <= b);
  const rig = <CameraRig nav={nav} />;

  return (
    <LivingBackground>
      {/* persistent wordmark — inverted to white for the dark stage */}
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
        <Img
          src={staticFile(brand.logo)}
          style={{ height: 40, filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* ── typography beats (from the scene map) ── */}
      {beats.map((b) => (
        <TypoBeat
          key={`${b.from}-${b.title}`}
          title={b.title}
          sub={b.sub}
          accentWord={b.accentWord}
          from={b.from}
          to={b.to}
          y={b.y}
          size={SIZE[b.size]}
        />
      ))}

      {/* ── camera + device (motion-blurred only while the camera travels) ── */}
      {inBlurWindow ? (
        <MotionBlur shutterAngle={240} samples={8}>
          {rig}
        </MotionBlur>
      ) : (
        rig
      )}

      {/* scrim + headline over the zoomed lesson */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 360,
          background: theme.dark.scrim,
          opacity: window01(f, zoomBeat.from, zoomBeat.to).opacity * zoomAmt,
          zIndex: 45,
        }}
      />
      <TypoBeat
        title={zoomBeat.title}
        sub={zoomBeat.sub}
        accentWord={zoomBeat.accentWord}
        from={zoomBeat.from}
        to={zoomBeat.to}
        y={zoomBeat.y}
        size={SIZE[zoomBeat.size]}
      />

      {/* certificate payoff during the pull-back */}
      <FloatingCertificate from={floats.certificate.from} to={floats.certificate.to} />

      {/* floating provider chips during the AI-tools beat */}
      <FloatingChips from={floats.chips.from} to={floats.chips.to} />

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
        <Img
          src={staticFile(brand.logo)}
          style={{ height: 44, filter: "brightness(0) invert(1)" }}
        />
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
          color: theme.dark.text,
          opacity: endTitle.opacity,
          translate: `0 ${30 * (1 - endTitle.enter)}px`,
          filter: `blur(${16 * (1 - endTitle.enter)}px)`,
        }}
      >
        {brand.endTitleLines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < brand.endTitleLines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
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
          {brand.ctaLabel}
        </div>
      </div>
    </LivingBackground>
  );
};
