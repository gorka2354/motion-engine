import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { drawPath01 } from "../lib/morph";
import { clamp01, EASE, kf, stagger01 } from "../v2/anim";

/**
 * Stylized dev desktop (1408×880) with the Shotik capture flow:
 * hotkey → dim overlay + selection drag → annotation toolbar → arrow
 * draw-on + pixelate-the-secret → region lifts away (MagicMove outside).
 * All timings come in as absolute frames.
 */

const SW = 1408;
const SH = 880;

/** Selection covers the editor window. */
export const SEL = { x: 76, y: 88, w: 786, h: 648 } as const;

const CODE_LINES: { i: number; w: number; c: string }[] = [
  { i: 0, w: 240, c: "#8B7CF7" },
  { i: 1, w: 420, c: "#5E6B85" },
  { i: 1, w: 360, c: "#4EC9B0" },
  { i: 2, w: 480, c: "#5E6B85" },
  { i: 2, w: 300, c: "#569CD6" },
  { i: 1, w: 520, c: "#FF5C7A" }, // the bug line
  { i: 1, w: 260, c: "#5E6B85" },
  { i: 0, w: 200, c: "#8B7CF7" },
  { i: 1, w: 440, c: "#CE9178" }, // the secret line (gets pixelated)
  { i: 1, w: 380, c: "#5E6B85" },
  { i: 2, w: 320, c: "#4EC9B0" },
  { i: 0, w: 160, c: "#5E6B85" },
];
const LINE_Y = (idx: number) => 158 + idx * 40;
const BUG_LINE = 5;
const SECRET_LINE = 8;

const ARROW_PATH = "M 690 620 C 620 560 540 420 452 388";

const TOOLBAR = ["▭", "➜", "✏", "▨", "T", "①", "⏎"];

