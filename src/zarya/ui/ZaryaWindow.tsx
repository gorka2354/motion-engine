import React from "react";
import { Z, FONT, APP, zaryaVars } from "../zarya.style";
import { RocketBadge } from "../space/RocketMark";
import { PixelWordmark } from "../space/PixelWordmark";
import { Icon, ShellBadge, Diamond } from "./icons";

/** Bottom agent-bar state — the one unified input under the terminal. */
export interface AgentState {
  mode?: string; // ТЕРМИНАЛ | CLAUDE CODE | ZARYA
  bolt?: boolean; // agent mode (bolt icon) vs shell (terminal icon)
  placeholder?: string;
  text?: string; // typed text (overrides placeholder)
  caret?: boolean; // show blinking caret at end of text
  model?: string; // model chip (zarya mode)
  effort?: number; // 0..4 thrust bars (zarya mode)
  fuel?: string; // fuel strip value
}

export interface ZaryaWindowProps {
  main: React.ReactNode;
  overlay?: React.ReactNode; // launch pad / history / gallery popover
  sidebar?: React.ReactNode; // sessions panel content (default = empty state)
  agent?: AgentState;
  bottomBar?: React.ReactNode; // replaces the agent bar (e.g. the ClaudeQuestionBar morph)
  tab?: string;
  cwd?: string;
  statusModel?: string;
  activeRail?: "blocks" | "folder" | "sun" | "clock";
  vars?: React.CSSProperties; // theme-var override (9-themes beat)
}

/** The collapsed IDE-АГЕНТ rail on the far right — the editor is a SIDE feature,
 *  one click away, not the core (the core is the terminal + agent). */
const IdeRail: React.FC = () => (
  <div
    style={{
      width: 30,
      flexShrink: 0,
      background: "var(--zy-panel)",
      borderLeft: "1px solid var(--zy-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 10,
    }}
  >
    <span
      style={{
        writingMode: "vertical-rl",
        transform: "rotate(180deg)",
        fontFamily: FONT.tech,
        fontSize: 12,
        letterSpacing: "0.18em",
        color: Z.termCyan,
        opacity: 0.85,
      }}
    >
      IDE-АГЕНТ
    </span>
  </div>
);

const TECH = FONT.tech;
const UI = FONT.ui;

const railIcons: Array<{ key: "blocks" | "folder" | "sun" | "clock"; name: "blocks" | "folder" | "sun" | "clock" }> = [
  { key: "blocks", name: "blocks" },
  { key: "folder", name: "folder" },
  { key: "sun", name: "sun" },
  { key: "clock", name: "clock" },
];

const Titlebar: React.FC<{ tab: string }> = ({ tab }) => (
  <div
    style={{
      height: APP.titlebar,
      flexShrink: 0,
      background: "var(--zy-panel)",
      borderBottom: "1px solid var(--zy-border)",
      display: "flex",
      alignItems: "center",
      paddingLeft: 12,
      gap: 14,
    }}
  >
    <RocketBadge size={20} />
    <PixelWordmark size={16} />
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginLeft: 10, height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 30,
          padding: "0 12px",
          background: "var(--zy-bg1)",
          borderTop: "2px solid var(--zy-accent)",
          borderRadius: "6px 6px 0 0",
          color: "var(--zy-fg)",
          fontFamily: UI,
          fontSize: 13.5,
        }}
      >
        <ShellBadge label="PS" />
        <span>{tab}</span>
        <Icon name="close" size={12} color={Z.fgFaint} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, color: Z.fgDim }}>
        <Icon name="plus" size={15} />
      </div>
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", height: "100%" }}>
      {(["min", "max", "close"] as const).map((n) => (
        <div
          key={n}
          style={{ width: 46, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: Z.fgDim }}
        >
          <Icon name={n} size={n === "max" ? 12 : 15} strokeWidth={1.5} />
        </div>
      ))}
    </div>
  </div>
);

