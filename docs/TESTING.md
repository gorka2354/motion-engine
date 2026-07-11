# Пирамида тестов motion-engine — база подхода к моушену через код

> Как мы автоматически ловим баги при создании видео кодом. Синтез индустриальных
> практик (Remotion / Three.js / визуальная регрессия / golden-master / 3D-QA,
> ресёрч 2026-07-11) + наш опыт (10 граблей в `CLAUDE.md`). Источник истины по
> тестам; при работе — вести и расширять.

## Философия: юнит-тест визуальный баг НЕ ловит

Классический юнит проверяет чистую функцию (вход→выход в памяти). Наши баги —
«углы за телефон» (#10), «тайл за кадром» (#6), алиасинг (#5), «мигание шва» (#9) —
живут **в отрендеренных пикселях**: компонент в jsdom не рендерит ни canvas, ни 3D.
Поэтому пирамида делится **по типу бага**, а не по слою кода:

```
        ┌─────────────────────────────────────────────┐
  L6    │  Глаза / AI-агент — финальная эстетика       │  не автоматизируется
        ├─────────────────────────────────────────────┤
  L5    │  3D-ассеты: glTF-validate, mesh QA, bounds   │  на регенерацию ассета
        ├─────────────────────────────────────────────┤
  L4    │  Golden-master: эталон-кадры vs новый рендер │  per-PR / nightly
        ├─────────────────────────────────────────────┤
  L3    │  Render self-check: content/motion/loop/seq  │  per-PR (stills), nightly (--seq)
        ├─────────────────────────────────────────────┤
  L2    │  Scene-graph 3D (react-three/test-renderer)  │  per-PR, без GPU
        ├─────────────────────────────────────────────┤
  L1    │  Юнит чистой логики: геометрия, anim, схемы  │  на каждый save, мс
        ├─────────────────────────────────────────────┤
  L0    │  Статик-гейты: детерминизм-guard, lint       │  на каждый save, мс
        └─────────────────────────────────────────────┘
   дешевле/быстрее/раньше ← → дороже/медленнее/позже (ближе к пикселям)
```

**Правило разделения труда:** «спутник за кадром / сквозь объект» (#6/#8) ловит
**геометрия-юнит ДО рендера** (доли мс); «объект пропал / застыл / шов / сдвиг лука»
(#7/#9/регрессия) — **пиксели готового рендера**. Дешёвый уровень ловит баг — не
доводим до дорогого.

---

## L0 — Статические гейты (`npm run lint`, каждый save)

| Проверка | Что ловит | Статус |
|---|---|---|
| `determinism.test.ts` — grep `Math.random`/`Date.now`/`performance.now` в `src` | **footgun #1** (недетерминизм ломает рендер + Δ=0) | ✅ есть |
| `eslint src && tsc` | типы, стиль | ✅ есть |
| **`delayRender`-гигиена** — каждый handle с меткой; `loadFont()`/`@remotion/fonts` вместо сырого `@font-face` | зависший рендер (timeout 30000мс); молча запечённый fallback-шрифт | 🔲 lint-правило |
| **флаг сырого `<Video>`/HTML5** → требовать `<OffthreadVideo>` | не frame-exact seeking видео | 🔲 review-чек |

Remotion-специфика: `random(seed)` из `remotion` — детерминированный PRNG (не
`Math.random`, который даёт разное значение на каждый рендер-тред).

## L1 — Юнит чистой логики (`npm test` → vitest, ~250мс, каждый save)

| Файл | Что ловит | Статус |
|---|---|---|
| `lib/geometry.ts` + `.test` — `visibleHalfWidth`=tan(fov/2)·dist, `orbitFitsFrame`, `orbitClearsObject` | **#6** орбита за кадром, **#8** сквозь объект — арифметикой, до рендера | ✅ есть |
| `v2/anim.test.ts` — краевые `clamp01/kf/window01/springWindow/stagger` | регрессии математики анимации (endpoints, монотонность, clamp) | ✅ есть |
| `lib/pixelMetrics.test.ts` — метрики детекторов на синтетике | доказывает, что детекторы L3 **срабатывают** | ✅ есть |
| **`Box3`/`Frustum`/`Raycaster`-инварианты** (`Box3.setFromObject().intersectsBox()`, `Frustum.setFromProjectionMatrix()`) | коллизии/клиренсы для off-axis камер (обобщение #6/#8) | 🔲 добавить |
| **overlap на `promo.map.ts`** (AABB non-intersection битов/флоатов) | наложение элементов, которых не должно быть — до пикселей | 🔲 добавить |
| **zod-контракт** через `selectComposition({inputProps})` | битые props/схема за мс (гоняет `calculateMetadata`+zod) | 🔲 добавить |
| **property-based** (`fast-check`) над `(frame,fps,from,to,config)` anim | инварианты на ВСЕХ входах, не фиксированных кейсах (тут мы впереди экосистемы) | 🔲 стретч |

## L2 — Scene-graph 3D без GPU (`@react-three/test-renderer`, per-PR)

Рендерит R3F-дерево через свой reconciler **без WebGL/canvas/GPU** — asserts по
структуре, не пикселям.

```ts
const r = await ReactThreeTestRenderer.create(<BybitScene />);
r.toGraph();                               // форма сцены — orphaned <primitive> → undefined (ловит #7)
await ReactThreeTestRenderer.act(async () => { await r.advanceFrames(2, 1); });
mesh.instance.rotation.x;                  // живой transform при фиксированной дельте
```

| Что ловит | Статус |
|---|---|
| **footgun #7** — `<primitive>` перепарентит node из GLB → node недостижим (проверка через scene traverse после маунта) | ✅ `sceneGraph.test.tsx` |
| присутствие мешей + **детерминированный transform** при фикс. `advanceFrames(n, delta)` | ✅ `sceneGraph.test.tsx` |

⚠️ Caveat: R3F v9/React 19 (issue #3520) — `Vector3`/`Quaternion` как JSX-props кидают
`applyProps`; в фикстурах использовать tuple-props (`position={[x,y,z]}`).
✅ **проверено:** `@react-three/test-renderer` 9.1.0 работает на `fiber@9`/`three@0.171`/React 19 с tuple-props.
**Backlog L2:** полный тест реального GLB-компонента (BybitGif) требует моков Remotion `useCurrentFrame` + GLB-загрузки — следующий шаг поверх этого каркаса.

## L3 — Render self-check (`npm run check-render`, per-PR stills / nightly `--seq`)

`scripts/check-render.mjs <Comp> [--frames N] [--loop] [--trim N] [--seq]` — рендерит
сэмпл-кадры → пиксель-эвристики (`scripts/pixel-metrics.mjs`).

| Проверка | Что ловит | Статус |
|---|---|---|
| content-check (дисперсия яркости центра) | объект вне кадра (**#6**) | ✅ есть |
| motion-check (diff соседних сэмплов) | застыло/пропало (**#7/#9**) | ✅ есть |
| loop-check (f_first↔f_last) | шов лупа | ✅ есть |
| seq-check (`--seq`: `renderMedia` mp4 + ffmpeg vs stills) | секвенциальный r3f-race (**#6/#7**) | ✅ есть |
| **jank-детект** — плотный семпл + outlier vs rolling-median (>3× медианы) | рывок вне склейки (реальный cut двигает ВСЕ кадры, jank — одиночный выброс) | 🔲 добавить |
| **title/action-safe** — SMPTE ST 2046-1: 93%/90% (для 1080×1920 ≈ 38/96px) | текст/лого за безопасной зоной | 🔲 добавить |
| **clip-check** — углы клип-контейнера на mid-transition = фон | углы за скруглённым девайсом (**#10**) | 🔲 backlog (нужны координаты углов) |
| **ffmpeg `freezedetect`/`blackdetect`** на mp4 в `--seq` | независимый second-opinion (их MAFD = наша math, другой код) | 🔲 добавить |

⚠️ **Критично для 3D: пинить `--gl`** (`swangle`/`swiftshader`) на baseline И CI.
`swiftshader`(CPU) vs `angle`(GPU/llvmpipe) дают **разные пиксели** — иначе diff покажет
шум рендерера, а не регрессию. GitHub Actions без GPU → `angle` падает, `swangle` — safe.
✅ **реализовано:** `check-render` дефолтит `--gl=swangle` (через `chromiumOptions`), переопределяется `--gl <val>`.

## L4 — Golden-master / визуальная регрессия (эталон-кадры, per-PR/nightly)

**Слепое пятно L3:** он сравнивает кадры только *внутри* одного рендера → коммит,
равномерно сдвигающий цвет/лук во ВСЕХ кадрах, проходит незаметно. Нужен эталон.

Философия (Feathers golden-master / ApprovalTests): `received` vs `approved`; любое
отличие = FAIL → человек решает **reject** (регрессия) или **re-approve** (намеренно,
коммит нового эталона). Никогда не авто-обновлять молча.

| Механизм | Что | Статус |
|---|---|---|
| **Δ=0 MD5** стиллы 90/300/540/950/1210 до/после рефактора | побайтовая регрессия (там где ждём identical: frame-seeded, без wall-clock) | ✅ ручная практика → 🔲 формализовать как git-baseline gate |
| **golden PNG** `test/golden/<Comp>/<frame>.png` + `pixelmatchRatio` (AA-aware, OKLab) — в отчёте | сдвиг лейаута/типографики/токена | ✅ есть |
| **SSIM** (`ssim.js`) — основной гейт golden-check, порог `GOLDEN_MIN_SSIM=0.98` (толерантен к grain) | **равномерный сдвиг лука во ВСЕХ кадрах** — слепое пятно L3 | ✅ есть |
| **`--accept-baseline`** флаг (явное обновление эталона, не молчаливое) | дисциплина эталона | ✅ есть |
| **stability-retry** — рендер кадра N дважды, требовать совпадения | warm-up-кадр (**#9**) как авто-гейт | 🔲 добавить |
| маски динамических регионов (seeded-noise `FloatingChips`/`TapDot`) | не глушить весь кадр из-за одной живой зоны | 🔲 добавить |

Solo local-render workflow → hosted (Percy/Chromatic) не окупаются; git-committed
golden + философия reg-suit ближе. SSIM деградирует под сильным шумом (реагирует на
само зерно) — если понадобится идеал, LPIPS точнее, но тянет нейросеть (тяжело).

## L5 — Валидация 3D-ассетов (Blender→GLB, на регенерацию)

Команда: **`npm run check-assets`** (`--accept` для записи фикстур) — валидирует все `public/models/*.glb`.

| Механизм | Что ловит | Статус |
|---|---|---|
| **`check-assets.mjs`** → `gltf-validator` (Khronos) по каждому GLB, hard-fail на severity-0 | `MESH_PRIMITIVE_TOO_FEW_TEXCOORDS` (нет UV под текстуру), `ACCESSOR_INVALID_FLOAT` (NaN→чёрная геометрия), degenerate-треугольники | ✅ есть |
| **metadata-фикстуры** `test/asset-fixtures/<name>.json` (`{meshes, materials, nodes, triangles, hasUV, hasNormal, bounds}`, Δ на regen через `@gltf-transform/core` `getBounds`) | тихая смена габаритов/топологии/UV — **3D-аналог golden Δ=0** | ✅ есть |
| **`scripts/blender/_qa.py`** перед `export_scene.gltf()`: `mesh.validate()` (True=чинил→fail) + applied-transform (WARN/strict-FAIL) + UV-presence + опц. `dimensions` | **size=1 gotcha**, «parent shifts children», нет UV, degenerate | ✅ helper + встроен в `bybit-card.py` (образец для остальных 3) |
| front/side ortho-стиллы как pixelmatch-baseline (tolerant, flag-on-diff) | формализует «ground-truth до экспорта» (footgun #6-правило) | 🔲 backlog |

Прогон 2026-07-11: все 4 GLB (card/tiles/laptop×2) — **0 errors**, UV+normals везде, фикстуры зафиксированы. `_qa.py` не прогонялся регенерацией (Blender 5.1 новее версии под скрипты — рабочие GLB не трогаем; helper активируется при следующей регенерации).

⚠️ **Наш реальный gap:** `export_apply=True` в `scripts/blender/*.py` применяет только
**модификаторы, НЕ трансформы объекта** → «parent shifts children» и «size=1» проходят
молча. Нужен явный `transform_apply(scale=True)` + assert. `_qa.py` (#2 выше) закрывает.

## L6 — Глаза / AI-агент

Финальная эстетика, ритм, «живость». Не автоматизируется — но AI-агент смотрит
сэмпл-кадры (наш still-loop) и ловит то, что метрика не формализует.

---

## Маппинг: грабля → уровень, который её ловит

| Грабля (`CLAUDE.md`) | Ловится на | Автоматизировано |
|---|---|---|
| #1 недетерминизм | L0 determinism-guard | ✅ |
| #6 объект за кадром | **L1** геометрия (до рендера) + L3 content/motion | ✅ |
| #7 r3f reparent race | **L2** scene-graph + L3 seq-check | ✅ |
| #8 сквозь объект | **L1** геометрия | ✅ |
| #9 warm-up / шов | L3 loop-check + **L4** stability-retry | ✅ loop / 🔲 retry |
| #10 углы за клип | **L3** clip-check | 🔲 backlog |
| #2 size=1 / transforms | **L5** `_qa.py` transform-assert + `check-assets` bounds-фикстура | ✅ |
| #5 алиасинг | L4 golden-diff (визуально) + L6 глаза | 🔲/L6 |

## CI-tiering (скорость обратной связи)

| Когда | Что бежит | Время |
|---|---|---|
| Каждый save | L0 + L1 (`npm test`, `npm run lint`) | мс |
| Каждый PR / commit | L2 scene-graph + L3 `check-render` stills для hero-компов + L4 golden-diff | секунды |
| На регенерацию ассета | L5 gltf-validate + `_qa.py` + metadata-Δ | секунды |
| Nightly / pre-release | L3 `--seq` (полный mp4 + ffmpeg) + L4 полный golden-sweep | минуты |

**TurboSnap-принцип:** `check-render`/golden гонять только на компах, чьи scene/screen
файлы изменились в git-diff — 60-90% меньше прогонов.

## Приоритет внедрения (impact / effort)

1. **`--gl` pin** — высокий impact (детерминизм всего пиксель-diff в 3D), ~0 effort. **Первым.**
2. **Golden-frame baseline** (pixelmatch + SSIM для grain) — высокий (закрывает слепое пятно L4), средний effort.
3. **`_qa.py` + gltf-validate** — высокий для ассетов (закрывает export_apply gap), низкий effort.
4. **`@react-three/test-renderer` smoke** — средний (ловит #7 без GPU), средний effort.
5. Инкрементально: jank-outlier, title-safe, ffmpeg freezedetect, property-based anim, zod-contract, Box3/Frustum.

## Инструментарий (из ресёрча)

| Слой | Инструмент | Заметка |
|---|---|---|
| Пиксель-diff | `pixelmatch` (OKLab в v6), `odiff` (быстрее на больших кадрах) | tolerance ~0.01, `includeAA:false` |
| Перцептивный | `ssim.js` (чистый JS), порог ~0.97; `looks-same` (ΔE 2.3) | для grain/bloom; LPIPS если нужен идеал (тяжело) |
| Snapshot | `jest-image-snapshot` (SSIM-режим, threshold 0.01) | git-committed baseline |
| Video-метрики | ffmpeg `freezedetect` (MAFD), `blackdetect` | second-opinion на mp4 |
| 3D scene-graph | `@react-three/test-renderer` | без GPU |
| 3D ассеты | `@gltf-transform/cli`, Khronos `gltf-validator`, `trimesh`, `pytest-blender` | validate/inspect/getBounds |
| Property-based | `fast-check` | инварианты anim |

## Источники (ключевые)

- Remotion: [testing](https://www.remotion.dev/docs/testing) · [randomness](https://www.remotion.dev/docs/using-randomness) · [--gl](https://www.remotion.dev/docs/gl-options) · [docker](https://www.remotion.dev/docs/docker)
- R3F: [testing / test-renderer](https://r3f.docs.pmnd.rs/api/testing) · issue [#3520](https://github.com/pmndrs/react-three-fiber/issues/3520)
- Визуальная регрессия: [pixelmatch](https://github.com/mapbox/pixelmatch) · [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot) · [reg-suit](https://github.com/reg-viz/reg-suit) · [Playwright screenshots](https://playwright.dev/docs/test-snapshots)
- Golden-master: [ApprovalTests](https://approvaltests.com/) · [ffmpeg freezedetect](https://github.com/FFmpeg/FFmpeg/blob/master/libavfilter/vf_freezedetect.c) · [Unity Graphics Test FW](https://docs.unity3d.com/Packages/com.unity.testframework.graphics@8.9/manual/index.html)
- 3D-ассеты: [glTF-Validator](https://github.com/KhronosGroup/glTF-Validator) · [gltf-transform](https://gltf-transform.dev/cli) · [pytest-blender](https://github.com/mondeja/pytest-blender)

---

*Что уже реализовано (inc-11, 2026-07-11): **L0–L5 автоматизированы** — L0 determinism-guard · L1
geometry/anim/pixelMetrics · **L2 scene-graph** (`@react-three/test-renderer`, #7-guard) · L3
content/motion/loop/seq + **`--gl=swangle` пин** · L4 **golden-frame baseline** (pixelmatch + SSIM-гейт
0.98, `--accept-baseline`) · L5 **3D-asset QA** (`gltf-validator` + metadata-фикстуры + Blender `_qa.py`).
29 vitest-тестов · 3 гейта `npm test` / `check-render` / `check-assets`. Осталось (L3-доп, по приоритету):
jank-outlier · title-safe (SMPTE) · ffmpeg-freezedetect · property-based anim · zod-contract · Box3/Frustum.*
