import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { drawPath01 } from "../lib/morph";
import { getLength, getPointAtLength } from "@remotion/paths";
import { EASE_INOUT, kf } from "../v2/anim";

/**
 * Course-path screen (pixel-faithful to tixu.ai /course view, 2026-07-05):
 * course hero, five named levels, a zigzag of lesson nodes, final test and
 * the personal-certificate slot. Content scrolls inside the phone over
 * `scrollWindow` frames; a brand-blue trail draws itself along the path in
 * sync with the scroll.
 */

const W = 604;
const VIEW_H = W * (19.5 / 9);

const LEVELS = [
  {
    n: 1,
    name: "Beyond the Basics",
    lessons: [
      "From Helper to System",
      'Show Claude What "Good" Looks Like',
      "Break Big Jobs Into Steps",
      "Let Claude Write the Prompt",
    ],
  },
  {
    n: 2,
    name: "Build a Workspace That Runs Itself",
    lessons: [
      "Write Project Instructions",
      "Give Your Project a Knowledge Base",
      "Build a Skill Library",
    ],
  },
  {
    n: 3,
    name: "Make Real Things",
    lessons: ["Build Tools, Not Just Documents", "Publish and Reuse What You Build"],
  },
  {
    n: 4,
    name: "Pro Power-Ups",
    lessons: [
      "Connect Claude to Your Apps",
      "Ask Across Your Email, Calendar and Drive",
      "Let Claude Do the Work with Cowork",
    ],
  },
  {
    n: 5,
    name: "Judgment and Next Steps",
    lessons: ["Catch Claude's Mistakes", "Pick the Right Plan", "Final Test"],
  },
] as const;

// ── Static layout (module scope — pure) ─────────────────────────────────────
const HERO_TOP = 96;
const HERO_H = 336;
const LEVEL_H = 92;
const NODE_STEP = 146;
const NODE_XS = [168, 436];

type Item =
  | { type: "level"; y: number; n: number; name: string }
  | { type: "node"; y: number; x: number; label: string; active?: boolean; flag?: boolean }
  | { type: "cert"; y: number; x: number };

const buildLayout = () => {
  const items: Item[] = [];
  let y = HERO_TOP + HERO_H + 28;
  let i = 0;
  for (const lvl of LEVELS) {
    items.push({ type: "level", y, n: lvl.n, name: lvl.name });
    y += LEVEL_H + 46;
    for (const lesson of lvl.lessons) {
      items.push({
        type: "node",
        y,
        x: NODE_XS[i % 2],
        label: lesson,
        active: i === 0,
        flag: lesson === "Final Test",
      });
      y += NODE_STEP;
      i += 1;
    }
    y += 18;
  }
  items.push({ type: "cert", y: y + 10, x: NODE_XS[i % 2] });
  return { items, contentH: y + 10 + 150 };
};