const ActivityBar: React.FC<{ active: string }> = ({ active }) => (
  <div
    style={{
      width: APP.activity,
      flexShrink: 0,
      background: "var(--zy-panel)",
      borderRight: "1px solid var(--zy-border)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 14,
      gap: 8,
    }}
  >
    {railIcons.map(({ key, name }) => {
      const on = key === active;
      return (
        <div
          key={key}
          style={{
            position: "relative",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: on ? Z.accent : Z.fgFaint,
          }}
        >
          {on && (
            <span style={{ position: "absolute", left: -9, top: 8, width: 3, height: 24, background: Z.accent, borderRadius: 2 }} />
          )}
          <Icon name={name} size={21} />
        </div>
      );
    })}
    <div style={{ flex: 1 }} />
    <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: Z.fgFaint }}>
      <Icon name="sun" size={19} />
    </div>
    <div style={{ width: 40, height: 40, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", color: Z.fgFaint }}>
      <Icon name="gear" size={19} />
    </div>
  </div>
);

const SessionsEmpty: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "14px 14px", height: "100%" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Diamond size={7} />
      <span style={{ fontFamily: TECH, fontSize: 15, letterSpacing: "0.14em", color: Z.accent2 }}>СЕССИИ</span>
      <span style={{ fontFamily: TECH, fontSize: 12, letterSpacing: "0.18em", color: Z.fgFaint }}>SESSIONS</span>
      <div style={{ flex: 1 }} />
      <Icon name="plus" size={15} color={Z.fgFaint} />
    </div>
    <div
      style={{
        height: 36,
        borderRadius: 6,
        background: "var(--zy-bg1)",
        border: "1px solid var(--zy-border)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 12,
        fontFamily: UI,
        fontSize: 13,
        color: Z.fgFaint,
      }}
    >
      Поиск сессий…
    </div>
    <div style={{ textAlign: "center", fontFamily: UI, fontSize: 12.5, lineHeight: 1.55, color: Z.fgFaint, padding: "10px 6px" }}>
      Здесь появятся сохранённые сессии. Они переживают перезапуск и выключение — просто продолжай с того места, где остановился.
    </div>
    <div
      style={{
        height: 40,
        borderRadius: 6,
        border: "1px solid var(--zy-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: TECH,
        fontSize: 14,
        letterSpacing: "0.1em",
        color: Z.fgDim,
      }}
    >
      <Icon name="plus" size={14} /> НОВАЯ СЕССИЯ
    </div>
    <div style={{ fontFamily: TECH, fontSize: 12, letterSpacing: "0.16em", color: Z.fgFaint, marginTop: 4 }}>ЭКИПАЖ · АГЕНТЫ</div>
    <div
      style={{
        height: 38,
        borderRadius: 6,
        background: "var(--zy-bg1)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 12,
        fontFamily: UI,
        fontSize: 13.5,
        color: Z.fg,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 8, background: Z.success, boxShadow: `0 0 8px ${Z.success}` }} />
      Борт-инженер / готов
    </div>
  </div>
);

const TerminalHeader: React.FC<{ cwd: string }> = ({ cwd }) => (
  <div
    style={{
      height: 40,
      flexShrink: 0,
      borderBottom: "1px solid var(--zy-border)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 14px",
    }}
  >
    <Diamond size={7} />
    <span style={{ fontFamily: TECH, fontSize: 13.5, letterSpacing: "0.14em", color: Z.accent }}>CLI-АГЕНТ·ЗАРЯ</span>
    <span style={{ fontFamily: FONT.mono, fontSize: 12.5, color: Z.fgFaint }}>{cwd}</span>
    <div style={{ flex: 1 }} />
    <Icon name="split" size={16} color={Z.fgFaint} />
    <Icon name="search" size={16} color={Z.fgFaint} />
  </div>
);

const ThrustBars: React.FC<{ n: number }> = ({ n }) => (
  <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
    {Array.from({ length: 4 }, (_, i) => (
      <span
        key={i}
        style={{
          width: 8,
          height: 12,
          borderRadius: 1,
          border: `1px solid ${Z.borderStrong}`,
          background: i < n ? Z.accentGrad : "transparent",
        }}
      />
    ))}
  </span>
);

