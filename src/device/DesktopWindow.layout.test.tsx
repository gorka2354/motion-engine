import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { DesktopWindow } from "./DesktopWindow";

async function mount(el: React.ReactElement) {
  const container = document.createElement("div");
  container.style.width = "1200px";
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(el);
  });
  await new Promise((r) => setTimeout(r, 30));
  return { container, root };
}

function spills(root: Element, tol = 1.5): boolean {
  const r = root.getBoundingClientRect();
  for (const el of root.querySelectorAll("*")) {
    const b = el.getBoundingClientRect();
    if (b.width > 0 && (b.right > r.right + tol || b.left < r.left - tol)) return true;
  }
  return false;
}

describe("DesktopWindow device", () => {
  let root: Root | null = null;
  afterEach(() => {
    root?.unmount();
    document.body.replaceChildren();
  });

  it("keeps its fixed footprint and clips its body (no content overflow)", async () => {
    const m = await mount(
      <DesktopWindow width={820} height={520} os="win" title={<span>Мой терминал — очень длинный заголовок окна приложения</span>}>
        <div style={{ width: "100%", height: "100%" }}>body</div>
      </DesktopWindow>,
    );
    root = m.root;
    const win = m.container.firstElementChild as HTMLElement;
    expect(win.offsetWidth).toBe(820);
    expect(win.offsetHeight).toBe(520);
    expect(spills(win)).toBe(false);
  });

  it("renders three Windows controls (min/max/close)", async () => {
    const m = await mount(
      <DesktopWindow width={600} height={400} os="win">
        <div />
      </DesktopWindow>,
    );
    root = m.root;
    expect(m.container.querySelectorAll("svg").length).toBe(3);
  });

  it("renders three macOS traffic-lights", async () => {
    const m = await mount(
      <DesktopWindow width={600} height={400} os="mac">
        <div />
      </DesktopWindow>,
    );
    root = m.root;
    const dots = [...m.container.querySelectorAll("span")].filter((s) => {
      const st = getComputedStyle(s);
      return st.borderRadius !== "0px" && parseFloat(st.width) === 12 && parseFloat(st.height) === 12;
    });
    expect(dots.length).toBe(3);
  });
});
