import React from "react";
import { Z, FONT } from "../zarya.style";
import { Icon, Diamond } from "./icons";

/** A single syntax-highlighted run of text inside a code line. */
interface Token {
  text: string;
  color?: string;
}

/** One row of the fake file tree. */
interface TreeRow {
  label: string;
  depth: number;
  status?: "M" | "A";
  active?: boolean;
  folder?: boolean;
}

const TREE: TreeRow[] = [
  { label: "src/", depth: 0, folder: true },
  { label: "theme/tokens.ts", depth: 1, status: "M" },
  { label: "zarya/ZaryaPromo.tsx", depth: 1, status: "M", active: true },
  { label: "zarya/space/Rocket.tsx", depth: 1, status: "A" },
  { label: "zarya/ui/LaunchPad.tsx", depth: 1 },
  { label: "lib/Grain.tsx", depth: 1 },
];

/** ~16 lines of a plausible Remotion component — the "open file". */
const LINES: Token[][] = [
  [{ text: "import ", color: Z.termBlue }, { text: "React" }, { text: " from ", color: Z.termBlue }, { text: '"react"', color: Z.termGreen }, { text: ";", color: Z.fgDim }],
  [
    { text: "import ", color: Z.termBlue },
    { text: "{ ", color: Z.fgDim },
    { text: "AbsoluteFill", color: Z.termYellow },
    { text: ", ", color: Z.fgDim },
    { text: "interpolate" },
    { text: ", ", color: Z.fgDim },
    { text: "useCurrentFrame" },
    { text: " }", color: Z.fgDim },
    { text: " from ", color: Z.termBlue },
    { text: '"remotion"', color: Z.termGreen },
    { text: ";", color: Z.fgDim },
  ],
  [
    { text: "import ", color: Z.termBlue },
    { text: "{ ", color: Z.fgDim },
    { text: "Z" },
    { text: ", ", color: Z.fgDim },
    { text: "FONT" },
    { text: " }", color: Z.fgDim },
    { text: " from ", color: Z.termBlue },
    { text: '"./zarya.style"', color: Z.termGreen },
    { text: ";", color: Z.fgDim },
  ],
  [
    { text: "export ", color: Z.termBlue },
    { text: "const ", color: Z.termBlue },
    { text: "RocketGlow" },
    { text: ": ", color: Z.fgDim },
    { text: "React.FC", color: Z.termYellow },
    { text: "<{ size?: number }> = ({ size = 20 }) => {", color: Z.fgDim },
  ],
  [{ text: "  const ", color: Z.termBlue }, { text: "frame" }, { text: " = ", color: Z.fgDim }, { text: "useCurrentFrame" }, { text: "();", color: Z.fgDim }],
  [{ text: "  // deterministic glow — engine forbids Math.random", color: Z.fgFaint }],
  // NOTE: keep "Math.random" and "()" as SEPARATE tokens below — the determinism
  // guard greps /Math\.random\s*\(/ over the source; collapsing them fails the build.
  [
    { text: "  const ", color: Z.termBlue },
    { text: "flicker" },
    { text: " = ", color: Z.fgDim },
    { text: "Math.random" },
    { text: "() * ", color: Z.fgDim },
    { text: "0.4" },
    { text: ";", color: Z.fgDim },
  ],
  [
    { text: "  const ", color: Z.termBlue },
    { text: "glow" },
    { text: " = ", color: Z.fgDim },
    { text: "interpolate" },
    { text: "(", color: Z.fgDim },
    { text: "frame" },
    { text: ", [0, 30], [0.2, 1], {", color: Z.fgDim },
  ],
  [{ text: "    extrapolateRight", color: Z.fgDim }, { text: ": ", color: Z.fgDim }, { text: '"clamp"', color: Z.termGreen }, { text: ",", color: Z.fgDim }],
  [{ text: "  });", color: Z.fgDim }],
  [{ text: "  return ", color: Z.termBlue }, { text: "(", color: Z.fgDim }],
  [
    { text: "    <", color: Z.fgDim },
    { text: "AbsoluteFill", color: Z.termYellow },
    { text: " style={{ opacity: ", color: Z.fgDim },
    { text: "glow" },
    { text: " }}>", color: Z.fgDim },
  ],
  [
    { text: "      <", color: Z.fgDim },
    { text: "circle", color: Z.termYellow },
    { text: " r={", color: Z.fgDim },
    { text: "size" },
    { text: "} fill={", color: Z.fgDim },
    { text: "Z.accent" },
    { text: "} />", color: Z.fgDim },
  ],
  [{ text: "    </", color: Z.fgDim }, { text: "AbsoluteFill", color: Z.termYellow }, { text: ">", color: Z.fgDim }],
  [{ text: "  );", color: Z.fgDim }],
  [{ text: "};", color: Z.fgDim }],
];

const REMOVED_LINE = 7;
const ADDED_LINES = [8, 9];
const GUTTER_W = 46;
const ROW_H = 20;

const diffOf = (n: number): "add" | "del" | undefined => (n === REMOVED_LINE ? "del" : ADDED_LINES.includes(n) ? "add" : undefined);

const rowTint = (n: number, active: number): string => {
  if (n === active) return Z.bgElev1;
  const d = diffOf(n);
  if (d === "add") return "rgba(95,184,138,0.10)";
  if (d === "del") return "rgba(240,69,58,0.10)";
  return "transparent";
};