const LAYOUT = buildLayout();
const TRAIL_POINTS = LAYOUT.items.filter(
  (it): it is Extract<Item, { type: "node" | "cert" }> =>
    it.type === "node" || it.type === "cert",
);
const TRAIL_PATH = TRAIL_POINTS.map(
  (p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`,
).join(" ");
const TRAIL_LEN = getLength(TRAIL_PATH);
const MAX_SCROLL = LAYOUT.contentH - VIEW_H + 30;

export const CoursePathScreen: React.FC<{
  /** [startFrame, endFrame] of the in-screen scroll; omit for a static top view. */
  scrollWindow?: [number, number];
  /** Hide the certificate slot from this frame on (a MagicMove picks it up). */
  hideCertAfter?: number;
}> = ({ scrollWindow, hideCertAfter }) => {
  const f = useCurrentFrame();
  const [s0, s1] = scrollWindow ?? [0, 1];
  const t = scrollWindow
    ? kf(f, [
        [s0, 0],
        [s1, 1],
      ])
    : 0;
  const scrollY = t * MAX_SCROLL;
  const tip = getPointAtLength(TRAIL_PATH, TRAIL_LEN * Math.min(1, t * 1.04));

  return (
    <AbsoluteFill style={{ background: theme.color.surface, fontFamily: theme.font.stack }}>
      {/* scrolling content */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, translate: `0 ${-scrollY}px` }}>
        {/* course hero */}
        <div
          style={{
            position: "absolute",
            top: HERO_TOP,
            left: 22,
            right: 22,
            height: HERO_H,
            borderRadius: 26,
            background: "linear-gradient(180deg, #ECE8FD 0%, #F9F8FF 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            textAlign: "center",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 26,
              background: theme.color.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              boxShadow: theme.color.softShadow,
            }}
          >
            🎓
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.color.muted, letterSpacing: 0.4 }}>
            advanced · 15 lessons
          </div>
          <div style={{ fontSize: 33, fontWeight: 800, color: theme.color.ink, lineHeight: 1.15, letterSpacing: -0.5 }}>
            Claude Advanced Workflows
          </div>
          <div
            style={{
              marginTop: 6,
              height: 52,
              padding: "0 34px",
              borderRadius: theme.radius.pill,
              background: theme.color.primary,
              color: "#fff",
              fontSize: 20,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              boxShadow: theme.shadow.buttonGlow,
            }}
          >
            Continue learning
          </div>
        </div>

        {/* trail: dotted track + draw-on progress */}
        <svg
          width={W}
          height={LAYOUT.contentH}
          viewBox={`0 0 ${W} ${LAYOUT.contentH}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <path
            d={TRAIL_PATH}
            stroke="rgba(3,20,35,0.12)"
            strokeWidth={5}
            strokeDasharray="2 16"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {t > 0.005 ? (
            <>
              <path
                d={TRAIL_PATH}
                stroke={theme.color.primary}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.85}
                {...drawPath01(TRAIL_PATH, t * 1.04)}
              />
              {t < 0.99 ? <circle cx={tip.x} cy={tip.y} r={13} fill={theme.color.primary} /> : null}
            </>
          ) : null}
        </svg>

        {/* levels, nodes, certificate */}
        {LAYOUT.items.map((it, idx) => {
          if (it.type === "level") {
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  top: it.y,
                  left: 22,
                  right: 22,
                  height: LEVEL_H,
                  borderRadius: 20,
                  background: theme.color.surface,
                  border: `1.5px solid ${theme.color.hair}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.color.muted }}>
                  Level <span style={{ color: theme.color.primary }}>{it.n}</span>
                </div>
                <div style={{ fontSize: 21, fontWeight: 800, color: theme.color.ink, letterSpacing: -0.3 }}>
                  {it.name}
                </div>
              </div>
            );
          }
          if (it.type === "node") {
            const reached = t * 1.04 > 0.02 && tip.y >= it.y - 8;
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  top: it.y,
                  left: it.x,
                  translate: "-50% -50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  width: 210,
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 26,
                    background: it.active || reached ? theme.color.primary : "#EEF2F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: it.flag ? 34 : 30,
                    boxShadow:
                      it.active || reached
                        ? "0 14px 26px -10px rgba(18,124,224,0.55)"
                        : "inset 0 -4px 0 rgba(3,20,35,0.05)",
                  }}
                >
                  {it.flag ? "🚩" : it.active ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
                      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                    </svg>
                  ) : reached ? (
                    <svg width="30" height="30" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2.6">
                      <path d="M3.5 9.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    "📖"
                  )}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: reached || it.active ? theme.color.ink : theme.color.muted,
                    textAlign: "center",
                    lineHeight: 1.25,
                  }}
                >
                  {it.label}
                </div>
              </div>
            );
          }
          if (hideCertAfter !== undefined && f >= hideCertAfter) return null;
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: it.y,
                left: it.x,
                translate: "-50% -50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                width: 230,
              }}
            >
              <div
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 30,
                  border: `2.5px dashed rgba(3,20,35,0.22)`,
                  background: "rgba(18,124,224,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 52,
                }}
              >
                🏅
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.color.ink }}>
                Personal certificate
              </div>
            </div>
          );
        })}
      </div>

      {/* fixed header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 132,
          background: theme.color.surface,
          borderBottom: `1px solid ${theme.color.hair}`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 14,
          zIndex: 30,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.color.ink }}>Course Progress</div>
        <div
          style={{
            position: "absolute",
            right: 26,
            bottom: 14,
            fontSize: 19,
            fontWeight: 700,
            color: theme.color.muted,
          }}
        >
          {Math.round(EASE_INOUT(Math.min(1, t * 1.02)) * 100)}%
        </div>
      </div>
    </AbsoluteFill>
  );
};
