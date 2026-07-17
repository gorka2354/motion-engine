import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../../theme";
import { BottomNav } from "../../components/BottomNav";
import { GenThumb, type IconName } from "../LumoArt";

const L = theme.lumo;
const EASE = Easing.bezier(...theme.ease.enter);

// Self-contained coral-toned generate thumbnails (no product art).
const GEN: { label: string; icon: IconName; grad: string }[] = [
  { label: "Text", icon: "text", grad: "linear-gradient(135deg, #FB7185, #F1466A)" },
  { label: "Video", icon: "video", grad: "linear-gradient(135deg, #FF9E90, #FB7185)" },
  { label: "Image", icon: "image", grad: "linear-gradient(135deg, #FDA4AF, #F472B6)" },
  { label: "Audio", icon: "music", grad: "linear-gradient(135deg, #F9A8D4, #EC4899)" },
];

// Real provider logos (allowed) on light brand-tinted tiles.
const MODELS = [
  { name: "ChatGPT", desc: "Versatile everyday assistant", logo: "providers/openai.svg", tint: theme.providerTint.openai },
  { name: "Claude", desc: "Great for writing & analysis", logo: "home/course-claude.png", tint: "#F5EDE6", round: true },
  { name: "Gemini", desc: "Google's model, always current", logo: "providers/google.svg", tint: theme.providerTint.gemini },
  { name: "Runway", desc: "Generate AI video and effects", logo: "providers/runway.svg", tint: theme.providerTint.runway },
  { name: "Flux", desc: "Fast, affordable image generation", logo: "providers/flux.svg", tint: theme.providerTint.flux },
];

const PROMPT = "Summarize this report in 3 bullets";
const RESPONSE: { text: string; bold?: boolean }[] = [
  { text: "Here's the gist —", bold: true },
  { text: "Revenue grew 18% over last quarter." },
  { text: "Support tickets dropped after the redesign." },
  { text: "Next focus: onboarding and retention." },
];
const TYPE_WIN = [80, 124] as const;
const SHEET_AT = 140;
const LINE_AT = [166, 188, 210, 232];

/**
 * Lumo AI-tools hub. With `deep`, a prompt types itself into the chat bar,
 * sends, and a reply streams in on a sheet.
 */
export const LumoTools: React.FC<{ deep?: boolean }> = ({ deep = false }) => {
  const frame = useCurrentFrame();

  const typedCount = deep
    ? Math.round(
        interpolate(frame, [TYPE_WIN[0], TYPE_WIN[1]], [0, PROMPT.length], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      )
    : 0;
  const typed = PROMPT.slice(0, typedCount);
  const caretOn = deep && frame >= TYPE_WIN[0] && frame < SHEET_AT && frame % 16 < 9;
  const sendPulse = deep
    ? 1 + 0.2 * Math.sin(Math.PI * interpolate(frame, [126, 136], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
    : 1;
  const sheetIn = deep
    ? interpolate(frame, [SHEET_AT, SHEET_AT + 22], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      })
    : 0;
  const streaming = deep && frame >= SHEET_AT && frame < LINE_AT[3] + 16;

  return (
    <AbsoluteFill style={{ background: theme.color.surface, fontFamily: theme.font.stack, padding: "78px 30px 0" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: theme.color.ink, marginBottom: 16 }}>
        Generate
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {GEN.map((g, i) => {
          const a = interpolate(frame, [6 + i * 5, 20 + i * 5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          });
          return (
            <div key={g.label} style={{ flex: 1, opacity: a, scale: String(interpolate(a, [0, 1], [0.7, 1])) }}>
              <GenThumb icon={g.icon} grad={g.grad} />
              <div style={{ fontSize: 17, fontWeight: 700, color: theme.color.ink, textAlign: "center", marginTop: 8 }}>
                {g.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* new chat bar */}
      <div
        style={{
          marginTop: 22,
          height: 62,
          borderRadius: theme.radius.pill,
          background: theme.color.field,
          border: `1px solid ${theme.color.hair}`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          paddingRight: 8,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: typed ? 600 : 500,
            color: typed ? theme.color.ink : theme.color.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {typed || "Ask anything…"}
          {caretOn ? (
            <span
              style={{
                display: "inline-block",
                width: 2.5,
                height: 24,
                background: L.accentSolid,
                marginLeft: 3,
                verticalAlign: "-4px",
              }}
            />
          ) : null}
        </span>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            background: L.accentSolid,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            scale: String(sendPulse),
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M3 11l17-8-8 17-2.5-6.5L3 11Z" />
          </svg>
        </div>
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: theme.color.ink, margin: "28px 0 14px" }}>
        AI models
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MODELS.map((m, i) => {
          const a = interpolate(frame, [26 + i * 6, 40 + i * 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          });
          const highlight = i === 0 ? interpolate(frame, [70, 86], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <div
              key={m.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: theme.color.surface,
                border: `2px solid ${highlight > 0 ? L.accentSolid : theme.color.hair}`,
                borderRadius: 18,
                padding: 16,
                opacity: a,
                translate: `${interpolate(a, [0, 1], [24, 0])}px 0`,
                boxShadow: highlight > 0 ? L.cardHighlight : "none",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: m.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Img
                  src={staticFile(m.logo)}
                  style={{ width: 30, height: 30, objectFit: "contain", borderRadius: m.round ? 8 : 0 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.color.ink }}>{m.name}</div>
                <div style={{ fontSize: 17, fontWeight: 500, color: theme.color.muted, marginTop: 2 }}>{m.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav active="tools" />

      {/* deep mode: streaming reply sheet */}
      {deep && sheetIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 620,
            background: "#fff",
            borderRadius: "30px 30px 0 0",
            boxShadow: theme.shadow.sheet,
            padding: "30px 34px",
            zIndex: 40,
            translate: `0 ${(1 - sheetIn) * 100}%`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                background: theme.providerTint.openai,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Img src={staticFile("providers/openai.svg")} style={{ width: 27, height: 27 }} />
            </div>
            <div style={{ fontSize: 23, fontWeight: 800, color: theme.color.ink }}>ChatGPT</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: theme.color.muted }}>
              {streaming ? "· generating…" : "· ready"}
            </div>
            {!streaming ? (
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke={theme.color.green} strokeWidth="2.4">
                <path d="M3.5 9.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            {RESPONSE.map((line, i) => {
              const a = interpolate(frame, [LINE_AT[i], LINE_AT[i] + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE,
              });
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 22,
                    lineHeight: 1.45,
                    fontWeight: line.bold ? 700 : 500,
                    color: line.bold ? theme.color.ink : theme.color.body,
                    opacity: a,
                    translate: `0 ${(1 - a) * 12}px`,
                  }}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
