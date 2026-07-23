import React from "react";
import { useCurrentFrame } from "remotion";
import { Z, FONT } from "../zarya.style";
import { Icon, ShellBadge, Diamond } from "./icons";

interface HistoryEntry {
  cmd: string;
  cwd: string;
  shell: "PS" | "bash";
  exit: number;
}

/** Realistic dev commands across two sessions/machines — what Ctrl+R would surface. */
const HISTORY: HistoryEntry[] = [
  { cmd: "git status", cwd: "~/zarya", shell: "PS", exit: 0 },
  { cmd: "git log --oneline -12", cwd: "~/zarya", shell: "PS", exit: 0 },
  { cmd: 'git commit -m "feat: launch pad"', cwd: "~/zarya", shell: "PS", exit: 0 },
  { cmd: "npm run build", cwd: "~/zarya", shell: "PS", exit: 0 },
  { cmd: "gh pr create", cwd: "~/zarya", shell: "PS", exit: 1 },
  { cmd: "git push origin main", cwd: "~/zarya", shell: "PS", exit: 0 },
  { cmd: "git diff --stat", cwd: "~/work/api", shell: "bash", exit: 0 },
];

const SHELL_COLOR: Record<HistoryEntry["shell"], string> = {
  PS: Z.termBlue,
  bash: Z.termGreen,
};

/** Splits `text` into [before, match, after] around the first case-insensitive hit of `needle`. */
const splitMatch = (text: string, needle: string): [string, string, string] | null => {
  if (!needle) return null;
  const i = text.toLowerCase().indexOf(needle.toLowerCase());
  if (i < 0) return null;
  return [text.slice(0, i), text.slice(i, i + needle.length), text.slice(i + needle.length)];
};

const HighlightedCmd: React.FC<{ cmd: string; query: string; active: boolean }> = ({ cmd, query, active }) => {
  const style: React.CSSProperties = {
    minWidth: 0,
    flex: 1,
    fontFamily: FONT.mono,
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: Z.fg,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  const parts = splitMatch(cmd, query.trim());
  if (!parts) return <span style={style}>{cmd}</span>;
  const [pre, hit, post] = parts;
  return (
    <span style={style}>
      {pre}
      <span style={{ color: Z.accent2 }}>{hit}</span>
      {post}
    </span>
  );
};

const ExitChip: React.FC<{ exit: number }> = ({ exit }) => (
  <span style={{ minWidth: 0, flexShrink: 0, fontFamily: FONT.mono, fontSize: 11, color: exit === 0 ? Z.success : Z.danger }}>
    {exit === 0 ? "✓ 0" : `✗ ${exit}`}
  </span>
);

const Row: React.FC<{ entry: HistoryEntry; query: string; active: boolean }> = ({ entry, query, active }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "9px 16px",
      background: active ? Z.bgElev2 : "transparent",
      borderLeft: `2px solid ${active ? Z.accent : "transparent"}`,
    }}
  >
    <ShellBadge label={entry.shell} color={SHELL_COLOR[entry.shell]} size={16} />
    <HighlightedCmd cmd={entry.cmd} query={query} active={active} />
    <span
      style={{
        minWidth: 0,
        flexShrink: 0,
        maxWidth: 150,
        fontFamily: FONT.mono,
        fontSize: 12,
        color: Z.fgFaint,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {entry.cwd}
    </span>
    <ExitChip exit={entry.exit} />
  </div>
);

export interface HistoryOverlayProps {
  /** Current search query typed into the palette. */
  query?: string;
  /** 0-based index of the highlighted row. */
  selected?: number;
}

/**
 * Pixel-faithful re-creation of zarya-terminal's "Хроника / Time Machine"
 * global command-history palette (opened with Ctrl+R) — a centered,
 * fuzzy-searchable list of past shell commands across sessions. Purely
 * presentational: the parent timeline drives `query`/`selected`, this
 * component only reads `useCurrentFrame` for the search-caret blink.
 */
export const HistoryOverlay: React.FC<HistoryOverlayProps> = ({ query = "git ", selected = 2 }) => {
  const frame = useCurrentFrame();
  const caretOn = Math.floor(frame / 20) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 640,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: Z.bgElev1,
          border: `1px solid ${Z.borderStrong}`,
          borderRadius: 10,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          fontFamily: FONT.ui,
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${Z.border}` }}>
          <Diamond size={8} />
          <span style={{ minWidth: 0, fontFamily: FONT.tech, fontSize: 15, letterSpacing: "0.16em", color: Z.accent2 }}>
            ХРОНИКА
          </span>
          <span style={{ minWidth: 0, fontFamily: FONT.tech, fontSize: 11, color: Z.fgFaint }}>TIME MACHINE</span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              minWidth: 0,
              flexShrink: 0,
              fontFamily: FONT.mono,
              fontSize: 11,
              color: Z.fgFaint,
              border: `1px solid ${Z.border}`,
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            Ctrl+R
          </span>
        </div>

        {/* search row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
          <Icon name="search" size={14} color={Z.fgFaint} />
          <span style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", fontFamily: FONT.mono, fontSize: 15, color: Z.fg }}>
            {query}
            <span
              style={{
                display: "inline-block",
                width: 0,
                height: 18,
                borderLeft: `2px solid ${Z.accent2}`,
                marginLeft: 1,
                opacity: caretOn ? 1 : 0,
              }}
            />
          </span>
        </div>

        {/* result list */}
        <div style={{ maxHeight: 360, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {HISTORY.map((entry, i) => (
            <Row key={entry.cmd} entry={entry} query={query} active={i === selected} />
          ))}
        </div>

        {/* footer */}
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${Z.border}`, fontFamily: FONT.tech, fontSize: 11, color: Z.fgFaint }}>
          ↑↓ выбрать · Enter выполнить · ESC закрыть
        </div>
      </div>
    </div>
  );
};
