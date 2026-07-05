import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { PhoneFrame } from "../device/PhoneFrame";
import { CoursePathScreen } from "../screens/CoursePathScreen";
import { LivingBackground } from "./LivingBackground";
import { TypoBeat } from "./TypoBeat";
import { CertCard } from "./CertCard";
import { MagicMove } from "../lib/MagicMove";
import { MotionBlur } from "../lib/MotionBlur";
import { clamp01, kf, window01 } from "./anim";

export const TEASER_DURATION = 450; // 15s @ 30fps

const PHONE_W = 640;
/** In-screen scroll of the course path (global frames). */
const SCROLL: [number, number] = [105, 245];
/** Medal → certificate morph. */
const MORPH = { from: 252, to: 315 } as const;

const BLUR_WINDOWS: [number, number][] = [
  [6, 80],
  [335, 405],
];

/** Device + camera. Reads the frame itself so MotionBlur samples real motion. */
const TeaserRig: React.FC = () => {
  const f = useCurrentFrame();
  const y = kf(f, [
    [0, 1250],
    [10, 1250],
    [70, 150],
    [330, 150],
    [400, -160],
  ]);
  const s = kf(f, [
    [0, 0.9],
    [70, 0.96],
    [110, 0.96],
    [245, 1.04],
    [330, 1.04],
    [400, 0.78],
  ]);
  const rx = kf(f, [
    [0, 12],
    [70, 0],
  ]);
  const ry = Math.sin(f * 0.02) * 2;
  const floatY = Math.sin(f * 0.045) * 5;
  const phoneO = kf(f, [
    [14, 0],
    [38, 1],
  ]);

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
          <CoursePathScreen scrollWindow={SCROLL} hideCertAfter={MORPH.from} />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

/**
 * 15s vertical teaser: one course, five levels, finish certified.
 * Hook over the rising phone → the path scrolls while a brand trail draws
 * itself → the medal MagicMoves into a personal certificate → end card.
 */
export const TixuCourseTeaser: React.FC = () => {
  const f = useCurrentFrame();

  const logoO =
    kf(f, [
      [6, 0],
      [26, 0.92],
    ]) *
    (1 - clamp01((f - 330) / 18));

  const endLogo = window01(f, 356, TEASER_DURATION + 100);
  const endTitle = window01(f, 366, TEASER_DURATION + 100);
  const endCta = window01(f, 380, TEASER_DURATION + 100);
  const ctaPulse = f > 404 ? 1 + 0.012 * Math.sin((f - 404) / 8) : 1;

  const morphFade = 1 - clamp01((f - 338) / 16);

  const inBlurWindow = BLUR_WINDOWS.some(([a, b]) => f >= a && f <= b);
  const rig = <TeaserRig />;

  return (
    <LivingBackground>
      {/* wordmark */}
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
          src={staticFile("logo.svg")}
          style={{ height: 40, filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* beats */}
      <TypoBeat title="Zero to certified." from={12} to={96} y={290} size={theme.type.hero} />
      <TypoBeat
        title="One course. Five levels."
        sub="15 lessons · learn by doing"
        from={110}
        to={240}
        y={168}
        size={theme.type.beat}
      />
      <TypoBeat
        title="Earn the certificate."
        accentWord="certificate"
        from={250}
        to={334}
        y={168}
        size={theme.type.beat}
      />

      {/* camera + device */}
      {inBlurWindow ? (
        <MotionBlur shutterAngle={240} samples={8}>
          {rig}
        </MotionBlur>
      ) : (
        rig
      )}

      {/* medal → certificate morph (viewport space) */}
      {f >= MORPH.from ? (
        <div style={{ position: "absolute", inset: 0, opacity: morphFade, zIndex: 55 }}>
          <MagicMove
            from={MORPH.from}
            to={MORPH.to}
            a={{ x: 679, y: 1616, w: 116, h: 116 }}
            b={{ x: 540, y: 900, w: 560, h: 252, rotate: -3 }}
            spin={1}
            showBefore={false}
            renderA={() => (
              <div
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: 30,
                  border: "2.5px dashed rgba(255,255,255,0.4)",
                  background: "rgba(18,124,224,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 54,
                }}
              >
                🏅
              </div>
            )}
            renderB={() => <CertCard width={560} />}
          />
        </div>
      ) : null}

      {/* end card */}
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
          src={staticFile("logo.svg")}
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
        Claude Mastery.
        <br />
        Free to start.
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
