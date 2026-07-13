import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { PhoneFrame } from "../device/PhoneFrame";
import { LivingBackground } from "./LivingBackground";
import { ScreenFlow } from "./ScreenFlow";
import { TypoBeat } from "./TypoBeat";
import { FloatingChips } from "./FloatingChips";
import { FloatingCertificate } from "./FloatingCertificate";
import { MotionBlur } from "../lib/MotionBlur";
import { clamp01, kf, window01 } from "./anim";
import type { PromoProps, ScreenName } from "./promoSchema";

export const FLOATING_PHONE_DURATION = 1320; // 44s @ 30fps

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
export const HOME_BTN_Y = 604 * (19.5 / 9) - 44 - 34;

/**
 * Brand-swappable dark stage the phone floats on. tixu's values live in the
 * TixuPromoV2 wrapper; a new promo passes its own preset (see src/lumo).
 */
export type StagePreset = {
  /** LivingBackground base + drifting glow blobs + vignette. */
  bg: string;
  vignette: string;
  blobA: string;
  blobB: string;
  /** Typography beat colors (title / sub-line / accent word). */
  text: string;
  textMuted: string;
  accent: string;
  /** Scrim behind the headline over the zoomed lesson. */
  scrim: string;
  /** Ambient glow that lifts the device off the stage. */
  phoneGlow: string;
  /** Solid accent for the big end-card CTA. */
  accentSolid: string;
  ctaGlow: string;
};

/** Content of the certificate that floats out during the pull-back. */
export type CertContent = {
  logo: React.ReactNode;
  courseTitle: string;
  awardedTo: string;
};

/** Typography scale slots exposed to the scene map. */
const SIZE: Record<PromoProps["beats"][number]["size"], number> = {
  hero: theme.type.hero,
  beat: theme.type.beat,
  beatWide: theme.type.beatWide,
  beatZoom: theme.type.beatZoom,
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
const CameraRig: React.FC<{
  nav: PromoProps["nav"];
  screens: Record<ScreenName, React.ReactNode>;
  phoneGlow: string;
}> = ({ nav, screens, phoneGlow }) => {
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
            background: phoneGlow,
            filter: "blur(46px)",
            zIndex: -1,
          }}
        />
        <PhoneFrame width={PHONE_W}>
          <ScreenFlow
            steps={nav.map((step) => ({
              at: step.at,
              kind: step.kind,
              node: screens[step.screen],
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
 * Reusable floating-phone promo engine — one continuous shot, deep on features,
 * on a brand dark stage. Storyline (beats, navigation, floats, brand copy) is
 * data (PromoProps); the "chassis" (which product screens, the stage palette,
 * the wordmark renderer and the certificate content) comes from the wrapper.
 * TixuPromoV2 and LumoPromo are thin wrappers that supply these.
 */
export const FloatingPhonePromo: React.FC<
  PromoProps & {
    /** Named product screens the scene map navigates between. */
    screens: Record<ScreenName, React.ReactNode>;
    /** Brand dark-stage palette. */
    stage: StagePreset;
    /** Renders the wordmark at a given pixel height (white on the dark stage). */
    wordmark: (height: number) => React.ReactNode;
    /** Certificate payoff content. */
    cert: CertContent;
  }
> = ({ brand, beats, zoomBeat, nav, floats, screens, stage, wordmark, cert }) => {
  const f = useCurrentFrame();
  const zoomAmt = zoomAt(f);

  // ── Persistent top wordmark (hidden during zoom and the ending block) ──
  // Fade fully by half-zoom: the wordmark must be gone before the rising
  // screen edge passes under it (ghost-over-display bug otherwise).
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
  const rig = (
    <CameraRig nav={nav} screens={screens} phoneGlow={stage.phoneGlow} />
  );

  return (
    <LivingBackground
      stage={{
        bg: stage.bg,
        vignette: stage.vignette,
        blobA: stage.blobA,
        blobB: stage.blobB,
      }}
    >
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
        {wordmark(40)}
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
          color={stage.text}
          subColor={stage.textMuted}
          accentColor={stage.accent}
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
          background: stage.scrim,
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
        color={stage.text}
        subColor={stage.textMuted}
        accentColor={stage.accent}
      />

      {/* certificate payoff during the pull-back */}
      <FloatingCertificate
        from={floats.certificate.from}
        to={floats.certificate.to}
        logo={cert.logo}
        courseTitle={cert.courseTitle}
        awardedTo={cert.awardedTo}
      />

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
        {wordmark(44)}
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
          color: stage.text,
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
            background: stage.accentSolid,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: theme.font.family,
            fontSize: theme.type.cta,
            fontWeight: theme.type.weightHeading,
            boxShadow: stage.ctaGlow,
            scale: String(ctaPulse),
          }}
        >
          {brand.ctaLabel}
        </div>
      </div>
    </LivingBackground>
  );
};
