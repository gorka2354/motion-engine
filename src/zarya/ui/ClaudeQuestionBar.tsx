import React from "react";
import { staticFile } from "remotion";
import { Z, FONT } from "../zarya.style";
import { Icon } from "./icons";

export interface QOption {
  label: string;
  desc: string;
}

const pixelFrame: React.CSSProperties = {
  borderStyle: "solid",
  borderWidth: 4,
  borderImage: `url(${staticFile("zarya/pixel-frame-dark.png")}) 2 / 4px / 0 round`,
  imageRendering: "pixelated",
};

/**
 * The signature "single bar morphs into a choice" surface — when the Claude Code
 * agent raises an AskUserQuestion, the unified input area is REPLACED by this
 * native selector (numbered options + descriptions + a highlighted cursor row).
 * Pixel-framed like the app. Presentational: `cursor` is the highlighted option.
 */
export const ClaudeQuestionBar: React.FC<{
  question: string;
  options: QOption[];
  cursor?: number;
  badge?: string;
}> = ({ question, options, cursor = 0, badge = "ВЫБОР АГЕНТА" }) => (
  <div
    style={{
      ...pixelFrame,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "11px 13px",
      background: "color-mix(in srgb, #e2231a 6%, #10162a)",
      boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
    }}
  >
    {/* head */}
    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: Z.accent2, fontFamily: FONT.tech, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
        <Icon name="bolt" size={13} color={Z.accent2} /> {badge}
      </span>
      <span style={{ fontFamily: FONT.ui, fontSize: 14, color: Z.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{question}</span>
      <div style={{ flex: 1 }} />
      <Icon name="close" size={14} color={Z.fgFaint} />
    </div>

    {/* options */}
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {options.map((o, i) => {
        const on = i === cursor;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 5,
              border: `1px solid ${on ? "rgba(226,35,26,0.4)" : "transparent"}`,
              background: on ? "color-mix(in srgb, #e2231a 14%, #10162a)" : "transparent",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.tech,
                fontSize: 11,
                color: on ? "#0a0e1a" : Z.bg,
                background: on ? Z.accent : Z.fgFaint,
                borderRadius: 3,
                marginTop: 1,
              }}
            >
              {i + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT.ui, fontSize: 14, fontWeight: 700, color: Z.fg }}>{o.label}</div>
              <div style={{ fontFamily: FONT.ui, fontSize: 12, color: Z.fgDim, marginTop: 1 }}>{o.desc}</div>
            </div>
          </div>
        );
      })}
    </div>

    {/* footer */}
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
      <span style={{ fontFamily: FONT.tech, fontSize: 11.5, letterSpacing: "0.04em", color: Z.fgFaint }}>
        1–9 или ↑↓  ·  Enter — выбрать  ·  Esc — отключить
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ ...pixelFrame, padding: "5px 16px", background: Z.accent, color: "#fff5e8", fontFamily: FONT.ui, fontWeight: 700, fontSize: 12.5 }}>
        Выбрать
      </span>
    </div>
  </div>
);
