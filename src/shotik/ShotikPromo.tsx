import React from "react";
import { AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { LaptopFrame } from "../device/LaptopFrame";
import { DesktopScreen } from "./DesktopScreen";
import { ShotikAppWindow, GitHubCard } from "./cards";
import { StageBackground } from "../lib/StageBackground";
import { Laptop3DIntro } from "./Laptop3DIntro";
import { MagicMove } from "../lib/MagicMove";
import { MotionBlur } from "../lib/MotionBlur";
import { TypoBeat } from "../v2/TypoBeat";
import { clamp01, kf, SPRING, stagger, window01 } from "../v2/anim";

export const SHOTIK_PROMO_DURATION = 840; // 28s @ 30fps

const LAPTOP_W = 1440;

// ── capture + terminal flow (frames inside DesktopScreen) ──
// Annotation/feature beats got real screen time (user feedback: the drawing
// was too fast to read; OCR and Copy-for-Claude must be shown explicitly).
const T = {
  select: 112,
  toolbar: 146,
  arrow: 170,
  box: 206,
  marker: 234,
  ocr: 258, // click the OCR (T) button → result popup
  claude: 316, // hover + click «Copy for Claude», A keycap shown
  lift: 340,
  paste: 436, // [Image #1] appears in the input
  sent: 458,
  reply: 470,
  mcp: 584,
} as const;

// ── MagicMove: the captured region flies INTO the Claude input ──
const MM_PASTE = { from: 396, to: 436 } as const;
// ── MagicMove: the Shotik app window folds into its GitHub repo card ──
const MM_GIT = { from: 652, to: 712 } as const;

const APP_WIN = { x: 470, y: 560 } as const;

// Blur never overlaps the selection drag or the annotation strokes.
// (No window for the intro — the 3D dolly lives inside ThreeCanvas.)
const BLUR_WINDOWS: [number, number][] = [
  [344, 400],
  [526, 566],
  [640, 716],
];

const MCP_CHIPS = [
  { label: "take_screenshot", x: 1560, y: 260, d: 0 },
  { label: "ask_user_to_select_region", x: 1520, y: 900, d: 9 },
];

/** The lifted copy of the selection — real code + red annotations. */
const RegionGhost: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 990,
      borderRadius: 8,
      border: "3px solid #2F9BFF",
      background: "#1E1E1E",
      boxShadow: "0 0 80px rgba(47,155,255,0.35), 0 60px 120px -30px rgba(0,0,0,0.7)",
      position: "relative",
      overflow: "hidden",
      padding: "60px 70px",
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: 27,
      lineHeight: 1.85,
    }}
  >
    <div style={{ color: "#C586C0" }}>
      export function <span style={{ color: "#DCDCAA" }}>Card</span>
      <span style={{ color: "#D4D4D4" }}>({"{ title }"}: </span>
      <span style={{ color: "#4EC9B0" }}>Props</span>
      <span style={{ color: "#D4D4D4" }}>) {"{"}</span>
    </div>
    <div style={{ color: "#D4D4D4", position: "relative" }}>
      {"  "}&lt;div className=<span style={{ color: "#CE9178" }}>"card"</span> style={"{{"} padding:{" "}
      <span style={{ color: "#B5CEA8" }}>8</span> {"}}"}&gt;
      <div
        style={{
          position: "absolute",
          left: 10,
          top: -6,
          width: "96%",
          height: 56,
          border: "3.5px solid #F5474F",
          borderRadius: 4,
        }}
      />
    </div>
    <div style={{ color: "#D4D4D4" }}>
      {"    "}&lt;h3&gt;<span style={{ color: "#9CDCFE" }}>{"{title}"}</span>&lt;/h3&gt;
    </div>
    <div style={{ color: "#D4D4D4" }}>{"  "}&lt;/div&gt;</div>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <path
        d="M 900 760 C 780 640 560 340 400 190"
        stroke="#F5474F"
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 382 214 L 400 190 L 424 208 Z" fill="#F5474F" />
    </svg>
    <div
      style={{
        position: "absolute",
        right: 60,
        bottom: 46,
        width: 44,
        height: 44,
        borderRadius: 999,
        background: "#F5474F",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        fontFamily: theme.font.family,
      }}
    >
      1
    </div>
  </div>
);

