import React from "react";
import { useCurrentFrame } from "remotion";
import { Z, FONT } from "../zarya.style";
import { Icon, Diamond } from "./icons";
import { PixelRocket } from "../space/PixelRocket";

const TECH = FONT.tech;

const MODELS = ["claude-sonnet-5", "claude-opus-4-8", "claude-haiku-4-5-20251001"] as const;
const MODEL_CHIP = ["SONNET", "OPUS", "HAIKU"] as const;
const THRUST_LABEL = ["МИНИМ.", "НИЗКАЯ", "СРЕДНЯЯ", "ВЫСОКАЯ", "МАКС."] as const;

export interface LaunchPadProps {
  /** 0-based index into the model list — which engine is armed. */
  selected?: number;
  /** 0..4 thrust segments filled. */
  thrust?: number;
  /** Dips the launch button toward a pressed state. */
  pressed?: boolean;
}

/** The console's little launch scene: rocket between two tower rails + stars. */
const ConsoleScene: React.FC = () => {
  const f = useCurrentFrame();
  // Slow top-to-bottom scanline sweep, looping every 90 frames — pure fn of frame.
  const period = 90;
  const scanY = 8 + (76 * (f % period)) / period;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 1, background: "rgba(255,255,255,0.05)" }} />
      <span style={{ position: "absolute", left: 22, top: 14, width: 2, height: 2, borderRadius: 1, background: Z.fgFaint, opacity: 0.7 }} />
      <span style={{ position: "absolute", right: 30, top: 22, width: 2, height: 2, borderRadius: 1, background: Z.fgFaint, opacity: 0.5 }} />
      <span style={{ position: "absolute", left: 60, top: 10, width: 2, height: 2, borderRadius: 1, background: Z.fgFaint, opacity: 0.6 }} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 10,
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "flex-end",
          gap: 18,
        }}
      >
        <span style={{ width: 2, height: 40, background: Z.fgFaint, opacity: 0.55 }} />
        <PixelRocket size={54} glow />
        <span style={{ width: 2, height: 40, background: Z.fgFaint, opacity: 0.55 }} />
      </div>
    </div>
  );
};

const Console: React.FC = () => (
  <div
    style={{
      position: "relative",
      height: 96,
      flexShrink: 0,
      background: Z.consoleBg,
      borderBottom: `1px solid ${Z.border}`,
      padding: "10px 12px",
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <span style={{ minWidth: 0, fontFamily: TECH, fontSize: 13, letterSpacing: "0.14em", color: Z.accent2 }}>
        ПУСКОВОЙ КОМПЛЕКС
      </span>
      <span
        style={{
          minWidth: 0,
          fontFamily: TECH,
          fontSize: 15,
          color: Z.accent2,
          textShadow: "0 0 10px rgba(224,177,90,0.55)",
        }}
      >
        05:47:03
      </span>
    </div>
    <ConsoleScene />
  </div>
);

const ModelRow: React.FC<{ name: string; chip: string; active: boolean }> = ({ name, chip, active }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "6px 9px",
      borderRadius: 3,
      fontFamily: TECH,
      letterSpacing: "0.03em",
      color: active ? Z.fg : Z.fgDim,
      background: active ? "rgba(226,35,26,0.08)" : "transparent",
      border: `1px solid ${active ? "rgba(226,35,26,0.30)" : "transparent"}`,
    }}
  >
    {active ? (
      <Diamond size={6} color={Z.accent} />
    ) : (
      <span style={{ width: 6, height: 6, borderRadius: "50%", border: `1px solid ${Z.fgFaint}`, flexShrink: 0 }} />
    )}
    <span style={{ minWidth: 0, flex: 1, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {name}
    </span>
    <span
      style={{
        minWidth: 0,
        flexShrink: 0,
        fontFamily: FONT.tech,
        fontSize: 10,
        letterSpacing: "0.08em",
        color: Z.accent2,
        border: `1px solid rgba(224,177,90,0.4)`,
        borderRadius: 3,
        padding: "1px 5px",
      }}
    >
      {chip}
    </span>
  </div>
);

const ThrustRow: React.FC<{ thrust: number }> = ({ thrust }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
    <span style={{ fontFamily: TECH, fontSize: 12, color: Z.fgFaint, flexShrink: 0 }}>ТЯГА</span>
    <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 3 }}>
      {Array.from({ length: 4 }, (_, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            height: 16,
            borderRadius: 2,
            border: `1px solid ${Z.borderStrong}`,
            background: i < thrust ? Z.accentGrad : "transparent",
          }}
        />
      ))}
    </div>
    <span style={{ minWidth: 76, flexShrink: 0, fontFamily: TECH, fontSize: 15, color: Z.accent2, textAlign: "right" }}>
      {THRUST_LABEL[thrust]}
    </span>
  </div>
);

/**
 * Pixel-faithful re-creation of zarya-terminal's "Пусковой комплекс" (Launch
 * Pad) popover — engine model picker + thrust dial + launch button. Purely
 * presentational: the parent timeline drives `selected`/`thrust`/`pressed`,
 * this component only reads `useCurrentFrame` for the console scanline.
 */
export const LaunchPad: React.FC<LaunchPadProps> = ({ selected = 1, thrust = 4, pressed = false }) => (
  <div
    style={{
      width: 302,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: Z.bgElev1,
      border: `1px solid ${Z.borderStrong}`,
      borderRadius: 6,
      boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
      fontFamily: FONT.ui,
    }}
  >
    <Console />
    <div style={{ padding: "11px 12px 13px", background: Z.bgElev1 }}>
      <div style={{ fontFamily: TECH, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: Z.fgFaint, marginBottom: 6 }}>
        ДВИГАТЕЛЬ · МОДЕЛЬ
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {MODELS.map((name, i) => (
          <ModelRow key={name} name={name} chip={MODEL_CHIP[i]} active={i === selected} />
        ))}
      </div>
      <ThrustRow thrust={thrust} />
      <div
        style={{
          marginTop: 12,
          height: 40,
          borderRadius: 5,
          background: Z.accentGrad,
          color: "#fff2ec",
          fontFamily: TECH,
          fontSize: 15,
          letterSpacing: "0.12em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: pressed ? "0 6px 18px -4px rgba(226,35,26,0.75)" : "0 10px 26px -8px rgba(226,35,26,0.6)",
          transform: pressed ? "scale(0.97)" : "scale(1)",
          filter: pressed ? "brightness(1.12)" : "brightness(1)",
        }}
      >
        <Icon name="bolt" size={14} color="#fff2ec" />
        ПУСК · ПОЕХАЛИ
      </div>
      <div style={{ marginTop: 8, fontFamily: FONT.ui, fontSize: 11, color: Z.fgFaint, textAlign: "center" }}>
        двигатель и тяга применятся к агенту
      </div>
    </div>
  </div>
);
