import React from "react";
import { Z, FONT } from "../zarya.style";
import { ShellBadge } from "./icons";

const clip = (s: string, n: number): string => s.slice(0, Math.max(0, Math.floor(n)));

/** The "⚡ ОТВЕТ АГЕНТА" divider — a dashed rule with the label centered. */
const AgentDivider: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0 8px", padding: "0 4px" }}>
    <div style={{ flex: 1, height: 0, borderTop: `1px dashed ${Z.borderStrong}` }} />
    <span style={{ fontFamily: FONT.tech, fontSize: 12, letterSpacing: "0.14em", color: Z.accent2, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: Z.accent }}>⚡</span> ОТВЕТ АГЕНТА
    </span>
    <div style={{ flex: 1, height: 0, borderTop: `1px dashed ${Z.borderStrong}` }} />
  </div>
);

const PatchCard: React.FC = () => (
  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${Z.border}`, background: Z.bg, marginTop: 8, maxWidth: 640 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 11px", borderBottom: `1px solid ${Z.border}`, fontFamily: FONT.tech, fontSize: 12, letterSpacing: "0.1em", color: Z.accent2 }}>
      <span style={{ width: 6, height: 6, background: Z.accent, transform: "rotate(45deg)", display: "inline-block" }} /> ПАТЧ · aiProxy.ts
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: FONT.ui, fontSize: 11, color: Z.fgFaint }}>копировать · вставить</span>
    </div>
    <div style={{ fontFamily: FONT.mono, fontSize: 12.5, lineHeight: 1.55, padding: "6px 0" }}>
      {[
        { s: " ", t: "  aiProxy.ts", c: Z.fgFaint },
        { s: "-", t: "  let key = req.headers['x-api-key']", c: Z.danger, bg: "rgba(240,69,58,0.12)" },
        { s: "+", t: "  const key = req.headers['x-api-key']", c: Z.success, bg: "rgba(95,184,138,0.14)" },
        { s: " ", t: "  return proxy(key)", c: Z.fgDim },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", background: r.bg ?? "transparent", padding: "0 11px" }}>
          <span style={{ width: 14, color: r.c, flexShrink: 0 }}>{r.s}</span>
          <span style={{ color: r.c }}>{r.t}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * The agent answering INLINE in the terminal — Zarya's Warp-style core: the
 * request echoes as a command, then an "ОТВЕТ АГЕНТА" divider, the streaming
 * reply, and an inline ПАТЧ card. Not a side panel — this IS the terminal.
 */
export const AgentReply: React.FC<{ query: string; reveal?: number; showPatch?: boolean }> = ({
  query,
  reveal = 1,
  showPatch = false,
}) => {
  const text =
    "Нашёл: api-ключ читается как let и нигде не переприсваивается — выношу в const и предлагаю патч. Могу сразу прогнать линт.";
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: FONT.mono, fontSize: 14, padding: "4px 0 4px 0" }}>
        <ShellBadge label="✦" color={Z.accent} size={15} />
        <span style={{ color: Z.fgFaint }}>~\zarya</span>
        <span style={{ color: Z.accent2 }}>❯</span>
        <span style={{ color: Z.fg }}>{query}</span>
      </div>
      <AgentDivider />
      <div style={{ fontFamily: FONT.ui, fontSize: 14, lineHeight: 1.55, color: Z.fg, maxWidth: 720, paddingLeft: 4 }}>
        {clip(text, reveal * text.length)}
        {reveal * text.length < text.length && <span style={{ borderLeft: `2px solid ${Z.accent2}`, marginLeft: 1 }}>&nbsp;</span>}
      </div>
      {showPatch && <div style={{ paddingLeft: 4 }}><PatchCard /></div>}
    </div>
  );
};
