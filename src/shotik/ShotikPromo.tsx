import React from "react";
import { AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { LaptopFrame } from "../device/LaptopFrame";
import { DesktopScreen } from "./DesktopScreen";
import { ScreenshotCard, ClaudeCard, GitHubCard } from "./cards";
import { StageBackground } from "../lib/StageBackground";
import { MagicMove } from "../lib/MagicMove";
import { MotionBlur } from "../lib/MotionBlur";
import { TypoBeat } from "../v2/TypoBeat";
import { clamp01, kf, SPRING, stagger, window01 } from "../v2/anim";

export const SHOTIK_PROMO_DURATION = 720; // 24s @ 30fps

const LAPTOP_W = 1440;

// ── capture flow (frames inside DesktopScreen) ──
const T = {
  select: 118,
  toolbar: 152,
  arrow: 172,
  pixelate: 204,
  lift: 248,
  mcp: 428,
} as const;

// ── MagicMove chain ──
const MM1 = { from: 248, to: 310 } as const; // region → screenshot card
const MM2 = { from: 340, to: 395 } as const; // card → chat thumb
const MM3 = { from: 560, to: 622 } as const; // thumb → GitHub card

const CLAUDE_CARD = { x: 620, y: 750 } as const;
/** Empty 250×170 slot inside ClaudeCard (see cards.tsx layout). */
const SLOT = { x: 431, y: 769 } as const;

const BLUR_WINDOWS: [number, number][] = [
  [36, 146],
  [550, 630],
];

const MCP_CHIPS = [
  { label: "take_screenshot", x: 320, y: 280, d: 0 },
  { label: "ask_user_to_select_region", x: 1600, y: 310, d: 7 },
  { label: "repeat last area", x: 260, y: 975, d: 14 },
  { label: "take_screenshot_region", x: 1620, y: 866, d: 21 },
];

/** The lifted copy of the selection (MagicMove A). */
const RegionGhost: React.FC = () => (
  <div
    style={{
      width: 833,
      height: 687,
      borderRadius: 8,
      border: `3px solid ${theme.shotik.accent}`,
      background: "rgba(20,23,33,0.94)",
      boxShadow: "0 0 70px rgba(124,92,255,0.45)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {[
      { t: 70, w: 300, c: "#8B7CF7" },
      { t: 140, w: 520, c: "#5E6B85" },
      { t: 210, w: 420, c: "#4EC9B0" },
      { t: 280, w: 600, c: "#FF5C7A" },
      { t: 350, w: 360, c: "#5E6B85" },
      { t: 420, w: 480, c: "#CE9178" },
      { t: 490, w: 400, c: "#5E6B85" },
    ].map((l, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: 54,
          top: l.t,
          width: l.w,
          height: 20,
          borderRadius: 7,
          background: l.c,
          opacity: 0.6,
        }}
      />
    ))}
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <path
        d="M 620 560 C 550 500 480 400 410 350"
        stroke="#FF4D5E"
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 396 366 L 410 350 L 426 368 Z" fill="#FF4D5E" />
    </svg>
  </div>
);

/** Laptop + camera. Reads the frame itself so MotionBlur samples real motion. */
const LaptopRig: React.FC = () => {
  const f = useCurrentFrame();
  const y = kf(f, [
    [0, 640],
    [40, 640],
    [100, 30],
    [555, 30],
    [625, 330],
  ]);
  const s = kf(f, [
    [0, 0.92],
    [100, 0.96],
    [110, 0.96],
    [140, 1.06],
    [310, 1.06],
    [340, 1.0],
    [555, 1.0],
    [625, 0.85],
  ]);
  const rx = kf(f, [
    [0, 10],
    [100, 0],
  ]);
  const floatY = Math.sin(f * 0.045) * 4;
  const o =
    kf(f, [
      [40, 0],
      [64, 1],
    ]) *
    (1 - 0.75 * clamp01((f - 560) / 50));

  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          transform: `translate(0px, ${y + floatY}px) rotateX(${rx}deg) scale(${s})`,
          opacity: o,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -170,
            background: theme.shotik.glow,
            filter: "blur(52px)",
            zIndex: -1,
          }}
        />
        <LaptopFrame width={LAPTOP_W}>
          <DesktopScreen
            selectAt={T.select}
            toolbarAt={T.toolbar}
            arrowAt={T.arrow}
            pixelateAt={T.pixelate}
            liftAt={T.lift}
            mcpAt={T.mcp}
          />
        </LaptopFrame>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Shotik promo — 24s · 16:9 · MagicMove is the transition language:
 * the captured region lifts off the laptop and morphs into a screenshot
 * card, the card morphs into a Claude-chat thumbnail, the thumbnail morphs
 * into the GitHub repo card. Fresh brand stage: graphite + MCP violet.
 */
