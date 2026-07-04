# motion-engine

Reusable **motion video engine** built with [Remotion](https://www.remotion.dev/) — "video as code" (write the video in React, render to mp4). Product/promo videos for **tixu.ai** and client work, from one parametrized base. Self-contained: **no external API keys**, renders 100% locally.

Parametrized **video engine** (theme tokens + reusable `PhoneFrame` + per-screen components + scenes) → RU/EN, per-course, 1:1/16:9 variants come cheap from one base. Intended for tixu.ai marketing + commissioned video work.

## Stack
- Remotion 4.0.484 + React 19 + `@remotion/google-fonts` (Manrope), `@remotion/transitions`, `@remotion/media`
- Master format: **9:16 · 1080×1920 · 30fps**, language English
- Aesthetic: floating phone on brand gradient (Apple-keynote clean), persistent phone + continuous camera rig (no full-frame wipes)

## Quick start
```bash
npm install
npm run dev          # Remotion Studio — live preview in browser (tweak props, scrub scenes)
```

Render a full mp4 (run from the project dir so `public/` assets resolve):
```bash
npx remotion render TixuPromoV2 out/tixu-promo.mp4     # main 44s promo
npx remotion still  TixuPromoV2 out/frame.png --frame=90   # single frame (fast sanity check)
```

## Compositions (`src/Root.tsx`)
| id | what | duration |
|----|------|----------|
| `TixuPromoV2` | **main** deepened promo (V2) | 44s / 1320f |
| `TixuPromo`   | V1 30s master (kept for comparison) | 886f |
| `SceneHook` / `SceneProfile` / `ScenePath` / `SceneLessonQuiz` / `SceneAiTools` / `SceneCta` | individual scenes | per-scene |

**Beat map (V2):** Hook → Profile (AI-personalization) → Library (challenge hero + tracks + careers) → Path (zoom in) → Lesson-quiz (two interactions: tap + auto-scroll yes/no via `deep` prop) → FloatingCertificate payoff → AI-tools hub (live chat demo via `deep` prop) → CTA.

## Layout
- `src/` — `Root.tsx` (composition registry), `TixuPromo*.tsx` (assembled promos), `screens/` (product screens), `v2/` (V2 rig: camera, ScreenFlow, TypoBeat, FloatingChips…), scene components
- `public/` — real app assets (logo, provider SVGs, course icons, illustrations). **Referenced via `staticFile()`**
- `docs/knowledge/` — project context, brand tokens, product model (memory bundle)

## Gotchas
- Run `remotion render|still` **from the project dir**, or pass `--public-dir "<proj>/public"` — else `<Img>` assets 404.
- Cyrillic/space paths render fine (proven on Remotion 4.0.484).
- Fonts load via `@remotion/google-fonts` (Manrope) — no manual font files.

## Backlog
Music + UI SFX · Zod parametrization (RU/EN, per-course, 1:1/16:9) · 15s/6s cutdowns · overview/gallery variants.
