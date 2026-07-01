import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { BottomNav } from "../components/BottomNav";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Real Generate illustrations from the app (course_card_*).
const GEN = [
  { label: "Text", file: "gen/card4.webp" },
  { label: "Video", file: "gen/card1.webp" },
  { label: "Image", file: "gen/card3.webp" },
  { label: "Audio", file: "gen/card2.webp" },
];

// Real provider logos on light brand-tinted tiles.
const MODELS = [
  { name: "ChatGPT", desc: "Versatile text model from OpenAI", logo: "providers/openai.svg", tint: "#E7F7F0" },
  { name: "GPT-5 by OpenAI", desc: "The new best overall AI model", logo: "providers/openai.svg", tint: "#EEF1F5" },
  { name: "Gemini", desc: "Google text model, always up to date", logo: "providers/google.svg", tint: "#EAF1FE" },
  { name: "Runway", desc: "Generate AI videos and effects", logo: "providers/runway.svg", tint: "#EEF0F3" },
  { name: "Flux", desc: "Fast, affordable image generation", logo: "providers/flux.svg", tint: "#F0ECFE" },
];

export const AiToolsScreen: React.FC = () => {
  const frame = useCurrentFrame();

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
          background: "#F1F5F9",
          border: `1px solid ${theme.color.hair}`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          paddingRight: 8,
        }}
      >
        <span style={{ flex: 1, fontSize: 20, fontWeight: 500, color: theme.color.muted }}>
          Ask anything…
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
                boxShadow: highlight > 0 ? "0 12px 24px -12px rgba(18,124,224,0.45)" : "none",
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
    </AbsoluteFill>
  );
};
