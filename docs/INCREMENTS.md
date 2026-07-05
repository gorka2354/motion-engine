# motion-engine — инкременты (premium-пасс + AI-authoring)

> План от 2026-07-04. Подход: **маленькие проверяемые ступени** (как QFR), `remotion still` после каждой → смотреть глазами → commit. Направление также в `CLAUDE.md` § Направление. Полная разведка/референсы — Obsidian `мои проекты/Моушен-видео (Remotion)/Разведка 2026-07-04`.

**Статус:** 🔲 не начат · 🔄 в работе · ✅ готов
**Правило:** ONE structural change за инкремент. После каждого — still ключевых кадров (90/300/540/950/1210) + при необходимости полный mp4.

## Before-эталон
`out/tixu-promo-v2-BEFORE.mp4` (44с, 1320ф, отрендерен 2026-07-04). **Диагноз:** чисто и читаемо, но **плоско** — бледный washed-out фон, нет grain/depth/motion-blur, вымытая палитра, floating-карточка местами обрезана случайно.

---

## inc-1 — Токены по полочкам ✅
**Цель:** единый `src/theme/tokens.ts` — ВСЕ цвета / шрифты / typography-scale / радиусы / тени / длительности / easing в одном месте.
**Что:** консолидировать хардкод из ~8 файлов → `PhoneFrame` titanium (`#3A424B/#12161B/#05070A`), `LivingBackground`/`GradientBackground` градиенты-дубли, per-provider tints (`AiToolsScreen`), typography scale (88/82/72/66…), durations (inDur/outDur 22/18). Заменить хардкоды на токены.
**Валидация:** **Δ=0 визуально** — still 90/300/540/950/1210 до/после совпадают (чистый рефактор).
**Риск:** LOW.
**Итог (2026-07-05):** `src/theme.ts` → `src/theme/{tokens,index}.ts` (импорты `../theme` не тронуты). Новые группы токенов: `titanium`, `gradient` (living/scene — near-dupes, унифицировать в inc-3), `shadow` (phone/ctaGlow/buttonGlow/cardHighlight/sheet), `providerTint`, `type` (scale+weights), `duration` (beatIn/Out), `ease` (bezier-стопы; `anim.ts` строит EASE из них). Заменены хардкоды: PhoneFrame, LivingBackground, GradientBackground, AiToolsScreen, TypoBeat, TixuPromoV2, HomeResumeScreen, LessonQuizScreen, anim.ts. **Δ=0 подтверждён: MD5 before/after IDENTICAL на всех 5 кадрах** (`out/inc1/`). tsc чистый.

## inc-2 — Премиум-примитивы (`src/lib/`) ✅
**Цель:** переиспользуемые примитивы поверх Remotion.
**Что:** установить `@remotion/motion-blur` + `@remotion/noise`. Создать: spring-пресеты в `anim.ts` (сейчас spring только в V1); `<MotionBlur>` (обёртка `CameraMotionBlur`); `<Grain>` (noise overlay); `<Glow>`; `stagger()` (сейчас `i*N` вручную в 4 файлах); depth-parallax слои.
**Валидация:** тест-стилл каждого примитива изолированно (отдельная Composition-песочница).
**Риск:** LOW (additive, ничего не применяем к ролику).
**Итог (2026-07-05):** `src/lib/` = `MotionBlur` (CameraMotionBlur), `Grain` (SVG feTurbulence, живое зерно по frame-seed), `Glow` (двухслойный drop-shadow), `Parallax` (органический дрейф на noise2D), `hexToRgba`; в `anim.ts` добавлены `SPRING` (smooth/pop/bounce), `stagger()`, `stagger01()`; общий вход `src/lib/index.ts`. Песочница `LibSandbox` в Root (6 рядов, стиллы 17/25/70 в `out/inc2/`), всё проверено глазами + пиксельными замерами. **3 граблей headless-рендера задокументированы в коде Grain:** (1) mix-blend-mode применяется ТОЛЬКО к полностью непрозрачному контенту (и element-opacity, и per-pixel alpha < 1 молча убивают бленд → сила зерна = контраст цвета вокруг identity-точки бленда); (2) overlay математически ≈ невидим на почти-белом фоне (для светлых баз — `blend="multiply"`; тёмная база inc-3 решает это системно); (3) baseFrequency=1.0 (целое) у feTurbulence даёт константу — узлы решётки перлин-шума (дефолт 0.8).

