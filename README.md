# motion-engine

Reusable **motion video engine** built with [Remotion](https://www.remotion.dev/) — "video as code" (write the video in React, render to mp4). Product/promo videos for **tixu.ai** and client work, from one parametrized base. Self-contained: **no external API keys**, renders 100% locally.

Parametrized engine: **design tokens** (light + dark stage) + **premium primitives** (`src/lib`) + reusable `PhoneFrame` + per-screen components + a **data-driven scene map** → per-client looks, RU/EN, 1:1/16:9 variants come cheap from one base.

## Stack
- Remotion 4.0.484 + React 19 · `@remotion/google-fonts` (Manrope), `@remotion/transitions`, `@remotion/media`, `@remotion/motion-blur`, `@remotion/noise`, `@remotion/paths` · zod **4.3.6 exact** (Remotion requirement)
- Master format: **9:16 · 1080×1920 · 30fps**, language English
- Aesthetic (since inc-3): floating phone on a **dark brand stage** (rich navy, single blue accent, light product screens inside the device), Apple-keynote clean, continuous camera rig with real motion blur + film grain (no full-frame wipes)

## Quick start
```bash
npm install
npm run dev          # Remotion Studio — live preview, edit V2 props in the UI
npm run lint         # eslint + tsc
```

Render (run from the project dir so `public/` assets resolve):
```bash
npx remotion render TixuPromoV2 out/promo.mp4              # main 44s promo
npx remotion still  TixuPromoV2 out/frame.png --frame=90   # single frame (~2s) — the main feedback loop
npx remotion render TixuPromoV2 out/client.mp4 --props=client.json   # re-author WITHOUT code (see below)
```

## Compositions (`src/Root.tsx`)
| id | what | duration |
|----|------|----------|
| `TixuPromoV2` | **main** promo (V2, dark stage, data-driven) | 44s / 1320f |
| `TixuCourseTeaser` | course teaser «zero → certified» (path scroll + trail draw-on + MagicMove cert) | 15s / 450f |
| `ShotikPromo` | **16:9 · 1920×1080** — Shotik brand preset, LaptopFrame, MagicMove chain as the transition language | 24s / 720f |
| `TixuPromo`   | V1 30s master (light theme, kept for comparison) | 886f |
| `Scene*` ×6   | individual V1 scenes | per-scene |
| `LibSandbox`  | test bench: Grain / Glow / MotionBlur / springs / stagger / Parallax | 150f |
| `FxSandbox`   | test bench: MagicMove / morphPath / drawPath01 | 150f |

## Authoring the V2 promo (no JSX needed)
The storyline is **data**: `src/v2/promo.map.ts` (`PROMO_DEFAULTS`) validated by `src/v2/promoSchema.ts` (zod). It defines:
- `beats` — big typography beats (`title/sub/accentWord/from/to/y/size`), `size` ∈ `hero|beat|beatWide|beatZoom`
- `zoomBeat` — the beat over the zoomed-in display (drives the top scrim)
- `nav` — in-device navigation `{at, kind: push|tab|flip, screen: home|profile|library|path|quiz|tools}`
- `floats` — certificate / provider-chip windows
- `brand` — logo file, CTA label, end-title lines

Edit the map, tweak props in Studio, or pass a JSON override: `--props=file.json` (top-level keys are replaced wholesale). Camera art (zoom/pull-back keyframes, blur windows) intentionally lives in code (`TixuPromoV2.tsx`).

## Toolbox (`src/lib`, import from `src/lib/index.ts`)
- `<MotionBlur shutterAngle samples>` — camera-style blur; children must read `useCurrentFrame()` themselves; wrap only moving content during motion windows (cost ×samples)
- `<Grain opacity frequency blend>` — living film grain; `overlay` for dark bases, `multiply` for light ones
- `<Glow color radius strength>` — silhouette glow (drop-shadow based)
- `<Parallax seed depth amplitude speed>` — organic simplex-noise drift for depth layers
- `<MagicMove from to a b renderA renderB spin>` — Keynote-style morph: A flies/spins/cross-fades into B (center-based rects)
- `morphPath(a, b, t)` (paths must share command structure) · `drawPath01(path, t)` (draw-on stroke reveal)
- anim helpers: `SPRING` presets (smooth/pop/bounce), `springWindow`, `window01`, `kf`, `stagger01`, `EASE*`
- tokens: `theme` from `src/theme` — includes the `dark` stage group; **all visual constants live in `src/theme/tokens.ts`**

## Layout
- `src/` — `Root.tsx` (registry) · `theme/` (tokens) · `lib/` (primitives + sandboxes) · `v2/` (camera rig, ScreenFlow, TypoBeat, floats, **promo.map.ts / promoSchema.ts**) · `screens/` (product UI) · `scenes/`+`components/` (V1)
- `public/` — real app assets (logo, provider SVGs, illustrations), referenced via `staticFile()`
- `docs/INCREMENTS.md` — **increment tracker** (goal/what/validation/status per step) · `docs/knowledge/` — project context bundle

## Gotchas (hard-won)
- Run `remotion render|still` **from the project dir**, else `public/` assets 404.
- **No `Math.random()`** — breaks render determinism; parametrize by `frame`/`index`, use seeded `noise2D` for organic motion.
- Headless-Chromium rendering quirks (discovered empirically, encoded in `Grain.tsx`):
  1. `mix-blend-mode` only works on **fully opaque** content — any element/pixel alpha < 1 silently disables blending (encode strength as color contrast around the blend's identity value instead);
  2. `overlay` blend is ≈ invisible on near-white backgrounds — use `multiply` on light bases;
  3. integer `feTurbulence` `baseFrequency` (e.g. 1.0) samples the noise lattice at its zero nodes → flat output; use 0.8 etc.
- zod must be **exactly 4.3.6** with Remotion 4.0.484 (version-mismatch warning otherwise).
- The ink-colored `logo.svg` disappears on the dark stage — invert with `filter: brightness(0) invert(1)`.
- Fonts load `latin` subset only — **add `cyrillic` in `fonts.ts` before making RU variants**.
- Refactors are validated **Δ=0**: stills at frames 90/300/540/950/1210 before/after must be MD5-identical (see `docs/INCREMENTS.md`).

## Backlog
Sound (music + UI SFX layer — next up) · brand-kit injection (per-client theme JSON) · 15s/6s cutdowns · Remotion Lambda · Lottie / 3D phone · `@remotion/captions` subtitles.