const AgentBar: React.FC<{ a: AgentState }> = ({ a }) => {
  const mode = a.mode ?? "ТЕРМИНАЛ";
  const bolt = a.bolt ?? false;
  const fuel = a.fuel ?? "∞ без лимита · локальный борт";
  const placeholder = a.placeholder ?? "Команда терминала…  (Enter — выполнить)";
  return (
    <div style={{ flexShrink: 0, borderTop: "1px solid var(--zy-border)", background: "var(--zy-bg)" }}>
      {/* ТОПЛИВО strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderBottom: "1px solid var(--zy-border)" }}>
        <svg width="11" height="11" viewBox="0 0 16 16" shapeRendering="crispEdges" fill={Z.accent2}>
          <rect x="4" y="2" width="6" height="2" />
          <rect x="4" y="4" width="6" height="9" />
          <rect x="10" y="5" width="3" height="2" />
          <rect x="12" y="6" width="1" height="4" />
        </svg>
        <span style={{ fontFamily: TECH, fontSize: 12.5, letterSpacing: "0.14em", color: Z.accent2 }}>ТОПЛИВО</span>
        <span style={{ fontFamily: UI, fontSize: 12, color: Z.fgFaint }}>{fuel}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: TECH, fontSize: 12, letterSpacing: "0.08em", color: Z.fgFaint }}>пульт ▴</span>
      </div>
      {/* input row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            height: 30,
            padding: "0 11px",
            borderRadius: 5,
            border: `1px solid ${bolt ? Z.borderStrong : Z.border}`,
            background: bolt ? "rgba(226,35,26,0.10)" : "transparent",
            fontFamily: TECH,
            fontSize: 12.5,
            letterSpacing: "0.08em",
            color: bolt ? Z.accent : Z.fgDim,
            flexShrink: 0,
          }}
        >
          <Icon name={bolt ? "bolt" : "terminal"} size={13} />
          {mode}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontFamily: FONT.mono, fontSize: 13.5, color: a.text ? Z.fg : Z.fgFaint, whiteSpace: "nowrap", overflow: "hidden" }}>
          {a.text ?? placeholder}
          {a.caret && <span style={{ borderLeft: `2px solid ${Z.accent2}`, marginLeft: 1, opacity: 0.9 }}>&nbsp;</span>}
        </div>
        {a.model && (
          <>
            {typeof a.effort === "number" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 28, padding: "0 8px", borderRadius: 5, border: `1px solid ${Z.border}` }}>
                <ThrustBars n={a.effort} />
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 28,
                padding: "0 10px",
                borderRadius: 5,
                border: `1px solid ${Z.border}`,
                fontFamily: TECH,
                fontSize: 12,
                letterSpacing: "0.06em",
                color: Z.accent2,
                flexShrink: 0,
              }}
            >
              {a.model}
              <span style={{ color: Z.fgFaint }}>▴</span>
            </div>
          </>
        )}
        <div
          style={{
            width: 34,
            height: 30,
            borderRadius: 5,
            background: "var(--zy-bg1)",
            border: `1px solid ${Z.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: Z.accent2,
            flexShrink: 0,
          }}
        >
          <Icon name="send" size={15} />
        </div>
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ model: string }> = ({ model }) => (
  <div
    style={{
      height: APP.statusbar,
      flexShrink: 0,
      background: "var(--zy-panel)",
      borderTop: "1px solid var(--zy-border)",
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      gap: 10,
      fontFamily: UI,
      fontSize: 12,
      color: Z.fgDim,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", border: `1px solid ${Z.border}`, borderRadius: 5 }}>
      <Icon name="folder" size={12} color={Z.fgFaint} />
      <span style={{ color: Z.fgFaint }}>~</span>
    </div>
    <div style={{ flex: 1 }} />
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <ShellBadge label="PS" size={14} />
      Windows PowerShell
      <span style={{ width: 6, height: 6, borderRadius: 6, background: Z.success }} />
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 5, color: Z.fgDim }}>
      <Icon name="lock" size={11} color={Z.fgFaint} /> ∞ Борт
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 6, color: Z.accent2 }}>
      <span style={{ color: Z.accent }}>✦</span> {model}
    </span>
  </div>
);

/**
 * The Zarya desktop window — pixel-faithful chrome (titlebar · activity rail ·
 * sessions panel · terminal header · agent bar · status bar) around a `main`
 * content slot with an `overlay` slot for popovers (launch pad, history,
 * theme gallery). Built at a fixed logical size (APP.w×APP.h) and scaled into
 * the frame by the scene. Colours come from CSS vars so the themes beat can
 * recolor the whole window by swapping `vars`.
 */
export const ZaryaWindow: React.FC<ZaryaWindowProps> = ({
  main,
  overlay,
  sidebar,
  agent = {},
  bottomBar,
  tab = "Терминал",
  cwd = "C:\\Users\\pesto",
  statusModel = "claude-sonnet-5",
  activeRail = "blocks",
  vars,
}) => (
  <div
    style={{
      ...zaryaVars,
      ...vars,
      width: APP.w,
      height: APP.h,
      borderRadius: APP.radius,
      overflow: "hidden",
      background: "var(--zy-bg)",
      boxShadow: Z.windowShadow,
      display: "flex",
      flexDirection: "column",
      fontFamily: UI,
      color: "var(--zy-fg)",
      position: "relative",
    }}
  >
    <Titlebar tab={tab} />
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <ActivityBar active={activeRail} />
      <div style={{ width: APP.sidebar, flexShrink: 0, background: "var(--zy-bg)", borderRight: "1px solid var(--zy-border)", minWidth: 0 }}>
        {sidebar ?? <SessionsEmpty />}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TerminalHeader cwd={cwd} />
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {main}
          {overlay}
        </div>
        {bottomBar ?? <AgentBar a={agent} />}
      </div>
      <IdeRail />
    </div>
    <StatusBar model={statusModel} />
  </div>
);
