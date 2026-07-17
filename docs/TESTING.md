# Test pyramid — testing motion built as code

> How this engine catches bugs automatically when the video *is* code. A synthesis of
> industry practice (Remotion / Three.js / visual regression / golden-master / 3D QA)
> plus the render footguns hard-won on this project (catalogued in `CLAUDE.md`).

## Philosophy: a unit test can't see a visual bug

A classic unit test checks a pure function (input → output in memory). The bugs that
actually cost time here — "corners poke past the phone", "tile flies outside the frame",
aliasing, "seam flicker" — live **in the rendered pixels**: a component in jsdom renders
neither canvas nor 3D. So the pyramid is split **by class of bug**, not by layer of code:

```
        ┌─────────────────────────────────────────────┐
  L6    │  Eyes / AI agent — final aesthetics          │  not automatable
        ├─────────────────────────────────────────────┤
  L5    │  3D assets: glTF-validate, mesh QA, bounds   │  on asset regen
        ├─────────────────────────────────────────────┤
  L4    │  Golden-master: baseline frames vs new render│  per-PR / nightly
        ├─────────────────────────────────────────────┤
  L3    │  Render self-check: content/motion/loop/seq  │  per-PR (stills), nightly (--seq)
        ├─────────────────────────────────────────────┤
  L2    │  Scene-graph 3D (react-three/test-renderer)  │  per-PR, no GPU
        ├─────────────────────────────────────────────┤
  L1    │  Pure-logic units: geometry, anim, schemas   │  every save, ms
        ├─────────────────────────────────────────────┤
  L0    │  Static gates: determinism guard, lint       │  every save, ms
        └─────────────────────────────────────────────┘
   cheaper/faster/earlier ← → costlier/slower/later (closer to the pixels)
```

**Division of labour:** "satellite off-frame / through the object" is caught by a
**geometry unit test BEFORE rendering** (fractions of a ms); "object vanished / froze /
seam / look drifted" is caught by the **pixels of the finished render**. If a cheap layer
can catch the bug, it never reaches an expensive one.

---

## L0 — Static gates (`npm run lint`, every save)

| Check | Catches | Status |
|---|---|---|
| `determinism.test.ts` — greps `Math.random` / `Date.now` / `performance.now` in `src` | non-determinism (breaks render + the Δ=0 invariant) | ✅ |
| `eslint src && tsc` | types, style | ✅ |
| `delayRender` hygiene — every handle labelled; `loadFont()` over raw `@font-face` | hung render (30 s timeout); a silently baked fallback font | 🔲 lint rule |
| flag raw `<Video>` / HTML5 → require `<OffthreadVideo>` | non-frame-exact video seeking | 🔲 review check |

Remotion note: `random(seed)` from `remotion` is a deterministic PRNG — not `Math.random`,
which returns a different value per render thread.

## L1 — Pure-logic units (`npm test` → vitest, ~250 ms, every save)

| File | Catches | Status |
|---|---|---|
| `lib/geometry.ts` + `.test` — `visibleHalfWidth`=tan(fov/2)·dist, `orbitFitsFrame`, `orbitClearsObject` | orbit off-frame / through the object — by arithmetic, before rendering | ✅ |
| `v2/anim.test.ts` — edge cases of `clamp01/kf/window01/springWindow/stagger` | animation-math regressions (endpoints, monotonicity, clamp) | ✅ |
| `lib/pixelMetrics.test.ts` — detector metrics on synthetic input | proves the L3 detectors actually **fire** | ✅ |
| `Box3` / `Frustum` / `Raycaster` invariants | collisions / clearances for off-axis cameras (generalizes the orbit checks) | 🔲 |
| AABB overlap on `lumo.map.ts` (non-intersection of beats / floats) | elements overlapping that shouldn't — before pixels | 🔲 |
| zod contract via `selectComposition({inputProps})` | broken props / schema in ms (runs `calculateMetadata` + zod) | 🔲 |
| property-based (`fast-check`) over `(frame,fps,from,to,config)` anim | invariants across ALL inputs, not fixed cases | 🔲 stretch |

## L1b — Layout in a real browser (`npm run test:layout`, vitest browser mode)

jsdom **does not compute layout** — "a child escaped its container" is invisible to it (and
to the pixel `check-render`, which doesn't know the card's "correct" bound). Vitest browser
mode renders the component in **real Chromium** and measures `getBoundingClientRect`.

