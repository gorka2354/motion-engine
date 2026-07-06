import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { clamp01, EASE, kf, stagger01 } from "../v2/anim";

/**
 * Realistic dev desktop (1408×880) reproducing the ACTUAL Shotik capture
 * flow 1:1 (docs/overlay-toolbar.png + overlay-annotations.png): dim + grid,
 * blue selection with round white handles, dark size chip, white floating
 * toolbar with the real icon set + color palette row, red box/arrow/①
 * annotations, smart-clipboard toast. Editor shows real TSX; terminal runs
 * a Claude Code TUI with the literal paste flow.
 */

const SW = 1408;
const SH = 880;

/** Selection covers the editor window. */
export const SEL = { x: 64, y: 76, w: 800, h: 660 } as const;

// Real Shotik accent (Windows-accent blue from the overlay screenshots).
const SEL_BLUE = "#2F9BFF";
const ANNOT_RED = "#F5474F";

// ── Syntax-highlighted code (VS Code Dark+ palette) ─────────────────────────
type Tok = [string, string]; // [text, color]
const K = "#C586C0"; // keyword
const D = "#569CD6"; // decl / const
const F = "#DCDCAA"; // function
const S = "#CE9178"; // string
const T2 = "#4EC9B0"; // type
const V = "#9CDCFE"; // variable / attr
const P = "#D4D4D4"; // punctuation
const N = "#B5CEA8"; // number
const C = "#6A9955"; // comment

const CODE: Tok[][] = [
  [["import", K], [" { useState } ", P], ["from", K], [" \"react\"", S], [";", P]],
  [],
  [["export function", K], [" Card", F], ["({ title }: ", P], ["Props", T2], [") {", P]],
  [["  const", D], [" [open, setOpen] = ", P], ["useState", F], ["(", P], ["false", D], [");", P]],
  [["  return", K], [" (", P]],
  [["    <div", P], [" className", V], ["=", P], ["\"card\"", S], [" style", V], ["={{ padding: ", P], ["8", N], [" }}>", P]],
  [["      <h3>", P], ["{title}", V], ["</h3>", P]],
  [["      <button", P], [" onClick", V], ["={() => ", P], ["setOpen", F], ["(!open)}>", P]],
  [["        {open ? ", P], ["\"Hide\"", S], [" : ", P], ["\"Show\"", S], ["}", P]],
  [["      </button>", P]],
  [["    </div>", P], ["  ", P], ["// FIXME: cramped", C]],
  [["  );", P]],
  [["}", P]],
];
const LINE_H = 34;
const CODE_TOP = 130;
const BUG_LINE = 5; // the padding: 8 line

// ── Real toolbar icon set (order from overlay-toolbar.png) ──────────────────
const TOOLS = ["➤", "✏", "↗", "╱", "▭", "◯", "▨", "T", "①", "|", "↶", "↷", "|", "⛶", "📌", "💾", "✨", "⧉", "✕"];
const PALETTE = ["#F5474F", "#FF8A3D", "#FFD43B", "#37C871", "#2BC5D8", "#2F9BFF", "#8B7CF7", "#F06BC8", "#FFFFFF"];

