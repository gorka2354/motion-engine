import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { BottomNav } from "../components/BottomNav";

const EASE = Easing.bezier(...theme.ease.enter);

// Real Generate illustrations from the app (course_card_*).
const GEN = [
  { label: "Text", file: "gen/card4.webp" },
  { label: "Video", file: "gen/card1.webp" },
  { label: "Image", file: "gen/card3.webp" },
  { label: "Audio", file: "gen/card2.webp" },
];

// Real provider logos on light brand-tinted tiles.
const MODELS = [
  { name: "ChatGPT", desc: "Versatile text model from OpenAI", logo: "providers/openai.svg", tint: theme.providerTint.openai },
  { name: "GPT-5 by OpenAI", desc: "The new best overall AI model", logo: "providers/openai.svg", tint: theme.providerTint.openaiNeutral },
  { name: "Gemini", desc: "Google text model, always up to date", logo: "providers/google.svg", tint: theme.providerTint.gemini },
  { name: "Runway", desc: "Generate AI videos and effects", logo: "providers/runway.svg", tint: theme.providerTint.runway },
  { name: "Flux", desc: "Fast, affordable image generation", logo: "providers/flux.svg", tint: theme.providerTint.flux },
];

const PROMPT = "Write a LinkedIn post about my new app";
const RESPONSE: { text: string; bold?: boolean }[] = [
  { text: "🚀 Just shipped something I'm proud of —", bold: true },
  { text: "an app that turns AI curiosity into a daily skill." },
  { text: "Built it in public. Launching free this week." },
  { text: "#buildinpublic #AI" },
];
const TYPE_WIN = [80, 124] as const;
const SHEET_AT = 140;
const LINE_AT = [166, 188, 210, 232];

/**
 * The AI-tools hub. With `deep`, it also demos real usage: a prompt types
 * itself into the chat bar, sends, and a ChatGPT reply streams in on a sheet.
 */
export const AiToolsScreen: React.FC<{ deep?: boolean }> = ({ deep = false }) => {
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
              <div style={{ height: 92, borderRadius: 18, overflow: "hidden" }}>
                <Img src={staticFile(g.file)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
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
                background: theme.color.primary,
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
            background: theme.color.primary,
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
                border: `2px solid ${highlight > 0 ? theme.color.primary : theme.color.hair}`,
                borderRadius: 18,
                padding: 16,
                opacity: a,
                translate: `${interpolate(a, [0, 1], [24, 0])}px 0`,
                boxShadow: highlight > 0 ? theme.shadow.cardHighlight : "none",
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
                <Img src={staticFile(m.logo)} style={{ width: 30, height: 30, objectFit: "contain" }} />
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
