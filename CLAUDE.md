# motion-engine

Универсальный движок продуктовых моушен-видео на **[Remotion](https://www.remotion.dev/)** (видео как React-код). Для маркетинга **tixu.ai** + видео **под заказ**. tixu.ai — один из проектов внутри движка.

> ⚠️ **Это ОТДЕЛЬНЫЙ проект.** Не смешивать с quiz-funnel-runner (QFR) или другими. Запускать Claude **из папки `motion-engine`** (`cd Desktop/motion-engine && claude`) — тогда грузятся эта инструкция + память проекта.

## Что это
- Remotion 4.0.484 + React 19 + TypeScript. **Self-contained** (без внешних API/ключей), рендер 100% локально.
- Мастер-формат: **9:16 · 1080×1920 · 30fps**, English. Эстетика: **floating phone на brand-gradient, Apple/Claude-keynote clean, continuous camera rig** (без full-frame wipes — «2010 transitions» отвергнуты).

## Команды
- `npm install` — один раз (Node на ПК есть, v20).
- `npm run dev` — Remotion Studio (живой предпросмотр в браузере, prop-редактор).
- `npx remotion still <Comp> out/f.png --frame=N` — рендер 1 кадра (~2 сек). **Главный feedback-loop: рендерь кадр → смотри глазами → правь.**
- `npx remotion render TixuPromoV2 out/promo.mp4` — полный mp4.
- ⚠️ Запускать `still`/`render` **из корня проекта** (иначе `public/` assets → 404).

## Архитектура (`src/`)
- `Root.tsx` — реестр композиций: `TixuPromoV2` (44с, главный), `TixuPromo` (V1 30с), + 6 сцен для превью. `index.ts` — `registerRoot`.
- `theme.ts` — токены (colors: primary `#127CE0`, ink, green, gradient-стопы; radius pill/button/card/screen/phone). `fonts.ts` — Manrope через `@remotion/google-fonts`.
- `device/` — `PhoneFrame` (titanium-рамка 19.5:9, Dynamic Island, `StatusBar`); экраны рендерятся внутри (overflow:hidden).
- `screens/` — pixel-faithful UI-экраны продукта: Home/Profile/Library/Path/LessonQuiz/AiTools. Stateless, `useCurrentFrame()` локален (обёрнуты в Sequence через ScreenFlow).
- `scenes/` — 6 сцен V1 (Hook/Profile/Path/LessonQuiz/AiTools/Cta).
- `components/` — GradientBackground, PhoneStage, CaptionChip, BottomNav, TransitionFX.
- `v2/` — система «один непрерывный кадр»:
  - `TixuPromoV2.tsx` — camera rig (CSS transform: translate+rotateX/Y+scale, perspective 1600) + beat map (7 TypoBeat-битов, zoom in→out→pull-back).
  - `anim.ts` — `EASE`/`EASE_INOUT`/`EASE_OUT` (bezier-пресеты) + `kf()` (multi-stop interpolate) + `window01()` (visibility окно).
  - `ScreenFlow` (in-device iOS push/tab nav), `TypoBeat` (blur-up текст), `TapDot`, `FloatingChips` (glass-чипы), `FloatingCertificate`, `LivingBackground` (дышащий фон).

## Конвенции (важно)
- **Без `Math.random()`** — ломает детерминизм рендера. Всё параметризовать по `frame`/`index`.
- Анимация через `frame` (`useCurrentFrame`), `interpolate`/`spring`, easing из `v2/anim.ts`.
- Ассеты — в `public/`, через `staticFile()`.
- Бренд: Manrope (600-800 headings), primary `#127CE0`, near-white surfaces, soft shadows, radius 20-22 (см. `theme.ts`).

## 🎯 Направление: premium-пасс + AI-authoring рефактор (план от 2026-07-04)
Цель: убрать «топорность» тестовых роликов + сделать движок удобным для AI-авторинга. Инкрементами, «по полочкам»:
1. **Токены по полочкам** — консолидировать хардкод в `theme.ts` (сейчас цвета/шрифты/длительности размазаны по ~8 файлам: PhoneFrame titanium, LivingBackground/GradientBackground градиенты-дубли, per-provider tints, typography scale 88/82/72…, durations).
2. **Премиум-примитивы** (`lib/` + `anim.ts`) — добавить: **spring-пресеты**, `<MotionBlur>` (`@remotion/motion-blur` — сейчас НЕТ), `<Grain>` (`@remotion/noise` — сейчас НЕТ), glow, stagger-хелпер, depth-parallax.
3. **Крафт-пасс `TixuPromoV2`** — **spring вместо ease + motion-blur на переходах + grain + один accent на тёмной базе** (3 движения = 80% премиума).
4. **Звук** (главный пробел) — `@remotion/media` + `@remotion/sfx` + Artlist (лицензия под заказ); слой `sfxTrack(event, frame)`.
5. **AI-authoring структура** — atomic Scene-компоненты + декларативная **Scene-Map** (массив `{component, fromFrame, duration, props}`) + still-feedback-loop.

**📋 Трекер статусов инкрементов: `docs/INCREMENTS.md`** — цель/что/валидация/статус на каждый. Веди его при работе.

## Контекст-хаб (стратегия / крафт / клиенты)
Obsidian vault: `OneDrive\Документы\Obsidian Vault\мои проекты\Моушен-видео (Remotion)\`:
- **00 — Обзор**, **01 — Поиск клиентов** (рынок $500-2K), **02 — Крафт**, **03 — Remotion workflow**, **04 — Свои инструменты**, **05 — Клиент-ресёрч (таксономия)**.
- **Разведка 2026-07-04 — интеграции, крафт, AI-authoring** — полная тех-база (7 агентов Sonnet 5): приоритет Remotion-пакетов, крафт-приёмы + эталоны (Apple/Linear/Raycast/Vercel/Stripe), звук, визуал/3D, параметризация, AI-ergonomics. **Читать перед крупными решениями.**

Репо: private `gorka2354/motion-engine`.