export const ShotikPromo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandO =
    kf(f, [
      [6, 0],
      [24, 0.95],
    ]) *
    (1 - clamp01((f - 552) / 18));

  const claudeIn = f < 325 ? 0 : spring({ frame: f - 325, fps, config: SPRING.pop });
  const claudeO = clamp01(claudeIn) * (1 - clamp01((f - 532) / 18));

  const ctaW = window01(f, 640, SHOTIK_PROMO_DURATION + 100);

  const inBlurWindow = BLUR_WINDOWS.some(([a, b]) => f >= a && f <= b);
  const rig = <LaptopRig />;

  const sh = theme.shotik;

  return (
    <StageBackground bg={sh.bg} glowA={sh.accent} glowB={sh.accentDeep} glowOpacity={0.22}>
      {/* brand corner */}
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 64,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: brandO,
          zIndex: 60,
        }}
      >
        <Img src={staticFile("shotik/icon.png")} style={{ width: 44, height: 44, borderRadius: 12 }} />
        <div style={{ fontFamily: theme.font.family, fontSize: 27, fontWeight: 800, color: sh.text }}>
          Shotik
        </div>
      </div>

      {/* beats */}
      <TypoBeat
        title="Your screen. One hotkey."
        from={12}
        to={100}
        y={300}
        size={84}
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />
      <TypoBeat
        title="Snap. Annotate. Done."
        sub="PrtSc → box · arrow · pixelate → Enter"
        from={116}
        to={236}
        y={44}
        size={56}
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />
      <TypoBeat
        title="Paste straight into Claude."
        sub="Smart Clipboard — the image and the file path, at once"
        from={252}
        to={410}
        y={44}
        size={56}
        accentWord="Claude"
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />
      <TypoBeat
        title="Or let Claude look itself."
        sub="built-in MCP server · connect once"
        from={424}
        to={548}
        y={44}
        size={56}
        accentWord="itself"
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />
      <TypoBeat
        title="Free. Open source."
        accentWord="Open source"
        from={585}
        to={SHOTIK_PROMO_DURATION + 40}
        y={150}
        size={64}
        color={sh.text}
        subColor={sh.textMuted}
        accentColor={sh.accent}
      />

      {/* laptop */}
      {inBlurWindow ? (
        <MotionBlur shutterAngle={240} samples={8}>
          {rig}
        </MotionBlur>
      ) : (
        rig
      )}

      {/* Claude chat card */}
      {claudeO > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: CLAUDE_CARD.x,
            top: CLAUDE_CARD.y,
            translate: "-50% -50%",
            opacity: claudeO,
            scale: String(0.8 + 0.2 * claudeIn),
            zIndex: 50,
          }}
        >
          <ClaudeCard showReply={f >= 402} />
        </div>
      ) : null}

      {/* MagicMove chain */}
      {f >= MM1.from && f < MM2.from ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 55 }}>
          <MagicMove
            from={MM1.from}
            to={MM1.to}
            a={{ x: 711, y: 527, w: 833, h: 687 }}
            b={{ x: 1500, y: 430, w: 560, h: 390, rotate: 2 }}
            spin={1}
            showBefore={false}
            renderA={() => <RegionGhost />}
            renderB={() => <ScreenshotCard />}
          />
        </div>
      ) : null}
      {f >= MM2.from && f < MM3.from ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 55 }}>
          <MagicMove
            from={MM2.from}
            to={MM2.to}
            a={{ x: 1500, y: 430, w: 560, h: 390, rotate: 2 }}
            b={{ x: SLOT.x, y: SLOT.y, w: 250, h: 174 }}
            showBefore={false}
            renderA={() => <ScreenshotCard />}
            renderB={() => <ScreenshotCard />}
          />
        </div>
      ) : null}
      {f >= MM3.from ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 56 }}>
          <MagicMove
            from={MM3.from}
            to={MM3.to}
            a={{ x: SLOT.x, y: SLOT.y, w: 250, h: 174 }}
            b={{ x: 960, y: 480, w: 760, h: 320 }}
            spin={1}
            showBefore={false}
            renderA={() => <ScreenshotCard />}
            renderB={() => <GitHubCard />}
          />
        </div>
      ) : null}

      {/* MCP tool chips */}
      {MCP_CHIPS.map((c, i) => {
        const t = f - stagger(i, 434, 7);
        const enter = t < 0 ? 0 : spring({ frame: t, fps, config: SPRING.pop });
        const exit = clamp01((f - 540) / 16);
        const o = clamp01(enter) * (1 - exit);
        if (o <= 0.001) return null;
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y + Math.sin((f + i * 40) * 0.05) * 7,
              translate: "-50% -50%",
              padding: "14px 22px",
              borderRadius: 999,
              background: "rgba(23,26,36,0.88)",
              border: `1px solid ${sh.hair}`,
              boxShadow: theme.dark.shadowFloat,
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: o,
              scale: String(0.7 + 0.3 * enter),
              zIndex: 40,
              fontFamily: theme.font.family,
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 999, background: sh.accent }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: sh.text }}>{c.label}</div>
          </div>
        );
      })}

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          top: 810,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: ctaW.opacity,
          translate: `0 ${24 * (1 - ctaW.enter)}px`,
          filter: `blur(${10 * (1 - ctaW.enter)}px)`,
        }}
      >
        <div
          style={{
            height: 84,
            padding: "0 44px",
            borderRadius: 22,
            background: sh.accent,
            display: "flex",
            alignItems: "center",
            color: "#fff",
            fontFamily: theme.font.family,
            fontSize: 28,
            fontWeight: 800,
            boxShadow: sh.ctaGlow,
          }}
        >
          github.com/gorka2354/shotik
        </div>
      </div>
    </StageBackground>
  );
};
