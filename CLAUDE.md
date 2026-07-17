# CLAUDE.md — working in this repo

Guidance for AI agents (and humans) editing **motion-engine**. Start with the
[README](README.md) for what the project is and how it's laid out; this file is the short
list of rules that keep renders correct.

## What it is
A Remotion "video as code" engine: product/promo videos written in React, rendered locally to
mp4. `src/{lib,theme,device,v2}` is the reusable **engine**; `src/{lumo,jumper,shotik,bybit,
creative}` are **example builds** on top of it (`src/lumo` is the reference example).

## Commands
- `npm run dev` — Remotion Studio (live preview + prop editor).
- `npm run lint` — `eslint src && tsc` (strict).
- `npm test` — vitest, node project: geometry/orbit invariants, anim math, a determinism guard, scene-graph smoke.
- `npm run test:layout` — vitest browser mode (real Chromium): catches a child overflowing its container.
- `npm run check-render <Comp> [--loop] [--seq]` — pixel self-check (content/motion/loop/seq): "stills pass, video is broken".
- `npm run check-assets` — glTF validation + metadata regression on `public/models/*.glb`.
- `npm run check-audio <Comp|file.mp4>` — integrated-LUFS + true-peak gate for voiced comps.
- `npm run gen-sfx` — regenerate the synthesized SFX set into `public/audio/`.
- `npm run stills <Comp> <f1,f2,…> [outDir]` — batch stills (bundle once). The main feedback loop: render frames → look → fix.
- Render: `npx remotion render <Comp> out/x.mp4`. **Run render/still from the project root**, or `public/` assets 404.

## Hard rules (these break renders if ignored)
1. **No `Math.random()` / `Date.now()`** — non-determinism breaks the render and the Δ=0 invariant. Parametrize by `frame`/`index`; use seeded `noise2D` for organic motion. (A determinism guard greps `src` in `npm test`.)
2. **All visual constants live in `src/theme/tokens.ts`** — the single source of truth. Don't hardcode colors/sizes in components.
3. **zod is pinned to exactly `4.3.6`** (Remotion 4.0.484 requirement) — don't bump it.
4. **Validate refactors Δ=0** — stills at fixed frames before/after must be MD5-identical when the change shouldn't alter pixels.
5. **Author promos as data** — edit the scene map (`src/lumo/lumo.map.ts`) or pass `--props=file.json`; don't hand-write JSX for storyline changes.

## Testing approach
The full L0–L6 pyramid — what each layer catches, the footgun→layer map, CI tiering — is in
[`docs/TESTING.md`](docs/TESTING.md). The headless-render footguns learned the hard way are in
the README's collapsible "Gotchas" section; add to it when you hit a new one.
