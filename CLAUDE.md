# motion-engine

Универсальный движок продуктовых моушен-видео на **[Remotion](https://www.remotion.dev/)** (видео как React-код). Для маркетинга **tixu.ai** + видео **под заказ**. tixu.ai — один из проектов внутри движка.

> ⚠️ **Это ОТДЕЛЬНЫЙ проект.** Не смешивать с quiz-funnel-runner (QFR) или другими. Запускать Claude **из папки `motion-engine`** (`cd Desktop/motion-engine && claude`) — тогда грузятся эта инструкция + память проекта.

## Что это
- Remotion 4.0.484 + React 19 + TypeScript. **Self-contained** (без внешних API/ключей), рендер 100% локально.
- Мастер-формат: **9:16 · 1080×1920 · 30fps**, English. Эстетика (после inc-3): **floating phone на тёмной brand-сцене** (rich navy `theme.dark` + ОДИН blue-accent, светлые экраны продукта внутри девайса), Apple/Claude-keynote clean, continuous camera rig + **spring-входы / motion-blur на движениях камеры / плёночный grain** (без full-frame wipes — «2010 transitions» отвергнуты).

## Команды
- `npm install` — один раз (Node на ПК есть, v20).
- `npm run dev` — Remotion Studio (живой предпросмотр в браузере, prop-редактор).
- `npx remotion still <Comp> out/f.png --frame=N` — рендер 1 кадра (~2 сек). **Главный feedback-loop: рендерь кадр → смотри глазами → правь.**
- `npx remotion render TixuPromoV2 out/promo.mp4` — полный mp4.
- ⚠️ Запускать `still`/`render` **из корня проекта** (иначе `public/` assets → 404).

## Архитектура (`src/`)
- `Root.tsx` — реестр композиций: `TixuPromoV2` (44с, главный, **schema+defaultProps**), `TixuPromo` (V1 30с, светлая тема), 6 сцен V1, **`LibSandbox`** (стенд примитивов inc-2), **`FxSandbox`** (стенд переходов inc-6). `index.ts` — `registerRoot`.
- `theme/tokens.ts` — ВСЕ токены (единственный источник): `color` (primary `#127CE0`, ink…), **`dark`** (тёмная сцена V2: bg/vignette/text/textMuted/accent/scrim/shadowFloat/phoneGlow), `titanium`, `gradient`, `shadow`, `providerTint`, `type` (scale: hero 88 / endTitle 82 / beat 72 / beatWide 64 / beatZoom 62 + weights), `duration` (beatIn/Out), `ease` (bezier-стопы), `radius`, `font`. `theme/index.ts` — реэкспорт (`import { theme } from "../theme"` работает как раньше). `fonts.ts` — Manrope (subsets latin; **для RU добавить cyrillic**).
- **`lib/` — премиум-примитивы (вход: `src/lib/index.ts`):**
  - `<MotionBlur shutterAngle samples>` — блюр движения; контент внутри ДОЛЖЕН сам читать `useCurrentFrame` (см. CameraRig); оборачивать только движущееся и только в окнах движения (цена ×samples).
  - `<Grain opacity frequency blend>` — живое зерно; overlay для тёмных баз, multiply для светлых (см. грабли в Конвенциях).
  - `<Glow color radius strength>` — свечение по силуэту (drop-shadow), работает на тексте/картах/SVG.
  - `<Parallax seed depth amplitude speed>` — органический дрейф на noise2D; слои с разной depth = глубина.
  - `<MagicMove from to a b renderA renderB spin config>` — FLIP-морф «объект A → объект B» с перелётом/кручением (`spin` = обороты) и кроссфейдом; rect'ы center-based; до `from` показывает A, после `to` — B.
  - `morphPath(a,b,t)` — морф SVG-путей (одинаковая структура команд!); `drawPath01(path,t)` — draw-on линии (spread в `<path>`); `hexToRgba`.
  - Реэкспорт anim: `EASE/EASE_INOUT/EASE_OUT`, `kf`, `window01`, **`springWindow(f,fps,from,to,config)`** (spring-вход + eased-выход; raw `enter` овершутит — использовать для движения), **`SPRING`** (smooth/pop/bounce), `stagger`, `stagger01`, `clamp01`.
- `device/` — `PhoneFrame` (titanium-рамка 19.5:9, Dynamic Island, `StatusBar`); экраны рендерятся внутри (overflow:hidden).
- `screens/` — pixel-faithful UI-экраны продукта: Home/Profile/Library/Path/LessonQuiz/AiTools. Stateless, `useCurrentFrame()` локален. Остаются светлыми — контраст с тёмной сценой.
- `scenes/` + `components/` — V1 (светлая тема): 6 сцен, GradientBackground, PhoneStage, CaptionChip, BottomNav, TransitionFX.
- `v2/` — система «один непрерывный кадр» на тёмной сцене:
  - `TixuPromoV2.tsx` — **движок**, принимает `PromoProps`: `CameraRig` (отдельный компонент — так MotionBlur честно сэмплирует движение; transform translate+rotateX/Y+scale, perspective 1600) + `BLUR_WINDOWS` (блюр только в окнах реального движения камеры); реестры `SCREENS` (имя→экран) и `SIZE` (слот→px). Camera art (ZOOM/END-кейфреймы) — в коде, не в данных.
  - **`promo.map.ts` — сценарий = данные** (`PROMO_DEFAULTS`: beats/zoomBeat/nav/floats/brand-копия); `promoSchema.ts` — zod-контракт. **Авторинг: правь map, `--props=file.json` при рендере или prop-редактор Studio — НЕ JSX.**
  - `anim.ts` — источник easing/spring-хелперов (см. lib выше).
  - `ScreenFlow` (in-device nav, kinds: `push`/`tab`/**`flip`** — 3D-переворот), `TypoBeat` (spring blur-up типографика, цвета dark-сцены), `TapDot`, `FloatingChips`, `FloatingCertificate`, `LivingBackground` (тёмная дышащая сцена + Grain поверх).

## Конвенции (важно)
- **Без `Math.random()`** — ломает детерминизм рендера. Всё параметризовать по `frame`/`index` (для органики — noise2D с seed).
- Анимация через `frame` (`useCurrentFrame`), `interpolate`/`spring`, easing/spring-пресеты из `v2/anim.ts` (вход: `src/lib`).
- Ассеты — в `public/`, через `staticFile()`. Логотип ink-цвета: на тёмной сцене инвертировать `filter: brightness(0) invert(1)`.
- Бренд: Manrope (600-800 headings), primary `#127CE0`; V2 = тёмная сцена `theme.dark` + светлые экраны в девайсе; radius 20-22 (см. `theme/tokens.ts`).
- **Zod строго `4.3.6`** (exact, требование Remotion 4.0.484 — иначе version-mismatch warning на каждом рендере).
- **⚠️ Грабли headless-рендера** (найдены эмпирически, детали в `src/lib/Grain.tsx`):
  1. `mix-blend-mode` работает ТОЛЬКО на полностью непрозрачном контенте — любая opacity/alpha <1 молча отключает бленд; силу эффекта кодировать контрастом вокруг identity-цвета бленда (overlay→0.5, multiply→1, screen→0).
  2. overlay-бленд математически ≈ невидим на почти-белом фоне → на светлых базах `multiply`.
  3. Целочисленный `baseFrequency` у feTurbulence (1.0) даёт плоскую константу (узлы решётки перлин-шума) — брать 0.8 и т.п.
- Рефакторы валидировать **Δ=0**: стиллы 90/300/540/950/1210 до/после → MD5 совпадает. Изменения лука — стиллы + глазами vs эталон.

## 🎯 Направление: premium-пасс + AI-authoring рефактор (план от 2026-07-04)
Цель: убрать «топорность» тестовых роликов + сделать движок удобным для AI-авторинга. Статус на 2026-07-05:
1. ✅ **Токены по полочкам** — `src/theme/tokens.ts`, Δ=0.
2. ✅ **Премиум-примитивы** — `src/lib/` + SPRING/stagger в `anim.ts`, стенд `LibSandbox`.
3. ✅ **Крафт-пасс `TixuPromoV2`** — тёмная сцена + spring + motion-blur + grain (`out/tixu-promo-v2-AFTER-inc3.mp4` vs `-BEFORE.mp4`).
4. 🔲 **Звук** (главный пробел, отложен пользователем) — `@remotion/media` + SFX-слой; музыка: ждёт решения по Artlist.
5. ✅ **AI-authoring / Scene-Map** — `promo.map.ts` + `promoSchema.ts`, авторинг через данные/`--props`.
6. ✅ **Transition pack** (сверх плана) — `MagicMove` (FLIP-морф со spin), `morphPath`/`drawPath01`, ScreenFlow `flip`, стенд `FxSandbox`.

**📋 Трекер статусов инкрементов: `docs/INCREMENTS.md`** — цель/что/валидация/статус на каждый. Веди его при работе.

## Контекст-хаб (стратегия / крафт / клиенты)
Obsidian vault: `OneDrive\Документы\Obsidian Vault\мои проекты\Моушен-видео (Remotion)\`:
- **00 — Обзор**, **01 — Поиск клиентов** (рынок $500-2K), **02 — Крафт**, **03 — Remotion workflow**, **04 — Свои инструменты**, **05 — Клиент-ресёрч (таксономия)**.
- **Разведка 2026-07-04 — интеграции, крафт, AI-authoring** — полная тех-база (7 агентов Sonnet 5): приоритет Remotion-пакетов, крафт-приёмы + эталоны (Apple/Linear/Raycast/Vercel/Stripe), звук, визуал/3D, параметризация, AI-ergonomics. **Читать перед крупными решениями.**

Репо: private `gorka2354/motion-engine`.