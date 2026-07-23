import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

// Stub the four @remotion/google-fonts faces so the window mounts standalone in
// the browser without a network font fetch (we measure box layout, not glyphs).
// Factories are inlined because vi.mock is hoisted above any local declarations.
vi.mock("@remotion/google-fonts/PixelifySans", () => ({ loadFont: () => ({ fontFamily: "sans-serif" }) }));
vi.mock("@remotion/google-fonts/Handjet", () => ({ loadFont: () => ({ fontFamily: "sans-serif" }) }));
vi.mock("@remotion/google-fonts/PTSans", () => ({ loadFont: () => ({ fontFamily: "sans-serif" }) }));
vi.mock("@remotion/google-fonts/JetBrainsMono", () => ({ loadFont: () => ({ fontFamily: "sans-serif" }) }));

const { ZaryaWindow } = await import("./ZaryaWindow");
const { TerminalContent, DEMO_BLOCKS, LINT_FIXED } = await import("./TerminalContent");

async function mount(el: React.ReactElement) {
  const container = document.createElement("div");
  container.style.width = "1700px"; // room to spare — the window is 1500px fixed
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(el);
  });
  await new Promise((r) => setTimeout(r, 40));
  return { container, root };
}

/** Does any descendant spill horizontally past `root`'s content box? */
function spills(root: Element, tol = 1.5): Element | null {
  const r = root.getBoundingClientRect();
  for (const el of root.querySelectorAll("*")) {
    const b = el.getBoundingClientRect();
    if (b.width > 0 && (b.right > r.right + tol || b.left < r.left - tol)) return el;
  }
  return null;
}

describe("ZaryaWindow layout (real Chromium — catches panel overflow)", () => {
  let root: Root | null = null;
  afterEach(() => {
    root?.unmount();
    document.body.replaceChildren();
  });

  it("no panel or chip spills past the window in a demanding state", async () => {
    const m = await mount(
      React.createElement(ZaryaWindow, {
        tab: "Терминал",
        cwd: "C:\\Users\\pesto\\very\\deep\\path",
        statusModel: "claude-opus-4-8",
        agent: { mode: "CLAUDE CODE", bolt: true, model: "OPUS 4.8", effort: 4 },
        main: React.createElement(TerminalContent, {
          blocks: [...DEMO_BLOCKS, LINT_FIXED],
          rerunIndex: 3,
          prompt: { typed: "npm run build", caret: true },
        }),
      }),
    );
    root = m.root;
    const win = m.container.firstElementChild!;
    const bad = spills(win);
    expect(bad, bad ? `element overflows: <${bad.tagName}> "${bad.textContent?.slice(0, 40)}"` : "").toBeNull();
  });

  it("the window keeps its fixed footprint (no child forces it wider)", async () => {
    const m = await mount(
      React.createElement(ZaryaWindow, {
        main: React.createElement(TerminalContent, { blocks: DEMO_BLOCKS, prompt: null }),
      }),
    );
    root = m.root;
    const win = m.container.firstElementChild as HTMLElement;
    expect(win.offsetWidth).toBe(1500);
    expect(win.scrollWidth).toBeLessThanOrEqual(win.clientWidth + 2);
  });
});