## inc-3 — Крафт-пасс `TixuPromoV2` ✅ ⭐
**Цель:** визуальный скачок, убрать топорность (3 движения = 80%).
**Что:** (а) spring вместо ease на входах; (б) motion-blur на camera-moves/переходах; (в) grain overlay + глубина; (г) тёмная/богатая база + ОДИН насыщенный accent (сейчас наоборот — бледный светлый); (д) аккуратная хореография floating-элементов (чинит обрезанную карточку).
**Валидация:** still 90/300/540/950/1210 глазами vs BEFORE; полный mp4 → `out/..-AFTER.mp4`, сравнить до/после.
**Риск:** MED (меняет look — но обратимо, before-эталон есть).
**Итог (2026-07-05):** V2 переведён на тёмную сцену: токены `theme.dark` (bg/vignette/text/textMuted/accent/scrim/shadowFloat/phoneGlow), `LivingBackground` → rich navy + 2 гроу-блоба primary/primaryDeep (один accent) + `<Grain 0.07>`; ambient-глоу за телефоном. Spring-входы: `springWindow()` в anim.ts → TypoBeat (overshoot на translate), FloatingChips/Certificate (SPRING.pop). Motion-blur: камера-риг выделен в `CameraRig` (blur сэмплирует движение честно), `BLUR_WINDOWS` = только окна реального движения (rise/zoom-in/zoom-out/pull-back), samples 8 / shutter 240. Хореография: хиро-биты y 520→290 (коллизия текста с рамкой на f90 устранена), wordmark → белый (CSS invert) с гашением к половине зума (фикс «призрака» поверх экрана). V1 (TixuPromo) не тронут — остался на светлой теме. Стиллы: `out/inc3/`. Полный рендер: `out/tixu-promo-v2-AFTER-inc3.mp4`.

## inc-4 — Звук 🔲
**Цель:** закрыть главный пробел качества.
**Что:** `@remotion/media` + `@remotion/sfx`; музыка (Artlist — лицензия под заказ); слой `sfxTrack(event, frame)` — SFX по битам (tap/push/appear); music ducking под ключевые моменты.
**Валидация:** рендер mp4 со звуком, послушать; SFX на кадре НАЧАЛА анимации.

## inc-5 — Scene-Map (AI-authoring) ✅
**Цель:** авторинг ролика из данных, а не из JSX.
**Что:** atomic Scene-компоненты с Zod-контрактами + декларативный `src/scene-map.ts` (массив `{component, fromFrame, duration, props}`) + движок-обёртка (оборачивает каждую в `<Sequence>`). Still-loop как штатный цикл разработки.
**Валидация:** пересобрать ролик из scene-map → still совпадает с inc-3 AFTER.
**Итог:** дальше ролики (в т.ч. под заказ) собираются редактированием массива + токенов.
**Итог (2026-07-05):** сторилайн V2 = данные: `src/v2/promoSchema.ts` (zod **4.3.6** — версия жёстко под Remotion, v3 даёт version-mismatch warning) + `src/v2/promo.map.ts` (`PROMO_DEFAULTS`: beats/zoomBeat/nav/floats/brand-копия). `TixuPromoV2` стал движком `React.FC<PromoProps>`: реестр `SCREENS` (имя→экран), слоты `SIZE` (hero/beat/beatWide/beatZoom→theme.type), концовка/CTA/логотип из `brand`. Root: `schema`+`defaultProps` → props редактируются в Remotion Studio и переопределяются `--props=file.json`. **Отклонение от плана:** не Sequence-обёртка над массивом сцен — V2 это continuous shot, данные описывают биты/навигацию/флоаты поверх постоянного camera-rig; Sequence-движок понадобится позже для мультисценовых клиентских роликов (V1-стиль). **Валидация:** MD5 IDENTICAL на 90/300/540/950/1210 vs эталон (`out/inc5/`); демо-override `out/inc5/demo-override-1290.png` (новая копия конца + CTA из JSON). ⚠️ Для RU-вариантов добавить `cyrillic` в subsets `fonts.ts` (сейчас latin-only).

---

## Дальше (backlog, после 1-5)
Zod-параметризация (RU/EN, форматы) · brand-kit injection (per-client тема) · Remotion Lambda (масштаб) · Lottie/3D-телефон · субтитры (@remotion/captions). Детали — Obsidian «04 — Свои инструменты поверх».