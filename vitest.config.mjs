import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

// Two test projects:
//  • node    — pure logic (geometry, anim, determinism, pixel metrics, scene-graph).
//  • browser — LAYOUT invariants in a real Chromium: jsdom doesn't compute layout, so
//    "element overflows its container" (e.g. the To sub-card spilling past the widget
//    card) is invisible to a node test. Browser mode measures getBoundingClientRect.
// .mjs (not .ts): package.json has no "type":"module", a .ts config loads as CJS and
// chokes on vitest's ESM-only deps.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.layout.test.tsx"],
        },
      },
      {
        optimizeDeps: {
          include: ["react", "react-dom", "react-dom/client", "react/jsx-dev-runtime"],
        },
        test: {
          name: "browser",
          include: ["src/**/*.layout.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            api: { host: "127.0.0.1" },
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