export const DesktopScreen: React.FC<{
  selectAt: number;
  toolbarAt: number;
  arrowAt: number;
  pixelateAt: number;
  /** Enter pressed → region lifts (hide selection content highlight, show toast). */
  liftAt: number;
  mcpAt: number;
}> = ({ selectAt, toolbarAt, arrowAt, pixelateAt, liftAt, mcpAt }) => {
  const f = useCurrentFrame();

  const drag = EASE(clamp01((f - selectAt) / 22));
  const hasOverlay = f >= selectAt && f < liftAt + 4;
  const curW = SEL.w * drag;
  const curH = SEL.h * drag;
  const dim = 0.5 * clamp01((f - selectAt) / 10) * (f < liftAt ? 1 : 1 - clamp01((f - liftAt) / 12));

  const arrowT = clamp01((f - arrowAt) / 20);
  const pixT = f >= pixelateAt;
  const toastO = kf(f, [
    [liftAt + 2, 0],
    [liftAt + 14, 1],
    [liftAt + 70, 1],
    [liftAt + 86, 0],
  ]);

  // cursor
  const cx = kf(f, [
    [0, 1120],
    [selectAt - 12, SEL.x],
    [selectAt, SEL.x],
    [selectAt + 22, SEL.x + SEL.w],
    [arrowAt, 700],
    [arrowAt + 20, 462],
    [pixelateAt, 560],
    [pixelateAt + 14, 560],
  ]);
  const cy = kf(f, [
    [0, 800],
    [selectAt - 12, SEL.y],
    [selectAt, SEL.y],
    [selectAt + 22, SEL.y + SEL.h],
    [arrowAt, 625],
    [arrowAt + 20, 395],
    [pixelateAt, LINE_Y(SECRET_LINE) + 14],
    [pixelateAt + 14, LINE_Y(SECRET_LINE) + 14],
  ]);
  const cursorO = f < liftAt ? 1 : 1 - clamp01((f - liftAt) / 10);

  const selRight = SEL.x + curW;
  const selBottom = SEL.y + curH;

  return (
    <AbsoluteFill style={{ background: theme.shotik.screenBg, fontFamily: theme.font.stack }}>
      {/* wallpaper watermark */}
      <Img
        src={staticFile("shotik/icon.png")}
        style={{
          position: "absolute",
          left: "50%",
          top: "44%",
          translate: "-50% -50%",
          width: 150,
          opacity: 0.1,
        }}
      />

      {/* editor window */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 56,
          width: 810,
          height: 700,
          borderRadius: 16,
          background: theme.shotik.panel,
          border: `1px solid ${theme.shotik.hair}`,
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.55)",
        }}
      >
        <div
          style={{
            height: 46,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 18px",
            borderBottom: `1px solid ${theme.shotik.hair}`,
          }}
        >
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 14,
              padding: "5px 14px",
              borderRadius: 8,
              background: theme.shotik.panelLight,
              fontSize: 15,
              fontWeight: 600,
              color: theme.shotik.textMuted,
            }}
          >
            app.tsx
          </div>
        </div>
        {CODE_LINES.map((l, idx) => (
          <React.Fragment key={idx}>
            <div
              style={{
                position: "absolute",
                left: 24,
                top: LINE_Y(idx) - 56 + 8,
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(154,163,181,0.45)",
                width: 26,
                textAlign: "right",
              }}
            >
              {idx + 1}
            </div>
            <div
              style={{
                position: "absolute",
                left: 70 + l.i * 34,
                top: LINE_Y(idx) - 56,
                width: l.w,
                height: 16,
                borderRadius: 6,
                background: l.c,
                opacity: idx === BUG_LINE ? 0.85 : 0.55,
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* terminal window */}
      <div
        style={{
          position: "absolute",
          left: 900,
          top: 330,
          width: 452,
          height: 396,
          borderRadius: 16,
          background: "#0D1017",
          border: `1px solid ${theme.shotik.hair}`,
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.55)",
          padding: "16px 22px",
          fontSize: 17,
          fontWeight: 600,
          lineHeight: 1.9,
          color: theme.shotik.textMuted,
        }}
      >
        <div style={{ color: "#4EC9B0" }}>$ npm run dev</div>
        <div>➜ ready in 1.2s</div>
        <div style={{ marginTop: 8 }}>$ claude</div>
        <div>✳ Claude Code — waiting…</div>
        {f >= mcpAt ? (
          <>
            <div style={{ marginTop: 8, color: theme.shotik.text }}>
              $ claude mcp add shotik
            </div>
            {f >= mcpAt + 16 ? (
              <div style={{ color: theme.shotik.accent }}>✓ connected · 6 tools</div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* taskbar */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 16,
          translate: "-50% 0",
          height: 58,
          padding: "0 18px",
          borderRadius: 18,
          background: "rgba(23,26,36,0.85)",
          border: `1px solid ${theme.shotik.hair}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {["#2E86F0", "#28C840", "#FEBC2E", "#8B7CF7", "#FF5F57"].map((c, i) => (
          <div key={i} style={{ width: 34, height: 34, borderRadius: 10, background: c, opacity: 0.8 }} />
        ))}
        <Img src={staticFile("shotik/icon.png")} style={{ width: 36, height: 36, borderRadius: 10 }} />
      </div>

      {/* ── capture overlay ── */}
      {hasOverlay ? (
        <>
          {/* dim around the selection */}
          <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SEL.y, background: `rgba(0,0,0,${dim})` }} />
          <div style={{ position: "absolute", left: 0, top: SEL.y, width: SEL.x, height: SH - SEL.y, background: `rgba(0,0,0,${dim})` }} />
          <div style={{ position: "absolute", left: selRight, top: SEL.y, width: SW - selRight, height: SH - SEL.y, background: `rgba(0,0,0,${dim})` }} />
          <div style={{ position: "absolute", left: SEL.x, top: selBottom, width: curW, height: SH - selBottom, background: `rgba(0,0,0,${dim})` }} />

          {/* selection border + handles + size badge */}
          <div
            style={{
              position: "absolute",
              left: SEL.x,
              top: SEL.y,
              width: curW,
              height: curH,
              border: `2.5px solid ${theme.shotik.accent}`,
              borderRadius: 4,
              boxShadow: `0 0 0 1px rgba(124,92,255,0.25), 0 0 34px rgba(124,92,255,0.35)`,
            }}
          />
          {drag > 0.98 ? (
            <>
              {[
                [SEL.x, SEL.y],
                [SEL.x + SEL.w / 2, SEL.y],
                [SEL.x + SEL.w, SEL.y],
                [SEL.x, SEL.y + SEL.h / 2],
                [SEL.x + SEL.w, SEL.y + SEL.h / 2],
                [SEL.x, SEL.y + SEL.h],
                [SEL.x + SEL.w / 2, SEL.y + SEL.h],
                [SEL.x + SEL.w, SEL.y + SEL.h],
              ].map(([hx, hy], i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: hx - 6,
                    top: hy - 6,
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: "#fff",
                    border: `2px solid ${theme.shotik.accent}`,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: SEL.x + SEL.w - 132,
                  top: SEL.y - 40,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "rgba(23,26,36,0.92)",
                  border: `1px solid ${theme.shotik.hair}`,
                  fontSize: 15,
                  fontWeight: 700,
                  color: theme.shotik.text,
                }}
              >
                786 × 648
              </div>
            </>
          ) : null}

          {/* annotation toolbar */}
          {f >= toolbarAt ? (
            <div
              style={{
                position: "absolute",
                left: SEL.x + SEL.w / 2 - 210,
                top: SEL.y + SEL.h + 16,
                height: 58,
                padding: "0 10px",
                borderRadius: 16,
                background: "rgba(23,26,36,0.94)",
                border: `1px solid ${theme.shotik.hair}`,
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 18px 40px -12px rgba(0,0,0,0.6)",
              }}
            >
              {TOOLBAR.map((t, i) => {
                const p = stagger01(f, i, toolbarAt, 3, 10);
                const active =
                  (t === "➜" && f >= arrowAt && f < pixelateAt) ||
                  (t === "▨" && f >= pixelateAt && f < liftAt) ||
                  (t === "⏎" && f >= liftAt - 6);
                return (
                  <div
                    key={i}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      background: active ? theme.shotik.accent : "transparent",
                      color: active ? "#fff" : theme.shotik.textMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 21,
                      fontWeight: 700,
                      opacity: p,
                      scale: String(0.6 + 0.4 * p),
                    }}
                  >
                    {t}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* annotations */}
          {f >= arrowAt ? (
            <svg width={SW} height={SH} style={{ position: "absolute", inset: 0 }}>
              <path
                d={ARROW_PATH}
                stroke="#FF4D5E"
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                {...drawPath01(ARROW_PATH, arrowT)}
              />
              {arrowT > 0.93 ? (
                <path d="M 436 402 L 452 388 L 466 406 Z" fill="#FF4D5E" />
              ) : null}
            </svg>
          ) : null}
          {pixT
            ? Array.from({ length: 22 }, (_, i) => {
                const col = i % 11;
                const row = Math.floor(i / 11);
                const p = stagger01(f, i, pixelateAt, 1, 6);
                const shade = 30 + ((i * 37) % 40);
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 100 + col * 42,
                      top: LINE_Y(SECRET_LINE) - 8 + row * 18,
                      width: 42,
                      height: 18,
                      background: `rgb(${shade},${shade + 4},${shade + 10})`,
                      opacity: p * 0.96,
                    }}
                  />
                );
              })
            : null}
        </>
      ) : null}

      {/* copied toast */}
      {toastO > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 26,
            top: 24,
            padding: "13px 20px",
            borderRadius: 14,
            background: "rgba(23,26,36,0.95)",
            border: `1px solid ${theme.shotik.hair}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: toastO,
            translate: `0 ${(1 - toastO) * -12}px`,
          }}
        >
          <Img src={staticFile("shotik/icon.png")} style={{ width: 26, height: 26, borderRadius: 7 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: theme.shotik.text }}>
            Copied — PNG + file path
          </div>
          <div style={{ color: "#28C840", fontWeight: 800, fontSize: 17 }}>✓</div>
        </div>
      ) : null}

      {/* cursor */}
      {cursorO > 0 ? (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          style={{ position: "absolute", left: cx, top: cy, opacity: cursorO, zIndex: 80 }}
        >
          <path
            d="M4 2 L20 12 L12 13.5 L9.5 21 Z"
            fill="#fff"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="1.4"
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