const FileRow: React.FC<{ row: TreeRow }> = ({ row }) => {
  const markerColor = row.status === "M" ? Z.accent2 : row.status === "A" ? Z.success : undefined;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 26,
        minWidth: 0,
        gap: 6,
        paddingLeft: 12 + row.depth * 16,
        paddingRight: 10,
        background: row.active ? Z.bgElev1 : "transparent",
        borderLeft: `2px solid ${row.active ? Z.accent : "transparent"}`,
      }}
    >
      {row.folder ? (
        <>
          <span style={{ width: 9, flexShrink: 0, fontSize: 9, color: Z.fgFaint }}>▾</span>
          <Icon name="folder" size={13} color={Z.accent2} />
        </>
      ) : (
        <span style={{ width: 9, flexShrink: 0 }} />
      )}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: FONT.mono,
          fontSize: 13,
          color: row.active ? Z.fg : Z.fgDim,
        }}
      >
        {row.label}
      </span>
      {markerColor && (
        <span style={{ flexShrink: 0, fontFamily: FONT.mono, fontSize: 11, fontWeight: 700, color: markerColor }}>{row.status}</span>
      )}
    </div>
  );
};

const FileTree: React.FC = () => (
  <div style={{ width: 230, flexShrink: 0, minWidth: 0, background: Z.panel, borderRight: `1px solid ${Z.border}`, padding: "10px 0", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", marginBottom: 8 }}>
      <Diamond size={7} />
      <span style={{ fontFamily: FONT.tech, fontSize: 12, letterSpacing: "0.14em", color: Z.accent2 }}>IDE-АГЕНТ</span>
    </div>
    {TREE.map((row, i) => (
      <FileRow key={i} row={row} />
    ))}
  </div>
);

const TabStrip: React.FC = () => (
  <div style={{ height: 34, flexShrink: 0, minWidth: 0, display: "flex", alignItems: "center", borderBottom: `1px solid ${Z.border}`, background: Z.bg }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: "100%", minWidth: 0, padding: "0 14px", borderTop: `2px solid ${Z.accent}`, background: Z.bg }}>
      <Icon name="code" size={13} color={Z.termYellow} />
      <span style={{ fontFamily: FONT.ui, fontSize: 13, color: Z.fg, whiteSpace: "nowrap" }}>ZaryaPromo.tsx</span>
      <span style={{ color: Z.fgDim, fontSize: 13, lineHeight: 1 }}>●</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, padding: "0 14px" }}>
      <Icon name="split" size={14} color={Z.fgFaint} />
      <Icon name="search" size={14} color={Z.fgFaint} />
    </div>
  </div>
);

const Gutter: React.FC<{ active: number }> = ({ active }) => (
  <div style={{ width: GUTTER_W, flexShrink: 0, display: "flex", flexDirection: "column", paddingTop: 10 }}>
    {LINES.map((_, i) => {
      const n = i + 1;
      const d = diffOf(n);
      return (
        <div key={n} style={{ display: "flex", alignItems: "stretch", height: ROW_H, background: rowTint(n, active) }}>
          <span style={{ width: 3, flexShrink: 0, background: d === "add" ? Z.success : d === "del" ? Z.danger : "transparent" }} />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: "right",
              paddingRight: 10,
              fontFamily: FONT.mono,
              fontSize: 13,
              lineHeight: `${ROW_H}px`,
              color: Z.fgFaint,
              userSelect: "none",
            }}
          >
            {n}
          </span>
        </div>
      );
    })}
  </div>
);

const CodeLines: React.FC<{ active: number }> = ({ active }) => (
  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", paddingTop: 10, paddingLeft: 12, overflow: "hidden" }}>
    {LINES.map((tokens, i) => {
      const n = i + 1;
      const isActive = n === active;
      return (
        <div
          key={n}
          style={{
            display: "flex",
            alignItems: "center",
            height: ROW_H,
            minWidth: 0,
            whiteSpace: "pre",
            fontFamily: FONT.mono,
            fontSize: 13,
            background: rowTint(n, active),
          }}
        >
          {tokens.length === 0 && " "}
          {tokens.map((t, ti) => (
            <span key={ti} style={{ color: t.color ?? Z.fg }}>
              {t.text}
            </span>
          ))}
          {isActive && <span style={{ display: "inline-block", width: 2, height: 14, marginLeft: 2, flexShrink: 0, background: Z.accent2 }} />}
        </div>
      );
    })}
  </div>
);

export interface EditorMockProps {
  /** 1-based line number to highlight as the caret/active row. */
  activeLine?: number;
}

/**
 * Pixel-faithful re-creation of zarya-terminal's "IDE-АГЕНТ" panel — a
 * Monaco-style editor: file tree with git-status markers on the left, a
 * tabbed code view with a git-diff gutter (added/removed/active rows) on the
 * right. Purely presentational and deterministic — fills its container.
 */
export const EditorMock: React.FC<EditorMockProps> = ({ activeLine = 8 }) => (
  <div style={{ display: "flex", width: "100%", height: "100%", minWidth: 0, background: Z.bg, fontFamily: FONT.mono, color: Z.fg, overflow: "hidden" }}>
    <FileTree />
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: Z.bg }}>
      <TabStrip />
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <Gutter active={activeLine} />
        <CodeLines active={activeLine} />
      </div>
    </div>
  </div>
);
