import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

// SwapWidget pulls in Remotion's staticFile/Img — stub them so the component mounts
// standalone in the browser (icons aren't needed to measure box layout).
vi.mock("remotion", () => ({
  staticFile: (s: string) => "/" + s,
  Img: (props: Record<string, unknown>) => React.createElement("img", { ...props, alt: "" }),
}));

// import AFTER the mock so it binds to the stubs
const { SwapWidget, ASSETS } = await import("./SwapWidget");

async function mount(el: React.ReactElement) {
  const container = document.createElement("div");
  container.style.width = "500px"; // room to spare — the widget is 360px fixed
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(el);
  });
  await new Promise((r) => setTimeout(r, 40)); // let layout settle
  return { container, root };
}

/** does `child` spill horizontally past `parent`'s box? (the overflow bug) */
function overflowsX(child: Element, parent: Element, tol = 1) {
  const c = child.getBoundingClientRect();
  const p = parent.getBoundingClientRect();
  return c.right > p.right + tol || c.left < p.left - tol;
}

function subCards(card: Element) {
  const labels = [...card.querySelectorAll("div")].filter(
    (d) => d.textContent === "From" || d.textContent === "To",
  );
  return labels.map((l) => l.parentElement!).filter(Boolean);
}

describe("SwapWidget layout (real Chromium — catches container overflow)", () => {
  let root: Root | null = null;
  afterEach(() => {
    root?.unmount();
    document.body.replaceChildren();
  });

  it("From/To sub-cards stay inside the widget card — EMPTY state (the reported bug)", async () => {
    const m = await mount(React.createElement(SwapWidget, {}));
    root = m.root;
    const card = m.container.firstElementChild!;
    const subs = subCards(card);
    expect(subs.length).toBe(2);
    subs.forEach((sc) => expect(overflowsX(sc, card), `${sc.textContent} overflows the card`).toBe(false));
  });

  it("stays inside when filled (ETH → USDC)", async () => {
    const m = await mount(
      React.createElement(SwapWidget, { from: ASSETS.eth, to: ASSETS.usdc, amount: "0.5", usd: "$1,842" }),
    );
    root = m.root;
    const card = m.container.firstElementChild!;
    subCards(card).forEach((sc) => expect(overflowsX(sc, card)).toBe(false));
  });
});
