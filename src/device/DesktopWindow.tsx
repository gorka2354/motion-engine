import React from "react";

/**
 * Reusable desktop-app window chrome — the counterpart to PhoneFrame for
 * app/product promos. A rounded, shadowed floating window with a titlebar
 * (macOS traffic-lights OR Windows min/max/close), a `title` slot, an optional
 * right-side slot, a body (children) and an optional status bar. Fully colour-
 * themeable so any brand drops straight in.
 *
 * Built at a fixed logical `width×height` and `transform: scale()`d into the
 * frame by the scene (like the engine's other device shells).
 */
export interface DesktopWindowProps {
  width: number;
  height: number;
  children: React.ReactNode; // window body
  os?: "mac" | "win";
  title?: React.ReactNode; // titlebar content (left of the spacer)
  titlebarRight?: React.ReactNode; // extra controls before the OS buttons
  statusbar?: React.ReactNode;
  radius?: number;
  titlebarHeight?: number;
  bg?: string;
  titlebarBg?: string;
  border?: string;
  fg?: string;
  shadow?: string;
  style?: React.CSSProperties;
}

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 12, height: 12, borderRadius: 12, background: c, display: "inline-block" }} />
);

const WinBtn: React.FC<{ kind: "min" | "max" | "close"; fg: string }> = ({ kind, fg }) => (
  <span style={{ width: 46, height: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", color: fg }}>
    <svg width={kind === "max" ? 11 : 14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      {kind === "min" && <path d="M5 12h14" />}
      {kind === "max" && <rect x="6" y="6" width="12" height="12" rx="1" />}
      {kind === "close" && <path d="M6 6l12 12M18 6L6 18" />}
    </svg>
  </span>
);

export const DesktopWindow: React.FC<DesktopWindowProps> = ({
  width,
  height,
  children,
  os = "win",
  title,
  titlebarRight,
  statusbar,
  radius = 12,
  titlebarHeight = 42,
  bg = "#0a0e1a",
  titlebarBg = "#080b16",
  border = "rgba(255,255,255,0.12)",
  fg = "#e9e4d6",
  shadow = "0 60px 140px -40px rgba(0,0,0,0.78), 0 24px 60px -30px rgba(0,0,0,0.6)",
  style,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      overflow: "hidden",
      background: bg,
      boxShadow: shadow,
      display: "flex",
      flexDirection: "column",
      color: fg,
      position: "relative",
      ...style,
    }}
  >
    <div
      style={{
        height: titlebarHeight,
        flexShrink: 0,
        background: titlebarBg,
        borderBottom: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingLeft: os === "mac" ? 14 : 12,
      }}
    >
      {os === "mac" && (
        <div style={{ display: "flex", gap: 8, marginRight: 6 }}>
          <Dot c="#ff5f57" />
          <Dot c="#febc2e" />
          <Dot c="#28c840" />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>{title}</div>
      {titlebarRight}
      {os === "win" && (
        <div style={{ display: "flex", height: "100%" }}>
          <WinBtn kind="min" fg={fg} />
          <WinBtn kind="max" fg={fg} />
          <WinBtn kind="close" fg={fg} />
        </div>
      )}
    </div>

    <div style={{ flex: 1, minHeight: 0, display: "flex" }}>{children}</div>

    {statusbar}
  </div>
);
