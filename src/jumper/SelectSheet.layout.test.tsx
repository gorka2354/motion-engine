import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

// stub Remotion so the sheet mounts standalone (icons irrelevant to box layout)
vi.mock("remotion", () => ({
  staticFile: (s: string) => "/" + s,
  Img: (props: Record<string, unknown>) => React.createElement("img", { ...props, alt: "" }),
}));

const { SelectSheet } = await import("./SelectSheet");

async function mount(el: React.ReactElement) {
  const container = document.createElement("div");
  container.style.width = "500px";
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(el);
  });
  await new Promise((r) => setTimeout(r, 40));
  return { container, root };
}

function overflowsX(child: Element, parent: Element, tol = 1) {
  const c = child.getBoundingClientRect();
  const p = parent.getBoundingClientRect();
  return c.right > p.right + tol || c.left < p.left - tol;
}

describe("SelectSheet layout (real Chromium — no content spills the sheet)", () => {
  let root: Root | null = null;
  afterEach(() => {
    root?.unmount();
    document.body.replaceChildren();
  });

  it("network boxes and token rows stay inside the sheet", async () => {
    const m = await mount(React.createElement(SelectSheet, { highlightNet: 0, highlightTok: "ETH" }));
    root = m.root;
    const sheet = m.container.firstElementChild!;
    // no descendant div spills past the sheet's horizontal edges (footgun #11 guard)
    [...sheet.querySelectorAll("div")].forEach((el) =>
      expect(overflowsX(el, sheet), `element overflows the sheet`).toBe(false),
    );
  });
});
