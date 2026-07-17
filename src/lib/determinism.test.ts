import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Footgun #1: any non-determinism (Math.random, wall-clock time) makes the render
// non-reproducible — a different frame every run, and Δ=0 refactor checks become
// meaningless. This test greps the whole src tree so the rule is enforced, not just
// remembered. Everything must be parametrized by `frame`/`index` (seeded noise2D for
// organic motion).
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe("determinism guard (footgun #1)", () => {
  const files = walk("src").filter(
    (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f),
  );
  const banned: [RegExp, string][] = [
    [/Math\.random\s*\(/, "Math.random()"],
    [/Date\.now\s*\(/, "Date.now()"],
    [/new Date\s*\(\s*\)/, "new Date() (argless)"],
    [/performance\.now\s*\(/, "performance.now()"],
  ];

  it("no wall-clock / random calls in src", () => {
    const hits: string[] = [];
    for (const f of files) {
      const raw = readFileSync(f, "utf8");
      // blank out block comments (keeping newlines so line numbers stay accurate) —
      // several files legitimately *document* these banned APIs in docstrings
      // (e.g. ClockFix explains the performance.now() fix); only real code counts.
      const noBlock = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
      noBlock.split("\n").forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, ""); // ignore line comments too
        for (const [re, label] of banned) {
          if (re.test(code)) hits.push(`${f}:${i + 1}  [${label}]  ${line.trim()}`);
        }
      });
    }
    // the message prints every offending line so a failure is self-explanatory
    expect(hits, "\n" + hits.join("\n") + "\n").toEqual([]);
  });
});
