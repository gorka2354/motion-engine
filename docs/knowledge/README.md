# tixu-motion — знания + setup на новой машине

Remotion-проект продуктовых motion-видео для **tixu.ai** (9:16 1080×1920 @30fps, English,
floating-phone на брендовом градиенте). Тут — как поднять проект на основном компе и
восстановить память Claude Code.

> Связанный репо: **quiz-funnel-runner-mvp** — там общий хаб знаний (глобальная память
> Егора, feedback-правила, личный `~/.claude/CLAUDE.md`). Здесь — только память этого проекта.

---

## Setup на новой машине

```bash
# 1. клон
git clone https://github.com/gorka2354/tixu-motion.git
cd tixu-motion

# 2. зависимости (Remotion 4.x + React 19; node 18+)
npm install

# 3. превью-студия / рендер
npm run dev          # remotion studio — интерактивный превью в браузере
npm run render       # remotion render — рендер видео в out/
npm run still        # один кадр (still)
npm run lint         # eslint + tsc

# 4. восстановить память Claude Code этого проекта
bash scripts/import-knowledge.sh
```

> **⚠ Ассеты и public-dir:** `remotion still|render`, запущенный ИЗ-ЗА пределов папки проекта,
> должен получать `--public-dir "<proj>/public"` — иначе `<Img>`-ассеты отдают 404
> (подробности в памяти `tixu-motion-project.md`).

---

## Что в проекте (на момент переноса, 2026-07-02)

- **V2 углублённая, 44s (1320f)** → рендерится в `preview/tixu-promo-v2-44s.mp4`.
  Beat map: hook → profile → Library beat → path (zoom) → lesson с двумя интеракциями
  (quiz tap + auto-scroll) → FloatingCertificate → AI-tools с live chat demo → CTA.
- Apple/Claude-style непрерывный кадр: persistent phone + camera rig, in-device iOS
  навигация (`ScreenFlow`), blur-up типографика (`TypoBeat`). Полноэкранные вайпы
  отвергнуты пользователем («2010 transitions»); V1 `TixuPromo` (886f) оставлен для сравнения.
- Реальные ассеты приложения — в `public/` (logo, providers, gen-cards, library-иконки).
- **Осталось:** музыка + UI SFX, Zod-параметризация (RU/EN, per-course, 1:1/16:9), 15s/6s кат-дауны.

---

## Память проекта (`docs/knowledge/memory/`)

| Файл | О чём |
|---|---|
| `MEMORY.md` | индекс |
| `tixu-motion-project.md` | архитектура видео-движка, beat map, статус V2, gotchas (public-dir) |
| `tixu-brand-tokens.md` | точные цвета + шрифт Manrope для видео/дизайна |
| `tixu-product-overview.md` | что такое tixu.ai (mobile-first AI-skills + AI-tools hub) — модель продукта |

`import-knowledge.sh` кладёт их в `~/.claude/projects/<sanitized-cwd>/memory/`. Путь зависит
от того, **откуда открываешь Claude Code**: скрипт целится в папку этого репо (открывай
сессию внутри `tixu-motion`). Если откроешь в родительской папке — перемести `memory/`
в её sanitized-путь.
