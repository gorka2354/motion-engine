import React from "react";
import { Z, FONT, ANSI } from "../zarya.style";
import { ShellBadge } from "./icons";

/** One coloured terminal output line (a token list or a plain string). */
export type Line = string | Array<{ t: string; c?: string }>;

export interface BlockData {
  cmd: string;
  output?: Line[];
  exit: number; // 0 = success
  duration: string; // "40мс" / "3.4с"
  cwd?: string; // shown short, e.g. "~\zarya"
}

const renderLine = (ln: Line, key: number): React.ReactNode => {
  if (typeof ln === "string") return <div key={key}>{ln || " "}</div>;
  return (
    <div key={key}>
      {ln.map((seg, i) => (
        <span key={i} style={{ color: seg.c ?? ANSI.fg }}>
          {seg.t}
        </span>
      ))}
    </div>
  );
};

/** Instrument-panel status pill: ✓ 0 · 40мс (green) / ✗ 1 · 2.4с (red). */
export const StatusPill: React.FC<{ exit: number; duration: string }> = ({ exit, duration }) => {
  const ok = exit === 0;
  const c = ok ? Z.success : Z.danger;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "1px 8px",
        borderRadius: 4,
        border: `1px solid ${c}55`,
        background: `${c}14`,
        fontFamily: FONT.mono,
        fontSize: 11.5,
        color: c,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontWeight: 700 }}>{ok ? "✓" : "✗"}</span>
      {exit} · {duration}
    </span>
  );
};

/**
 * A command block — command + output + an exit/duration pill, framed as a
 * navigable instrument-panel row (Zarya's OSC-133 block model). `focused` draws
 * the Ctrl+↑/↓ navigation ring; `rerun` flags a re-run badge.
 */
export const Block: React.FC<{ data: BlockData; focused?: boolean; rerun?: boolean; dim?: number }> = ({
  data,
  focused = false,
  rerun = false,
  dim = 1,
}) => {
  const ok = data.exit === 0;
  const accent = ok ? Z.success : Z.danger;
  return (
    <div
      style={{
        position: "relative",
        marginBottom: 9,
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${focused ? Z.borderStrong : "transparent"}`,
        background: focused ? "rgba(224,177,90,0.05)" : "transparent",
        opacity: dim,
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, background: accent, opacity: 0.75 }} />
      {/* command row */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 12px 6px 14px" }}>
        <ShellBadge label="PS" size={15} />
        <span style={{ fontFamily: FONT.mono, fontSize: 13, color: Z.fgFaint }}>{data.cwd ?? "~\\zarya"}</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 14, color: Z.accent2 }}>❯</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 14, color: Z.fg, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.cmd}
        </span>
        <div style={{ flex: 1 }} />
        {rerun && (
          <span style={{ fontFamily: FONT.tech, fontSize: 10.5, letterSpacing: "0.08em", color: Z.accent2, opacity: 0.9 }}>↻ ПОВТОР</span>
        )}
        <StatusPill exit={data.exit} duration={data.duration} />
      </div>
      {/* output */}
      {data.output && data.output.length > 0 && (
        <div style={{ padding: "0 12px 8px 14px", fontFamily: FONT.mono, fontSize: 13, lineHeight: 1.5, color: ANSI.fg }}>
          {data.output.map((ln, i) => renderLine(ln, i))}
        </div>
      )}
    </div>
  );
};
