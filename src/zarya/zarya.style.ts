import type React from "react";
import { theme } from "../theme";
import { PIXELIFY, HANDJET, PT_SANS, MONO } from "./fonts";

/** theme.zarya shortcut — the single colour source for every Zarya component. */
export const Z = theme.zarya;

export const FONT = {
  pixel: PIXELIFY, // ЗАРЯ wordmark
  tech: HANDJET, // dot-matrix labels
  ui: PT_SANS, // body / buttons
  mono: MONO, // terminal / code
} as const;

/**
 * Logical size of the app window, built once and `scale()`d into the frame.
 * ~5:3, close to the real 1360×908 screenshot; internal chrome measured against it.
 */
export const APP = {
  w: 1500,
  h: 900,
  titlebar: 42,
  statusbar: 32,
  activity: 58, // left icon rail
  sidebar: 288, // sessions panel
  radius: 12,
} as const;

/**
 * CSS custom properties applied at the window root — mirrors how the real app
 * sets theme vars on <html>, so components read `var(--zy-accent)` and one swap
 * (the 9-themes beat) can recolor the whole window. Values are the Заря·Космос
 * defaults from theme.zarya.
 */
export const zaryaVars: React.CSSProperties = {
  ["--zy-bg" as string]: Z.bg,
  ["--zy-bg1" as string]: Z.bgElev1,
  ["--zy-bg2" as string]: Z.bgElev2,
  ["--zy-panel" as string]: Z.panel,
  ["--zy-console" as string]: Z.consoleBg,
  ["--zy-border" as string]: Z.border,
  ["--zy-border-strong" as string]: Z.borderStrong,
  ["--zy-fg" as string]: Z.fg,
  ["--zy-fg-dim" as string]: Z.fgDim,
  ["--zy-fg-faint" as string]: Z.fgFaint,
  ["--zy-accent" as string]: Z.accent,
  ["--zy-accent2" as string]: Z.accent2,
  ["--zy-grad" as string]: Z.accentGrad,
  ["--zy-danger" as string]: Z.danger,
  ["--zy-success" as string]: Z.success,
  ["--zy-term-fg" as string]: Z.termFg,
  ["--zy-font-pixel" as string]: FONT.pixel,
  ["--zy-font-tech" as string]: FONT.tech,
  ["--zy-font-ui" as string]: FONT.ui,
  ["--zy-font-mono" as string]: FONT.mono,
};

/** Terminal ANSI colour used by the fake shell output rows. */
export const ANSI = {
  fg: Z.termFg,
  green: Z.termGreen,
  yellow: Z.termYellow,
  blue: Z.termBlue,
  cyan: Z.termCyan,
  red: Z.accent,
  dim: Z.fgFaint,
} as const;