export const DesktopScreen: React.FC<{
  selectAt: number;
  toolbarAt: number;
  boxAt: number;
  arrowAt: number;
  markerAt: number;
  /** Enter pressed → overlay closes, toast appears (the copy lifts outside). */
  liftAt: number;
  /** Terminal: paste lands / message sent / Claude replies / MCP connect. */
  pasteAt: number;
  sentAt: number;
  replyAt: number;
  mcpAt: number;
}> = ({ selectAt, toolbarAt, boxAt, arrowAt, markerAt, liftAt, pasteAt, sentAt, replyAt, mcpAt }) => {
  const f = useCurrentFrame();

  const drag = EASE(clamp01((f - selectAt) / 22));
  const hasOverlay = f >= selectAt && f < liftAt + 4;
  const curW = SEL.w * drag;
  const curH = SEL.h * drag;
  const dim = 0.52 * clamp01((f - selectAt) / 10) * (f < liftAt ? 1 : 1 - clamp01((f - liftAt) / 12));

  const boxT = EASE(clamp01((f - boxAt) / 14));
  const arrowT = clamp01((f - arrowAt) / 16);
  const markerOn = f >= markerAt;
  const toastO = kf(f, [
    [liftAt + 2, 0],
    [liftAt + 14, 1],
    [liftAt + 80, 1],
    [liftAt + 96, 0],
  ]);

  const cx = kf(f, [
    [0, 1080],
    [selectAt - 12, SEL.x],
    [selectAt, SEL.x],
    [selectAt + 22, SEL.x + SEL.w],
    [boxAt - 6, 200],
    [boxAt + 14, 560],
    [arrowAt, 700],
    [arrowAt + 16, 560],
    [markerAt, 175],
    [markerAt + 10, 175],
  ]);
  const cy = kf(f, [
    [0, 780],
    [selectAt - 12, SEL.y],
    [selectAt, SEL.y],
    [selectAt + 22, SEL.y + SEL.h],
    [boxAt - 6, CODE_TOP + BUG_LINE * LINE_H - 10],
    [boxAt + 14, CODE_TOP + BUG_LINE * LINE_H + 28],
    [arrowAt, 620],
    [arrowAt + 16, CODE_TOP + BUG_LINE * LINE_H + 40],
    [markerAt, CODE_TOP + 2 * LINE_H],
    [markerAt + 10, CODE_TOP + 2 * LINE_H],
  ]);
  const cursorO = f < liftAt ? 1 : 1 - clamp01((f - liftAt) / 10);

  const selRight = SEL.x + curW;
  const selBottom = SEL.y + curH;

  // red annotation box around the bug line
  const BOX = { x: 96, y: CODE_TOP + BUG_LINE * LINE_H - 8, w: 640 * boxT, h: 42 };
  const ARROW = "M 700 610 C 640 560 590 460 520 400";

  return (
    <AbsoluteFill style={{ background: theme.shotik.screenBg, fontFamily: theme.font.stack }}>
      {/* editor window */}
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 48,
          width: 830,
          height: 706,
          borderRadius: 14,
          background: "#1E1E1E",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />
          ))}
          <div
            style={{
              marginLeft: 12,
              padding: "5px 14px",
              borderRadius: 7,
              background: "#2D2D2D",
              fontSize: 15,
              fontWeight: 600,
              color: "#CCCCCC",
              fontFamily: "Consolas, monospace",
            }}
          >
            Card.tsx
          </div>
        </div>
        {CODE.map((line, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: 0,
              top: CODE_TOP - 48 + idx * LINE_H,
              width: "100%",
              height: LINE_H,
              display: "flex",
              alignItems: "center",
              fontFamily: "Consolas, 'Courier New', monospace",
              fontSize: 19,
              background: idx === BUG_LINE ? "rgba(245,71,79,0.07)" : "transparent",
            }}
          >
            <span style={{ width: 52, textAlign: "right", color: "#6E7681", fontSize: 15, paddingRight: 18 }}>
              {idx + 1}
            </span>
            {line.map(([t, c], i) => (
              <span key={i} style={{ color: c, whiteSpace: "pre" }}>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* terminal window — Claude Code TUI */}
      <div
        style={{
          position: "absolute",
          left: 902,
          top: 210,
          width: 462,
          height: 560,
          borderRadius: 14,
          background: "#0C0E13",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
          padding: "16px 20px",
          fontFamily: "Consolas, 'Courier New', monospace",
          fontSize: 16.5,
          lineHeight: 1.75,
          color: "#B8C0CC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#D97757", fontWeight: 800 }}>✳</span>
          <span style={{ color: "#E8EAF0", fontWeight: 700 }}>Claude Code</span>
          <span style={{ color: "#6E7681" }}>· Card.tsx</span>
        </div>
        <div style={{ marginTop: 10, color: "#6E7681" }}>&gt; fix the card padding</div>
        <div>
          <span style={{ color: "#D97757" }}>●</span> Looking at Card.tsx — I don&apos;t see the
          rendered result. Can you show me?
        </div>
        {/* sent message moves into history */}
        {f >= sentAt ? (
          <div style={{ color: "#6E7681" }}>
            &gt;{" "}
            <span
              style={{
                padding: "1px 8px",
                borderRadius: 5,
                background: "rgba(47,155,255,0.12)",
                border: "1px solid rgba(47,155,255,0.5)",
                color: "#7FB8E8",
                fontSize: 14,
              }}
            >
              [Image #1]
            </span>{" "}
            see it now?
          </div>
        ) : null}

        {/* input box */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 18,
            minHeight: 52,
            borderRadius: 10,
            border: `1.5px solid ${f >= pasteAt && f < sentAt ? SEL_BLUE : "rgba(255,255,255,0.16)"}`,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ color: "#6E7681" }}>&gt;</span>
          {f >= pasteAt && f < sentAt ? (
            <>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "rgba(47,155,255,0.16)",
                  border: `1px solid ${SEL_BLUE}`,
                  color: "#9CCFFF",
                  fontSize: 14.5,
                }}
              >
                [Image #1]
              </span>
              <span style={{ color: "#E8EAF0" }}>see it now?</span>
            </>
          ) : (
            <span
              style={{
                width: 9,
                height: 22,
                background: "#B8C0CC",
                opacity: f % 22 < 12 ? 1 : 0,
              }}
            />
          )}
        </div>

        {/* reply */}
        {f >= replyAt ? (
          <div style={{ marginTop: 8 }}>
            <div>
              <span style={{ color: "#D97757" }}>●</span>{" "}
              <span style={{ color: "#E8EAF0" }}>I see it — padding is 8px, needs 16.</span>
            </div>
            {f >= replyAt + 22 ? (
              <div>
                {"  "}Fixed in Card.tsx{" "}
                <span style={{ color: "#37C871", fontWeight: 800 }}>✓</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* MCP connect */}
        {f >= mcpAt ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#E8EAF0" }}>$ claude mcp add shotik</div>
            {f >= mcpAt + 14 ? (
              <div style={{ color: theme.shotik.accent }}>✓ connected · 6 tools</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* taskbar */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 14,
          translate: "-50% 0",
          height: 56,
          padding: "0 16px",
          borderRadius: 16,
          background: "rgba(18,20,28,0.88)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {["#2E86F0", "#37C871", "#FEBC2E", "#8B7CF7"].map((c, i) => (
          <div key={i} style={{ width: 32, height: 32, borderRadius: 9, background: c, opacity: 0.75 }} />
        ))}
        <Img src={staticFile("shotik/icon.png")} style={{ width: 34, height: 34, borderRadius: 9 }} />
      </div>

      {/* ── capture overlay (1:1 with the real one) ── */}
      {hasOverlay ? (
        <>
          {/* dim + faint grid */}
          {[
            { l: 0, t: 0, w: SW, h: SEL.y },
            { l: 0, t: SEL.y, w: SEL.x, h: SH - SEL.y },
            { l: selRight, t: SEL.y, w: SW - selRight, h: SH - SEL.y },
            { l: SEL.x, t: selBottom, w: curW, h: SH - selBottom },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: r.l,
                top: r.t,
                width: r.w,
                height: r.h,
                background: `rgba(4,6,10,${dim})`,
                backgroundImage:
                  dim > 0.3
                    ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
                    : undefined,
                backgroundSize: "100px 100px",
              }}
            />
          ))}

          {/* blue selection border */}
          <div
            style={{
              position: "absolute",
              left: SEL.x,
              top: SEL.y,
              width: curW,
              height: curH,
              border: `2px solid ${SEL_BLUE}`,
            }}
          />
          {drag > 0.98 ? (
            <>
              {/* round white handles (real style) */}
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
                    left: hx - 5.5,
                    top: hy - 5.5,
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    background: "#fff",
                    border: `1.5px solid ${SEL_BLUE}`,
                  }}
                />
              ))}
              {/* dark size chip, top-left above selection (real position) */}
              <div
                style={{
                  position: "absolute",
                  left: SEL.x,
                  top: SEL.y - 34,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: "rgba(16,18,24,0.95)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#E8EAF0",
                  fontFamily: "Consolas, monospace",
                }}
              >
                800 × 660
              </div>
            </>
          ) : null}

          {/* white floating toolbar + palette row (real design) */}
          {f >= toolbarAt ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: SEL.x + SEL.w / 2 - 300,
                  top: SEL.y + SEL.h + 14,
                  height: 52,
                  padding: "0 8px",
                  borderRadius: 13,
                  background: "#FAFBFD",
                  boxShadow: "0 14px 34px -8px rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {TOOLS.map((t, i) => {
                  if (t === "|")
                    return (
                      <div key={i} style={{ width: 1, height: 26, background: "rgba(3,20,35,0.12)", margin: "0 5px" }} />
                    );
                  const p = stagger01(f, i, toolbarAt, 1.5, 8);
                  const isCursor = i === 0;
                  const isCopy = t === "⧉";
                  const isAI = t === "✨";
                  const activeNow =
                    (t === "▭" && f >= boxAt && f < arrowAt) ||
                    (t === "↗" && f >= arrowAt && f < markerAt) ||
                    (t === "①" && f >= markerAt);
                  const bg = isCopy || activeNow ? SEL_BLUE : isCursor && f < boxAt ? "#E3EEFC" : "transparent";
                  const col = isCopy || activeNow ? "#fff" : isAI ? theme.shotik.accent : "#3A4657";
                  return (
                    <div
                      key={i}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        background: bg,
                        color: col,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
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
              {/* palette row */}
              <div
                style={{
                  position: "absolute",
                  left: SEL.x + SEL.w / 2 - 150,
                  top: SEL.y + SEL.h + 74,
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "rgba(16,18,24,0.95)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: clamp01((f - toolbarAt - 8) / 10),
                }}
              >
                {PALETTE.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: c,
                      outline: c === ANNOT_RED ? "2px solid rgba(255,255,255,0.85)" : undefined,
                      outlineOffset: 1.5,
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}

          {/* annotations: red box, arrow, ① marker — like overlay-annotations.png */}
          {f >= boxAt ? (
            <div
              style={{
                position: "absolute",
                left: BOX.x,
                top: BOX.y,
                width: BOX.w,
                height: BOX.h,
                border: `2.5px solid ${ANNOT_RED}`,
                borderRadius: 3,
              }}
            />
          ) : null}
          {f >= arrowAt ? (
            <svg width={SW} height={SH} style={{ position: "absolute", inset: 0 }}>
              <path
                d={ARROW}
                stroke={ANNOT_RED}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={620}
                strokeDashoffset={620 * (1 - arrowT)}
              />
              {arrowT > 0.93 ? <path d="M 508 416 L 520 400 L 536 412 Z" fill={ANNOT_RED} /> : null}
            </svg>
          ) : null}
          {markerOn ? (
            <div
              style={{
                position: "absolute",
                left: 160,
                top: CODE_TOP + 2 * LINE_H - 14,
                width: 28,
                height: 28,
                borderRadius: 999,
                background: ANNOT_RED,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(245,71,79,0.5)",
              }}
            >
              1
            </div>
          ) : null}
        </>
      ) : null}

      {/* smart-clipboard toast */}
      {toastO > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 22,
            padding: "12px 18px",
            borderRadius: 13,
            background: "rgba(16,18,24,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: toastO,
            translate: `0 ${(1 - toastO) * -12}px`,
            zIndex: 70,
          }}
        >
          <Img src={staticFile("shotik/icon.png")} style={{ width: 26, height: 26, borderRadius: 7 }} />
          <div style={{ fontSize: 16.5, fontWeight: 700, color: "#E8EAF0" }}>
            Copied — PNG + file path
          </div>
          <div style={{ color: "#37C871", fontWeight: 800, fontSize: 17 }}>✓</div>
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
          <path d="M4 2 L20 12 L12 13.5 L9.5 21 Z" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