/** Small pasted-attachment chip that lands next to the Claude input. */
const PasteChip: React.FC = () => (
  <div
    style={{
      width: 280,
      height: 231,
      borderRadius: 12,
      border: "2px solid #2F9BFF",
      background: "#1E1E1E",
      boxShadow: "0 24px 50px -16px rgba(0,0,0,0.7)",
      position: "relative",
      overflow: "hidden",
      padding: "18px 20px",
      fontFamily: "Consolas, monospace",
      fontSize: 12,
      lineHeight: 1.9,
    }}
  >
    <div style={{ color: "#C586C0" }}>
      export function <span style={{ color: "#DCDCAA" }}>Card</span>…
    </div>
    <div style={{ color: "#D4D4D4" }}>
      {"  "}&lt;div style={"{{"} padding: <span style={{ color: "#B5CEA8" }}>8</span> {"}}"}&gt;
    </div>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <path d="M 210 180 C 170 140 130 100 96 72" stroke="#F5474F" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M 90 82 L 96 72 L 106 80 Z" fill="#F5474F" />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 14,
        bottom: 12,
        padding: "3px 9px",
        borderRadius: 6,
        background: "rgba(47,155,255,0.18)",
        border: "1px solid #2F9BFF",
        color: "#9CCFFF",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      [Image #1]
    </div>
  </div>
);

/** Laptop + camera (now travels on X too — the paste beat zooms into the terminal). */
const LaptopRig: React.FC = () => {
  const f = useCurrentFrame();
  const x = kf(f, [
    [348, 0],
    [392, -450],
    [530, -450],
    [562, 0],
  ]);
  const y = kf(f, [
    [0, 30],
    [655, 30],
    [725, 330],
  ]);
  // Capture beat holds EXACTLY scale 1.0 — the 1408-design screen maps
  // pixel-perfect, so the thin selection/annotation strokes stay crisp.
  const s = kf(f, [
    [0, 1.0],
    [348, 1.0],
    [392, 1.5],
    [530, 1.5],
    [562, 1.0],
    [655, 1.0],
    [725, 0.85],
  ]);
  const rx = 0;
  // No bob during capture/terminal; a light one returns for the outro.
  const bobAmp = kf(f, [
    [0, 0],
    [566, 0],
    [578, 4],
  ]);
  const floatY = Math.sin(f * 0.045) * bobAmp;
  // The 2D desktop fades in UNDER the 3D dolly (cross-fade ~f94-108).
  const o =
    kf(f, [
      [92, 0],
      [107, 1],
    ]) *
    (1 - 0.75 * clamp01((f - 655) / 50));

  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          transform: `translate(${x}px, ${y + floatY}px) rotateX(${rx}deg) scale(${s})`,
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
          <DesktopScreen t={T} />
        </LaptopFrame>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Shotik promo v2 — realism pass: the ACTUAL product flow 1:1. Real TSX in
 * the editor, the real overlay (blue selection, white toolbar + palette,
 * red annotations), the literal paste-into-Claude moment inside a Claude
 * Code TUI, the real app window, and grounded MagicMoves only where the
 * story needs them.
 */
export const ShotikPromo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandO =
    kf(f, [
      [6, 0],
      [24, 0.95],
    ]) *
    (1 - clamp01((f - 648) / 18));

  const appIn = f < 572 ? 0 : spring({ frame: f - 572, fps, config: SPRING.pop });
  const appO = clamp01(appIn); // unmounts at MM_GIT.from — the morph takes over

  // the pasted chip dissolves into the [Image #1] token
  const chipFade = 1 - clamp01((f - (T.paste + 8)) / 12);

  const ctaW = window01(f, 756, SHOTIK_PROMO_DURATION + 100);

  const inBlurWindow = BLUR_WINDOWS.some(([a, b]) => f >= a && f <= b);
  const rig = <LaptopRig />;

  const sh = theme.shotik;
  const beatColors = { color: sh.text, subColor: sh.textMuted, accentColor: sh.accent };

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

      {/* 3D opening shot: hinged laptop opens, camera dives into the screen */}
      <Laptop3DIntro />

      {/* beats */}
      <TypoBeat title="Your screen. One hotkey." from={12} to={100} y={300} size={84} {...beatColors} />
      <TypoBeat
        title="Snap. Annotate."
        sub="arrow · box · marker — right in the overlay"
        from={116}
        to={250}
        y={44}
        size={56}
        {...beatColors}
      />
      <TypoBeat
        title="It reads your text."
        sub="built-in OCR, offline — press T"
        from={256}
        to={310}
        y={44}
        size={56}
        accentWord="reads"
        {...beatColors}
      />
      <TypoBeat
        title="One click — copied for Claude."
        sub="the ✦ button, or just press A"
        from={316}
        to={392}
        y={44}
        size={56}
        accentWord="Claude"
        {...beatColors}
      />
      <TypoBeat
        title="Paste. Claude sees it."
        sub="Smart Clipboard — the image and the file path, at once"
        from={402}
        to={556}
        y={44}
        size={56}
        accentWord="sees"
        {...beatColors}
      />
      <TypoBeat
        title="Or let Claude look itself."
        sub="built-in MCP server · connect once"
        from={570}
        to={646}
        y={44}
        size={56}
        accentWord="itself"
        {...beatColors}
      />
      <TypoBeat
        title="Free. Open source."
        accentWord="Open source"
        from={690}
        to={SHOTIK_PROMO_DURATION + 40}
        y={150}
        size={64}
        {...beatColors}
      />

      {/* laptop */}
      {inBlurWindow ? (
        <MotionBlur shutterAngle={240} samples={8}>
          {rig}
        </MotionBlur>
      ) : (
        rig
      )}

      {/* the region flies into the Claude input and dissolves into [Image #1] */}
      {f >= MM_PASTE.from && f < T.paste + 24 ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 55, opacity: chipFade }}>
          <MagicMove
            from={MM_PASTE.from}
            to={MM_PASTE.to}
            a={{ x: 150, y: 500, w: 1200, h: 990 }}
            b={{ x: 1060, y: 878, w: 280, h: 231, rotate: 0 }}
            showBefore={false}
            renderA={() => <RegionGhost />}
            renderB={() => <PasteChip />}
          />
        </div>
      ) : null}

      {/* the real Shotik window (MCP beat), then it folds into the GitHub card */}
      {appO > 0.001 && f < MM_GIT.from ? (
        <div
          style={{
            position: "absolute",
            left: APP_WIN.x,
            top: APP_WIN.y,
            translate: "-50% -50%",
            opacity: appO,
            scale: String(0.82 + 0.18 * appIn),
            zIndex: 50,
          }}
        >
          <ShotikAppWindow />
        </div>
      ) : null}
      {f >= MM_GIT.from ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 56 }}>
          <MagicMove
            from={MM_GIT.from}
            to={MM_GIT.to}
            a={{ x: APP_WIN.x, y: APP_WIN.y, w: 860, h: 560 }}
            b={{ x: 960, y: 470, w: 760, h: 320 }}
            spin={1}
            showBefore={false}
            renderA={() => <ShotikAppWindow />}
            renderB={() => <GitHubCard />}
          />
        </div>
      ) : null}

      {/* MCP tool chips (just two, as garnish) */}
      {MCP_CHIPS.map((c, i) => {
        const t = f - stagger(i, 592, 9);
        const enter = t < 0 ? 0 : spring({ frame: t, fps, config: SPRING.pop });
        const exit = clamp01((f - 644) / 14);
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
              background: "rgba(23,26,36,0.9)",
              border: `1px solid ${sh.hair}`,
              boxShadow: theme.dark.shadowFloat,
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: o,
              scale: String(0.7 + 0.3 * enter),
              zIndex: 40,
              fontFamily: "Consolas, monospace",
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 999, background: sh.accent }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: sh.text }}>{c.label}</div>
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