```tsx
// src/**/*.layout.test.tsx — project "browser" (@vitest/browser-playwright)
const card = container.firstElementChild;
subCards(card).forEach((sc) => expect(overflowsX(sc, card)).toBe(false)); // children inside the frame
```

| Catches | Status |
|---|---|
| flex child without `minWidth:0` stretches the row → sibling escapes the container (Jumper `SwapWidget`: the "To" field escaped on the empty state) | ✅ `SwapWidget.layout.test.tsx` |
| overflow of clip containers, title-safe bounds on DOM screens | 🔲 expand |

Verified: the test **fails** with the bug (no `minWidth:0`) and passes with the fix — the detector demonstrably fires.

## L2 — Scene-graph 3D without a GPU (`@react-three/test-renderer`, per-PR)

Renders the R3F tree through its own reconciler **without WebGL/canvas/GPU** — asserts on
structure, not pixels.

```ts
const r = await ReactThreeTestRenderer.create(<BybitScene />);
r.toGraph();                               // scene shape — an orphaned <primitive> → undefined
await ReactThreeTestRenderer.act(async () => { await r.advanceFrames(2, 1); });
mesh.instance.rotation.x;                  // live transform at a fixed delta
```

| Catches | Status |
|---|---|
| `<primitive>` reparents a node out of the GLB → node unreachable (checked via scene traverse after mount) | ✅ `sceneGraph.test.tsx` |
| mesh presence + deterministic transform at a fixed `advanceFrames(n, delta)` | ✅ `sceneGraph.test.tsx` |
| the reparent race on a LIVE component — real `Tiles3D` mounts, node left the GLB → `getObjectByName` undefined; + `Card3D`/`Tiles3D` version-compat smoke | ✅ `BybitGif.test.tsx` |
| data→transform integration — mounted `position` == `tileOrbit()`, orbit advances by Remotion frame (mock `useCurrentFrame`; scenes are frame-driven, not `useFrame`) | ✅ `BybitGif.test.tsx` |

