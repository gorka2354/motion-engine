import { defineConfig } from "vitest/config";

// .mjs (not .ts): package.json has no "type":"module", so a .ts config loads as
// CommonJS and chokes on vitest's ESM-only deps (ERR_REQUIRE_ESM). .mjs is ESM.
//
// Unit tests only — pure logic (geometry, anim math, determinism guard). No DOM,
// no canvas: Remotion components render pixels, which unit tests can't see — those
// are covered by scripts/check-render.mjs (the render self-check) instead.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
