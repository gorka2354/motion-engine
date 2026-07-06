import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { clamp01, EASE, EASE_INOUT, kf, stagger01 } from "../v2/anim";

/**
 * Realistic dev desktop (1408×880) reproducing the ACTUAL Shotik capture
 * flow 1:1. The toolbar uses the REAL SVG icons extracted from
 * screen_shotik/src/overlay/overlay.html (same paths, stroke style), the
 * real button order (tools · undo/redo · OCR/pin/save · Claude · copy · ✕)
 * and the real annotation look (straight red arrow, box, ① marker).
 * Feature beats: OCR (T) and Copy-for-Claude (A) get explicit clicks.
 */

const SW = 1408;
const SH = 880;

export const SEL = { x: 64, y: 76, w: 800, h: 660 } as const;

const SEL_BLUE = "#2F9BFF";
const ANNOT_RED = "#F5474F";

// ── Syntax-highlighted code (VS Code Dark+ palette) ─────────────────────────
type Tok = [string, string];
const K = "#C586C0";
const D = "#569CD6";
const F = "#DCDCAA";
const S = "#CE9178";
const T2 = "#4EC9B0";
const V = "#9CDCFE";
const P = "#D4D4D4";
const N = "#B5CEA8";
const C = "#6A9955";

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
const BUG_LINE = 5;

// ── REAL toolbar icons (SVG paths 1:1 from overlay.html) ────────────────────
type TbItem = { id: string; d: string[]; kind?: "sep" | "claude" | "primary" | "danger" };
const TB: TbItem[] = [
  { id: "move", d: ["M5 3l14 7-6.5 1.5L9 18 5 3z"] },
  { id: "pen", d: ["M3 21l1-4L15.5 5.5l3 3L7 20l-4 1z", "M14 7l3 3"] },
  { id: "arrow", d: ["M5 19L19 5", "M11.5 5H19v7.5"] },
  { id: "line", d: ["M5 19L19 5"] },
  { id: "rect", d: ["M6 5h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"] },
  { id: "ellipse", d: ["M3.5 12a8.5 6.5 0 1017 0 8.5 6.5 0 10-17 0"] },
  { id: "highlight", d: ["M9 11l4 4L20 8l-4-4-7 7z", "M9 11l-3.5 3.5L8 17l3-2", "M4 21h7"] },
  { id: "blur", d: ["M12 3.5s6 6.4 6 10.5a6 6 0 11-12 0C6 9.9 12 3.5 12 3.5z"] },
  { id: "text", d: ["M5 6V4h14v2", "M12 4v16", "M9 20h6"] },
  { id: "counter", d: ["M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z", "M10.5 9.5L12.5 8v8"] },
  { id: "sep1", kind: "sep", d: [] },
  { id: "undo", d: ["M9 14L4 9l5-5", "M4 9h10a6 6 0 010 12h-3"] },
  { id: "redo", d: ["M15 14l5-5-5-5", "M20 9H10a6 6 0 000 12h3"] },
  { id: "sep2", kind: "sep", d: [] },
  {
    id: "ocr",
    d: [
      "M3 7V5a2 2 0 012-2h2",
      "M17 3h2a2 2 0 012 2v2",
      "M21 17v2a2 2 0 01-2 2h-2",
      "M7 21H5a2 2 0 01-2-2v-2",
      "M7 8h10",
      "M7 12h6",
      "M7 16h8",
    ],
  },
  { id: "pin", d: ["M12 17v5", "M9 4h6l.8 6.2L18 13H6l2.2-2.8L9 4z"] },
  { id: "save", d: ["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", "M17 21v-8H7v8", "M7 3v5h8"] },
  {
    id: "claude",
    kind: "claude",
    d: [
      "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
      "M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z",
    ],
  },
  { id: "copy", kind: "primary", d: ["M9 9h9a2 2 0 012 2v7a2 2 0 01-2 2h-9a2 2 0 01-2-2v-7a2 2 0 012-2z", "M5 15V5a2 2 0 012-2h10"] },
  { id: "cancel", kind: "danger", d: ["M6 6l12 12", "M18 6L6 18"] },
];

