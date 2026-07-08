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

## inc-6 — Transition pack ✅
**Цель:** закрыть «слабое место — переходы»: превращение объекта в объект (с кручением), морфинг форм, новые внутриэкранные переходы.
**Что:** `<MagicMove>` (FLIP/shared-element: A летит/крутится/кроссфейдится в B, spring-прогресс, non-uniform scale контента); `morphPath`/`drawPath01` поверх `@remotion/paths` (interpolatePath — пути с одинаковой структурой команд; evolvePath — draw-on); additive kind `"flip"` в `ScreenFlow` (3D rotateY, perspective 1200).
**Валидация:** песочница `FxSandbox` (тёмная сцена, 3 ряда), стиллы f20/40/70 (`out/inc6/`); мастер Δ=0 (MD5 IDENTICAL frame 90); flip проверен через scene-map override `--props` (nav.library → flip, кадр 274) — сам мастер не менялся.
**Итог (2026-07-05):** экспорт из `src/lib`: `MagicMove`, `MagicRect`, `morphPath`, `drawPath01`. Deps: +`@remotion/paths` 4.0.484. «Превращение с кручением» = `<MagicMove spin={1}>`; для произвольных несовместимых форм (разная структура path) при необходимости добавить flubber — пока осознанно не тянем.

## inc-7 — 16:9 + второй бренд (Shotik) ✅
**Цель:** доказать «конструктор стилей» на не-tixu бренде + формат ноутбука/монитора.
**Что/итог (2026-07-06):** `device/LaptopFrame` (16:10 экран, дека) · `lib/StageBackground` (обобщённая тёмная сцена: bg/glow пропсами — LivingBackground остаётся tixu-специфичным) · токен-группа `theme.shotik` (графит + MCP-фиолет `#7C5CFF`) · `TypoBeat` принимает color/subColor/accentColor · проектная папка `src/shotik/` (паттерн «проект внутри движка»): DesktopScreen (оверлей захвата: рамка+хэндлы+тулбар, draw-on стрелка, pixelate, toast), карточки, `ShotikPromo` 1920×1080/720f — **MagicMove-цепочка из 3 морфов как язык переходов** (регион→скриншот-карта→чат-тамб→GitHub-карта). ⚠️ Грабля в `MagicMove` задокументирована: **дробный `spin` паркует объект повёрнутым** (0.5 → вверх ногами) — для остающихся в кадре целей только целые обороты. Стиллы: `out/shotik/`.

## inc-8 — 3D-слой + Blender-мост ✅
**Цель:** настоящее 3D в композициях + пайплайн ассетов.
**Что/итог (2026-07-06):** `@remotion/three` + three 0.171 + @react-three/fiber 9 (+peer use-sync-external-store). `lib/ThreeSandbox` (комп 1920×1080): 3D-ноутбук из примитивов — крышка открывается spring-ом (f18–98), emissive-экран с brand-glow, медленный орбит, всё от `useCurrentFrame` (детерминизм ✓), поверх нашей сцены StageBackground+Grain. **Blender-мост:** blender-mcp зарегистрирован (`claude mcp add blender -- uvx blender-mcp`, user-scope), Blender установлен через winget, аддон скачан в `~/.claude/tools/blender-mcp-addon.py` — после включения аддона в Blender можно моделить сцены командами → экспорт GLB → `useGLTF` в ThreeCanvas. Роль Blender: фабрика ассетов (модели/запечённые анимации), рендер кадров — всегда в Remotion (детерминизм).
**Стиллы:** `out/three/`. Дальше по 3D: детализация моделей через blender-mcp (интерактив), частицы.
**Полировка 2026-07-08:** (а) `lib/Environment3D` — RoomEnvironment через PMREM (`scene.environment`): металлы получили отражения, клампы metalness убраны — обязательный компонент любой 3D-сцены движка; (б) **baked-texture match-cut** — 2D-кадр рендерится отдельной композицией (`ShotikDesktopStill`) → запекается emissive-текстурой в экран GLB (Blender, GLB embed) → долли влетает в «настоящий» экран и **замирает за ~8 кадров до конца короткого фейда** — диссолв идёт между двумя статичными совпадающими картинками, шов почти невидим. Приём переносится на любые «влёты в экран» (tixu-телефон и т.д.).
**GLB-пайплайн доказан (2026-07-06):** `scripts/blender/laptop.py` (headless: `blender -b -P …`) моделирует ноутбук (бевелы, петля, emissive-экран) + рендерит превью-эталоны (фронт/сбоку) → `public/models/laptop.glb` → `lib/useGltf` → `GltfSandbox`. ⚠️ Грабли: (1) **delayRender внутри ThreeCanvas (r3f-root) не держит кадр** — грузить ассеты в DOM-root и передавать пропом; (2) **куб Blender size=1 имеет ПОЛНЫЕ стороны 1** — scale задаёт полные габариты (у three boxGeometry — тоже полные, но полуразмерная арифметика петель ломается тихо); (3) **transform_apply на родителе смещает детей** — для жёстких сборок позиционировать siblings векторной математикой без парентинга; (4) метал без env-карты в three рендерится чёрным — клампить metalness ≤0.55 и DoubleSide после загрузки; (5) практика: **превью-рендер прямо из Blender (фронт + сбоку) как ground-truth до экспорта** — экономит часы слепой отладки осей.

---

## Дальше (backlog, после 1-5)
Zod-параметризация (RU/EN, форматы) · brand-kit injection (per-client тема) · Remotion Lambda (масштаб) · Lottie/3D-телефон · субтитры (@remotion/captions). Детали — Obsidian «04 — Свои инструменты поверх».