⚠️ Caveat: R3F v9 / React 19 (issue #3520) — `Vector3`/`Quaternion` as JSX props throw in
`applyProps`; use tuple props (`position={[x,y,z]}`) in fixtures. Verified working on
`@react-three/test-renderer` 9.1.0 / `fiber@9` / `three@0.171` / React 19 with tuple props.
The real `GLTFLoader`/`useGltf` holds a `delayRender` + DOM, so asset loading is out of L2
scope — it's exercised at L3 `--seq` / L5 `check-assets`.

## L3 — Render self-check (`npm run check-render`, per-PR stills / nightly `--seq`)

`scripts/check-render.mjs <Comp> [--frames N] [--loop] [--trim N] [--seq]` — renders sample
frames → pixel heuristics (`scripts/pixel-metrics.mjs`).

| Check | Catches | Status |
|---|---|---|
| content-check (centre luminance variance) | subject left the frame | ✅ |
| motion-check (diff of adjacent samples) | frozen / vanished | ✅ |
| loop-check (f_first ↔ f_last) | loop seam | ✅ |
| seq-check (`--seq`: `renderMedia` mp4 + ffmpeg vs stills) | sequential R3F state race | ✅ |
| jank detect — dense sample + outlier vs rolling median (>3×) | a hitch outside a cut (a real cut moves ALL frames; jank is a lone outlier) | 🔲 |
| title/action-safe — SMPTE ST 2046-1: 93% / 90% (≈ 38/96 px at 1080×1920) | text/logo outside the safe zone | 🔲 |
| clip-check — clip-container corners at mid-transition == background | corners poking past the rounded device | 🔲 (needs corner coords) |
| ffmpeg `freezedetect` / `blackdetect` on the `--seq` mp4 | independent second opinion (different code from our math) | 🔲 |

⚠️ **Critical for 3D: pin `--gl`** (`swangle` / `swiftshader`) on baseline AND CI.
`swiftshader` (CPU) vs `angle` (GPU/llvmpipe) produce **different pixels** — otherwise a diff
shows renderer noise, not a regression. GitHub Actions has no GPU → `angle` fails, `swangle`
is safe. Implemented: `check-render` defaults to `--gl=swangle`, overridable with `--gl <val>`.

## L4 — Golden-master / visual regression (baseline frames, per-PR/nightly)

**L3's blind spot:** it only compares frames *within* one render → a commit that shifts the
colour/look uniformly across ALL frames passes unnoticed. You need a baseline.

Philosophy (golden-master / ApprovalTests): `received` vs `approved`; any difference = FAIL →
a human decides **reject** (regression) or **re-approve** (intentional — commit a new
baseline). Never silently auto-update.

| Mechanism | What | Status |
|---|---|---|
| **Δ=0 MD5** stills at 90/300/540/950/1210 before/after a refactor | byte-exact regression (where we expect identical: frame-seeded, no wall-clock) | ✅ manual practice → 🔲 formalize as a git-baseline gate |
| golden PNG `test/golden/<Comp>/<frame>.png` + `pixelmatchRatio` (AA-aware, OKLab) | layout / typography / token shift | ✅ |
| **SSIM** (`ssim.js`) — primary golden gate, `GOLDEN_MIN_SSIM=0.98` (grain-tolerant) | a uniform look shift across ALL frames — L3's blind spot | ✅ |
| `--accept-baseline` flag (explicit baseline update, never silent) | baseline discipline | ✅ |
| stability-retry — render frame N twice, require a match | the GL warm-up frame as an auto-gate | 🔲 |
| masks for dynamic regions (seeded-noise `FloatingChips` / `TapDot`) | don't blank the whole frame for one living zone | 🔲 |

A solo local-render workflow makes hosted tools (Percy/Chromatic) not worth it; a
git-committed golden + the reg-suit philosophy fits better. SSIM degrades under heavy grain
(it reacts to the noise itself) — LPIPS is more accurate if a perfect gate is ever needed,
but it pulls in a neural net.

## L5 — 3D-asset validation (Blender → GLB, on asset regen)

Command: **`npm run check-assets`** (`--accept` to write fixtures) — validates every `public/models/*.glb`.

| Mechanism | Catches | Status |
|---|---|---|
| `check-assets.mjs` → `gltf-validator` (Khronos) per GLB, hard-fail on severity-0 | missing UVs under a texture, `ACCESSOR_INVALID_FLOAT` (NaN → black geometry), degenerate triangles | ✅ |
| metadata fixtures `test/asset-fixtures/<name>.json` (`{meshes, materials, nodes, triangles, hasUV, hasNormal, bounds}`, Δ on regen via `@gltf-transform/core`) | a silent change to bounds / topology / UVs — the 3D analogue of golden Δ=0 | ✅ |
| `scripts/blender/_qa.py` before `export_scene.gltf()`: `mesh.validate()` + applied-transform + UV presence + optional `dimensions` | the "size=1" gotcha, "parent shifts children", missing UVs, degenerate meshes | ✅ helper (wired into `bybit-card.py`) |
| front/side ortho stills as a pixelmatch baseline (tolerant, flag-on-diff) | formalizes "ground truth before export" | 🔲 |

Last run: all 4 GLBs (card / tiles / laptop ×2) — **0 errors**, UVs + normals everywhere, fixtures pinned.

⚠️ **Real gap:** `export_apply=True` in `scripts/blender/*.py` applies only **modifiers, not the
object transform** → "parent shifts children" and "size=1" pass silently. The explicit
`transform_apply(scale=True)` + assert in `_qa.py` closes this.

## L5-audio — Audio self-check (`npm run check-audio`, on voiced comps)

Command: **`npm run check-audio <CompId|file.mp4>`** — "the ear the agent doesn't have". The
audio class of bug is invisible to a still and to `check-render`: the track silently dropped,
clipping, too quiet/loud.

| Mechanism | Catches | Status |
|---|---|---|
| `check-audio.mjs` → bundled `ffprobe` (audio-stream present) | `<Audio>` silently degraded to Html5Audio / audio never muxed | ✅ |
| → `ffmpeg loudnorm=print_format=json` (integrated LUFS + true-peak), gate [−20,−12] LUFS · TP ≤ −1 | over-hot / too-quiet mix, inter-sample clipping | ✅ |
| the `npm run gen-sfx` synth set prints peak/RMS dBFS per clip | "clip = silence / clips" before it ever reaches a comp | ✅ |

⚠️ Remotion's bundled ffmpeg is a minimal build: **no `volumedetect`/`astats`**, but
`loudnorm`/`volume` are present. `-f null` needs `-vn`. Subjective quality / sync is L6 (human).

## L6 — Eyes / AI agent

Final aesthetics, rhythm, "aliveness". Not automatable — but an AI agent reviews sample frames
(the still-loop) and catches what a metric can't formalize.

---

## Mapping: footgun → the layer that catches it

| Render footgun (`CLAUDE.md`) | Caught at | Automated |
|---|---|---|
| non-determinism | L0 determinism guard | ✅ |
| object off-frame | **L1** geometry (before render) + L3 content/motion | ✅ |
| R3F reparent race | **L2** scene-graph + L3 seq-check | ✅ |
| orbit through object | **L1** geometry | ✅ |
| warm-up / loop seam | L3 loop-check + **L4** stability-retry | ✅ loop / 🔲 retry |
| corners past the clip | **L3** clip-check | 🔲 backlog |
| size=1 / transforms | **L5** `_qa.py` transform-assert + `check-assets` bounds fixture | ✅ |
| flex overflow past container | **L1b** browser-mode `getBoundingClientRect` (`test:layout`) | ✅ |
| scene overlap at the seam | **architecture** — `TransitionSeries` (scenes can't overlap by construction) + durations-math test | ✅ |
| aliasing | L4 golden-diff + L6 eyes | 🔲/L6 |

## CI tiering (feedback speed)

| When | What runs | Time |
|---|---|---|
| Every save | L0 + L1 (`npm test`, `npm run lint`) | ms |
| Every PR / commit | L2 scene-graph + L3 `check-render` stills for hero comps + L4 golden-diff | seconds |
| On asset regen | L5 gltf-validate + `_qa.py` + metadata Δ | seconds |
| Nightly / pre-release | L3 `--seq` (full mp4 + ffmpeg) + L4 full golden sweep | minutes |

**TurboSnap principle:** run `check-render`/golden only for comps whose scene/screen files
changed in the git diff — 60–90% fewer runs.

## Toolbox

| Layer | Tool | Note |
|---|---|---|
| Pixel diff | `pixelmatch` (OKLab in v6), `odiff` (faster on big frames) | tolerance ~0.01, `includeAA:false` |
| Perceptual | `ssim.js` (pure JS), threshold ~0.97; `looks-same` (ΔE 2.3) | for grain/bloom; LPIPS if a perfect gate is needed |
| Snapshot | `jest-image-snapshot` (SSIM mode) | git-committed baseline |
| Video metrics | ffmpeg `freezedetect` (MAFD), `blackdetect` | second opinion on the mp4 |
| 3D scene-graph | `@react-three/test-renderer` | no GPU |
| 3D assets | `@gltf-transform/cli`, Khronos `gltf-validator`, `trimesh`, `pytest-blender` | validate / inspect / getBounds |
| Property-based | `fast-check` | anim invariants |

## Sources

- Remotion: [testing](https://www.remotion.dev/docs/testing) · [randomness](https://www.remotion.dev/docs/using-randomness) · [--gl](https://www.remotion.dev/docs/gl-options)
- R3F: [test-renderer](https://r3f.docs.pmnd.rs/api/testing) · issue [#3520](https://github.com/pmndrs/react-three-fiber/issues/3520)
- Visual regression: [pixelmatch](https://github.com/mapbox/pixelmatch) · [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot) · [reg-suit](https://github.com/reg-viz/reg-suit)
- Golden-master: [ApprovalTests](https://approvaltests.com/) · [ffmpeg freezedetect](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/vf_freezedetect.c)
- 3D assets: [glTF-Validator](https://github.com/KhronosGroup/glTF-Validator) · [gltf-transform](https://gltf-transform.dev/cli) · [pytest-blender](https://github.com/mondeja/pytest-blender)

---

**Status:** L0–L5 automated — L0 determinism guard · L1 geometry/anim/pixelMetrics · L2
scene-graph (`@react-three/test-renderer`) · L3 content/motion/loop/seq with the `--gl=swangle`
pin · L4 golden-frame baseline (pixelmatch + SSIM gate 0.98, `--accept-baseline`) · L5 3D-asset
QA (`gltf-validator` + metadata fixtures + Blender `_qa.py`). Open items, by priority:
jank-outlier · title-safe (SMPTE) · ffmpeg freezedetect · property-based anim · zod contract · Box3/Frustum.