// icon center offsets inside the toolbar
const TB_POS: number[] = [];
{
  let x = 8;
  for (const t of TB) {
    if (t.kind === "sep") {
      TB_POS.push(x + 5);
      x += 11;
    } else {
      TB_POS.push(x + 19);
      x += 40;
    }
  }
}
const TB_W = TB_POS[TB_POS.length - 1] + 19 + 8;
const TB_LEFT = SEL.x + SEL.w / 2 - TB_W / 2;
const TB_Y = SEL.y + SEL.h + 14;
const iconX = (id: string) => TB_LEFT + TB_POS[TB.findIndex((t) => t.id === id)];
const ICON_CY = TB_Y + 26;

const PALETTE = ["#F5474F", "#FF8A3D", "#FFD43B", "#37C871", "#2BC5D8", "#2F9BFF", "#8B7CF7", "#F06BC8", "#FFFFFF"];

const Ic: React.FC<{ d: string[] }> = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    width="21"
    height="21"
    style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}
  >
    {d.map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

export type CaptureTimings = {
  select: number;
  toolbar: number;
  arrow: number;
  box: number;
  marker: number;
  ocr: number;
  claude: number;
  lift: number;
  paste: number;
  sent: number;
  reply: number;
  mcp: number;
};

// annotation geometry
const ARROW_FROM = { x: 780, y: 520 };
const ARROW_TO = { x: 690, y: 352 };
const BOX0 = { x: 96, y: CODE_TOP + BUG_LINE * LINE_H - 8 };
const BOX_W = 644;
const BOX_H = 42;
const MARKER = { x: 175, y: CODE_TOP + 2 * LINE_H };

export const DesktopScreen: React.FC<{ t: CaptureTimings }> = ({ t }) => {
  const f = useCurrentFrame();

  const drag = EASE_INOUT(clamp01((f - t.select) / 22));
  const hasOverlay = f >= t.select && f < t.lift + 4;
  const curW = SEL.w * drag;
  const curH = SEL.h * drag;
  const dim = 0.52 * clamp01((f - t.select) / 10) * (f < t.lift ? 1 : 1 - clamp01((f - t.lift) / 12));

  // annotations
  const arrowT = clamp01((f - t.arrow - 2) / 20);
  const boxT = EASE(clamp01((f - t.box - 2) / 16));
  const markerOn = f >= t.marker + 4;
  const arrowLen = Math.hypot(ARROW_TO.x - ARROW_FROM.x, ARROW_TO.y - ARROW_FROM.y);
  const tipX = ARROW_FROM.x + (ARROW_TO.x - ARROW_FROM.x) * arrowT;
  const tipY = ARROW_FROM.y + (ARROW_TO.y - ARROW_FROM.y) * arrowT;

  // feature beats
  const ocrPopO = kf(f, [
    [t.ocr + 10, 0],
    [t.ocr + 20, 1],
    [t.claude - 6, 1],
    [t.claude + 4, 0],
  ]);
  const claudeHover = f >= t.claude;
  const claudeClick = f >= t.claude + 14;
  const keycapO = kf(f, [
    [t.claude + 2, 0],
    [t.claude + 12, 1],
    [t.lift, 1],
    [t.lift + 10, 0],
  ]);
  const keycapPress = f >= t.claude + 14 && f < t.claude + 22;

  const toastO = kf(f, [
    [t.lift + 4, 0],
    [t.lift + 16, 1],
    [t.lift + 90, 1],
    [t.lift + 106, 0],
  ]);

  // cursor route: drag corner → arrow icon → draw → rect icon → draw → counter icon
  // → marker spot → OCR icon → Claude button
  const cx = kf(f, [
    [0, 1080],
    [t.select - 12, SEL.x],
    [t.select + 22, SEL.x + SEL.w],
    [t.arrow - 8, iconX("arrow")],
    [t.arrow, ARROW_FROM.x],
    [t.arrow + 22, ARROW_TO.x],
    [t.box - 8, iconX("rect")],
    [t.box, BOX0.x],
    [t.box + 18, BOX0.x + BOX_W],
    [t.marker - 8, iconX("counter")],
    [t.marker + 2, MARKER.x],
    [t.ocr - 6, iconX("ocr")],
    [t.ocr + 10, iconX("ocr")],
    [t.claude - 6, iconX("claude")],
    [t.claude + 20, iconX("claude")],
  ]);
  const cy = kf(f, [
    [0, 780],
    [t.select - 12, SEL.y],
    [t.select + 22, SEL.y + SEL.h],
    [t.arrow - 8, ICON_CY],
    [t.arrow, ARROW_FROM.y],
    [t.arrow + 22, ARROW_TO.y],
    [t.box - 8, ICON_CY],
    [t.box, BOX0.y],
    [t.box + 18, BOX0.y + BOX_H],
    [t.marker - 8, ICON_CY],
    [t.marker + 2, MARKER.y],
    [t.ocr - 6, ICON_CY],
    [t.ocr + 10, ICON_CY],
    [t.claude - 6, ICON_CY],
    [t.claude + 20, ICON_CY],
  ]);
  const inDrag = f >= t.select && f < t.select + 22;
  const cxDraw = inDrag ? SEL.x + SEL.w * drag : cx;
  const cyDraw = inDrag ? SEL.y + SEL.h * drag : cy;
  const cursorO = f < t.lift ? 1 : 1 - clamp01((f - t.lift) / 10);

  const selRight = SEL.x + curW;
  const selBottom = SEL.y + curH;

  const activeTool =
    f >= t.claude ? "claude" : f >= t.ocr ? "ocr" : f >= t.marker - 8 ? "counter" : f >= t.box - 8 ? "rect" : f >= t.arrow - 8 ? "arrow" : "move";

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
            {line.map(([tx, c], i) => (
              <span key={i} style={{ color: c, whiteSpace: "pre" }}>
                {tx}
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
        {f >= t.sent ? (
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
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 18,
            minHeight: 52,
            borderRadius: 10,
            border: `1.5px solid ${f >= t.paste && f < t.sent ? SEL_BLUE : "rgba(255,255,255,0.16)"}`,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ color: "#6E7681" }}>&gt;</span>
          {f >= t.paste && f < t.sent ? (
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
            <span style={{ width: 9, height: 22, background: "#B8C0CC", opacity: f % 22 < 12 ? 1 : 0 }} />
          )}
        </div>
        {f >= t.reply ? (
          <div style={{ marginTop: 8 }}>
            <div>
              <span style={{ color: "#D97757" }}>●</span>{" "}
              <span style={{ color: "#E8EAF0" }}>I see it — padding is 8px, needs 16.</span>
            </div>
            {f >= t.reply + 22 ? (
              <div>
                {"  "}Fixed in Card.tsx <span style={{ color: "#37C871", fontWeight: 800 }}>✓</span>
              </div>
            ) : null}
          </div>
        ) : null}
        {f >= t.mcp ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#E8EAF0" }}>$ claude mcp add shotik</div>
            {f >= t.mcp + 14 ? <div style={{ color: theme.shotik.accent }}>✓ connected · 6 tools</div> : null}
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

      {/* ── capture overlay ── */}
      {hasOverlay ? (
        <>
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

          {/* toolbar — REAL icons, real order, real button styles */}
          {f >= t.toolbar ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: TB_LEFT,
                  top: TB_Y,
                  width: TB_W,
                  height: 52,
                  borderRadius: 13,
                  background: "#FAFBFD",
                  boxShadow: "0 14px 34px -8px rgba(0,0,0,0.55)",
                }}
              >
                {TB.map((tb, i) => {
                  if (tb.kind === "sep")
                    return (
                      <div
                        key={tb.id}
                        style={{
                          position: "absolute",
                          left: TB_POS[i] - 0.5,
                          top: 13,
                          width: 1,
                          height: 26,
                          background: "rgba(3,20,35,0.12)",
                        }}
                      />
                    );
                  const p = stagger01(f, i, t.toolbar, 1.2, 8);
                  const isActive = tb.id === activeTool;
                  const isClaudeBtn = tb.kind === "claude";
                  const pressed = isClaudeBtn && claudeClick;
                  const bg = pressed
                    ? theme.shotik.accent
                    : isActive && !isClaudeBtn
                      ? SEL_BLUE
                      : tb.kind === "primary"
                        ? SEL_BLUE
                        : isClaudeBtn && claudeHover
                          ? "rgba(124,92,255,0.16)"
                          : "transparent";
                  const col =
                    pressed || (isActive && !isClaudeBtn) || tb.kind === "primary"
                      ? "#fff"
                      : isClaudeBtn
                        ? theme.shotik.accent
                        : tb.kind === "danger"
                          ? "#C64A52"
                          : "#3A4657";
                  return (
                    <div
                      key={tb.id}
                      style={{
                        position: "absolute",
                        left: TB_POS[i] - 19,
                        top: 7,
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        background: bg,
                        color: col,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: p,
                        scale: String((0.6 + 0.4 * p) * (pressed && f < t.claude + 20 ? 0.88 : 1)),
                      }}
                    >
                      <Ic d={tb.d} />
                    </div>
                  );
                })}
              </div>
              {/* palette + stroke row */}
              <div
                style={{
                  position: "absolute",
                  left: SEL.x + SEL.w / 2 - 150,
                  top: TB_Y + 60,
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "rgba(16,18,24,0.95)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: clamp01((f - t.toolbar - 8) / 10),
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

          {/* ── annotations (real look: straight arrow + box + ① marker) ── */}
          {f >= t.box + 2 ? (
            <div
              style={{
                position: "absolute",
                left: BOX0.x,
                top: BOX0.y,
                width: BOX_W * boxT,
                height: BOX_H,
                border: `2.5px solid ${ANNOT_RED}`,
                borderRadius: 3,
              }}
            />
          ) : null}
          {f >= t.arrow + 2 ? (
            <svg width={SW} height={SH} style={{ position: "absolute", inset: 0 }}>
              <line
                x1={ARROW_FROM.x}
                y1={ARROW_FROM.y}
                x2={ARROW_TO.x}
                y2={ARROW_TO.y}
                stroke={ANNOT_RED}
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeDasharray={arrowLen}
                strokeDashoffset={arrowLen * (1 - arrowT)}
              />
              {arrowT > 0.92 ? (
                // real arrowhead: two short strokes at the tip
                <g stroke={ANNOT_RED} strokeWidth={4.5} strokeLinecap="round">
                  <line x1={tipX} y1={tipY} x2={tipX - 4} y2={tipY + 19} />
                  <line x1={tipX} y1={tipY} x2={tipX + 17} y2={tipY + 9} />
                </g>
              ) : null}
            </svg>
          ) : null}
          {markerOn ? (
            <div
              style={{
                position: "absolute",
                left: MARKER.x - 14,
                top: MARKER.y - 14,
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
                scale: String(0.5 + 0.5 * clamp01((f - t.marker - 4) / 8)),
              }}
            >
              1
            </div>
          ) : null}

          {/* OCR result popup (feature beat) */}
          {ocrPopO > 0 ? (
            <div
              style={{
                position: "absolute",
                left: iconX("ocr") - 170,
                top: TB_Y - 76,
                padding: "12px 18px",
                borderRadius: 12,
                background: "rgba(16,18,24,0.97)",
                border: "1px solid rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: ocrPopO,
                translate: `0 ${(1 - ocrPopO) * 10}px`,
              }}
            >
              <span style={{ color: SEL_BLUE, fontWeight: 800, fontSize: 16 }}>⛶</span>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: "#E8EAF0", fontFamily: "Consolas, monospace" }}>
                OCR: “style={"{{"} padding: 8 {"}}"}”
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#37C871" }}>copied ✓</span>
            </div>
          ) : null}

          {/* Copy-for-Claude: real tooltip + the A keycap (feature beat) */}
          {keycapO > 0 ? (
            <div
              style={{
                position: "absolute",
                left: iconX("claude") - 120,
                top: TB_Y - 76,
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: keycapO,
                translate: `0 ${(1 - keycapO) * 10}px`,
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "rgba(16,18,24,0.97)",
                  border: `1px solid ${theme.shotik.accent}`,
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "#E8EAF0",
                }}
              >
                Copy for Claude
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 9,
                  background: keycapPress ? theme.shotik.accent : "#22242E",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  boxShadow: keycapPress ? "none" : "0 3px 0 rgba(0,0,0,0.55)",
                  translate: `0 ${keycapPress ? 2 : 0}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 19,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "Consolas, monospace",
                }}
              >
                A
              </div>
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
            Copied for Claude — PNG + path
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
          style={{ position: "absolute", left: cxDraw, top: cyDraw, opacity: cursorO, zIndex: 80 }}
        >
          <path d="M4 2 L20 12 L12 13.5 L9.5 21 Z" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
