# tixu.ai — продукт-ресёрч (mobile, 2026-07-05)

Обход под тест-аккаунтом (viewport 393×852). Скриншоты рядом. Цель: инвентаризация для роликов + сверка наших pixel-faithful реплик.

## Разделы и что в них

### Home — «Your AI profile» (`/home`) → `tixu-home-mobile.png`
- Шапка: logo · **streak-флейм с числом** (NEW) · профиль.
- Personal focus: Claude Mastery · Edit. Чипы: 33% (кольцо) · Make money online · 20 min/day.
- **Синяя hero-карта «Next lesson · 5 min»**: заголовок курса, описание, теги (Automation / Advanced workflows / Real-world cases), белая кнопка Continue learning. (У нашей реплики HomeResume — старый центрированный лейаут с рюкзаком; реальный экран богаче.)
- **Personal plan** — 3 нумерованные ступени: 1 Core Skills (Claude 100%) → 2 Advanced Tools (Claude Advanced Workflows 0%) → 3 No-Code Building (Claude Vibe Coding).
- «By the end you'll be able to» — 2×2 outcomes (🎓⚡📈🛠️).
- Bottom nav: Home · Library · AI tools.

### Library (`/library`) → `tixu-library-mobile.png`
- Hero-карусель челленджей («Your Personal AI Income Challenge», 3%).
- Learning paths: категории Careers · Challenges · Images · Video (скролл).
- Careers: AI for Accountants / Project Managers / Sales Managers… (Not started).

### Курс-путь (`/course/85`) → `tixu-course-path-mobile.png` ⭐
- Header «Course Progress · 0%», hero-карта курса (🎓, advanced · **15 lessons**, Claude Advanced Workflows, Continue).
- **5 именованных уровней** с карточками-заголовками: L1 Beyond the Basics · L2 Build a Workspace That Runs Itself · L3 Make Real Things · L4 Pro Power-Ups · L5 Judgment and Next Steps.
- Зигзаг узлов-уроков (иконка книжки; активный — синий play). Финал: **Final Test (флаг) → Personal certificate (медаль)**.
- Уроки L1: From Helper to System · Show Claude What "Good" Looks Like · Break Big Jobs Into Steps · Let Claude Write the Prompt. L2: Write Project Instructions · Give Your Project a Knowledge Base · Build a Skill Library. L3: Build Tools, Not Just Documents · Publish and Reuse What You Build. L4: Connect Claude to Your Apps · Ask Across Your Email, Calendar and Drive · Let Claude Do the Work with Cowork. L5: Catch Claude's Mistakes · Pick the Right Plan · Final Test.
- Тап по узлу → bottom-sheet с названием и Continue learning.

### Урок (`/course/85/topic/270/lesson/1143`) → `tixu-lesson-mobile.png`
- Card-flow: заголовок с ✕ и флажком-репортом, секции текста + иллюстрации, синяя Next снизу.
- **Типы интеракций:** кнопки-ответы (Quick chat / Open a Project) · radio-квиз с **Hint** · Yes/No · **fill-in-the-blank с выпадашками «Choose one»** (NEW у нас нет) · «What You Learned» саммари.
- Квиз-контент совпадает с нашей репликой LessonQuiz («Turns Claude into a self-running system» ✓).

### AI tools (`/ai-tools`) → `tixu-aitools-mobile.png` ⭐
- **Popular: чёрная hero-карта Whisper с волной** (NEW) — transcribe/translate/extract.
- Generate: text / video / image / audio + большая синяя «New chat ▷».
- **Задачные чипы 2×3**: Solve a problem · Write · Create an image · Translate · Research · Learn (NEW).
- AI models с **фильтрами Popular/Text/Image/Video**; модели: ChatGPT, GPT-5 by OpenAI, **ChatGPT Image**, **Nano Banana** (Gemini 2.5 Flash image), **Whisper**, Gemini, **Wan** (video gen) — состав обновился vs наша реплика (Runway/Flux нет в Popular).
- **AI tips** (NEW секция): иллюстрированные карточки («The Caption Trick That Boosted My Likes») + табы Popular/Writing/Marketing + список советов (Fix Your Writing in 10 Seconds…).

### Profile (`/profile`) → `tixu-profile-mobile.png`
- Имя/почта, Settings, Contact us, Language (English), **Streak-виджет с неделей Su–Sa**.

## Выводы для роликов
1. Самая «вкусная» новая фактура: **курс-путь с 5 уровнями и сертификатом в конце** (готовая драматургия zero→certified) и **AI tools** (Whisper-волна, свежие модели, tips).
2. Наши реплики устарели точечно: Home hero-карта, состав моделей, нет streak. Для нового ролика строить **CoursePathScreen v2** по свежему скриншоту.
3. Баг продукта (сообщить команде tixu): описание курса на карточке Home — на испанском («Convierte Claude en un sistema autónomo…») при языке English.
