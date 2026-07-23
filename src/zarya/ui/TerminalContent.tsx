import React from "react";
import { Z, FONT, ANSI } from "../zarya.style";
import { Block, type BlockData } from "./Block";

/** The demo session — a real Zarya dev session. These blocks are the "work" the
 *  viewer recognizes when they replay on restore (the sessions hero). */
export const DEMO_BLOCKS: BlockData[] = [
  {
    cmd: "git status",
    cwd: "~\\zarya",
    exit: 0,
    duration: "38мс",
    output: [
      [{ t: "On branch ", c: ANSI.dim }, { t: "main", c: ANSI.cyan }],
      [{ t: "Your branch is up to date with ", c: ANSI.dim }, { t: "'origin/main'", c: ANSI.green }, { t: ".", c: ANSI.dim }],
      [{ t: "nothing to commit, working tree clean", c: ANSI.green }],
    ],
  },
  {
    cmd: "git log --oneline -5",
    cwd: "~\\zarya",
    exit: 0,
    duration: "44мс",
    output: [
      [{ t: "a1f4e2c ", c: ANSI.yellow }, { t: "feat: пусковой комплекс + ракета", c: ANSI.fg }],
      [{ t: "7b93d10 ", c: ANSI.yellow }, { t: "feat: блоки на OSC 133", c: ANSI.fg }],
      [{ t: "3c02af8 ", c: ANSI.yellow }, { t: "feat: сохранение сессий", c: ANSI.fg }],
      [{ t: "e5d1b77 ", c: ANSI.yellow }, { t: "feat: экипаж — BYOK агент", c: ANSI.fg }],
      [{ t: "9a0c4f1 ", c: ANSI.yellow }, { t: "init: заря", c: ANSI.fg }],
    ],
  },
  {
    cmd: "npm run lint",
    cwd: "~\\zarya",
    exit: 1,
    duration: "2.4с",
    output: [
      [
        { t: "src/main/aiProxy.ts", c: ANSI.cyan },
        { t: "  42:7  ", c: ANSI.dim },
        { t: "error", c: ANSI.red },
        { t: "  'key' is never reassigned — prefer const", c: ANSI.fg },
      ],
      [{ t: "✗ 1 problem (1 error, 0 warnings)", c: ANSI.red }],
    ],
  },
];

/** The re-run of the lint block after the one-line fix — the fail→pass demo. */
export const LINT_FIXED: BlockData = {
  cmd: "npm run lint",
  cwd: "~\\zarya",
  exit: 0,
  duration: "1.8с",
  output: [[{ t: "✓ 0 problems — чисто", c: ANSI.green }]],
};

const BootHeader: React.FC = () => (
  <div style={{ fontFamily: FONT.mono, fontSize: 13.5, lineHeight: 1.55, color: Z.termFg, marginBottom: 12 }}>
    <div>Windows PowerShell — Заря · Орбита-1</div>
    <div style={{ color: Z.fgFaint }}>Copyright (C) Microsoft Corporation. All rights reserved.</div>
  </div>
);

/** A live prompt line with an optional typed command + blinking caret. */
export const PromptLine: React.FC<{ typed?: string; caret?: boolean; cwd?: string }> = ({
  typed = "",
  caret = true,
  cwd = "~\\zarya",
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT.mono, fontSize: 14, padding: "2px 0 2px 14px" }}>
    <span style={{ color: Z.termCyan }}>PS</span>
    <span style={{ color: Z.fgFaint }}>{cwd}</span>
    <span style={{ color: Z.accent2 }}>❯</span>
    <span style={{ color: Z.fg }}>{typed}</span>
    {caret && <span style={{ width: 9, height: 17, background: Z.accent2, opacity: 0.9, display: "inline-block" }} />}
  </div>
);

/**
 * The terminal area content: an optional PowerShell boot header, a stack of
 * committed command blocks, and a live prompt line. Everything is driven by the
 * parent timeline (which blocks are present, what's being typed, which block is
 * focused / marked as a re-run).
 */
export const TerminalContent: React.FC<{
  blocks: BlockData[];
  showBoot?: boolean;
  focusedIndex?: number;
  rerunIndex?: number;
  prompt?: { typed?: string; caret?: boolean; cwd?: string } | null;
  dimBlocks?: number;
  pinBottom?: boolean; // anchor content to the bottom, like a real terminal
  afterBlocks?: React.ReactNode; // inline agent reply etc.
}> = ({ blocks, showBoot = true, focusedIndex, rerunIndex, prompt = { caret: true }, dimBlocks = 1, pinBottom = false, afterBlocks }) => (
  <div
    style={{
      padding: "16px 18px",
      height: "100%",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: pinBottom ? "flex-end" : "flex-start",
    }}
  >
    {showBoot && <BootHeader />}
    {blocks.map((b, i) => (
      <Block key={i} data={b} focused={i === focusedIndex} rerun={i === rerunIndex} dim={dimBlocks} />
    ))}
    {afterBlocks}
    {prompt && <PromptLine typed={prompt.typed} caret={prompt.caret} cwd={prompt.cwd} />}
  </div>
);
