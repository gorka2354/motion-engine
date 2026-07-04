#!/usr/bin/env bash
# import-knowledge.sh — восстановить память Claude Code проекта tixu-motion
# на НОВОЙ машине после git clone. Идемпотентен; существующие файлы бэкапит в *.bak-<ts>.
#
# Запуск из корня репо:  bash scripts/import-knowledge.sh
#
# ⚠ Claude Code хранит память под sanitized абс.путём РАБОЧЕЙ ПАПКИ СЕССИИ
#   (cwd, где запущен `claude`), а не git-репо. Скрипт кладёт под путь ЭТОГО репо —
#   верно, если ты открываешь Claude Code внутри клона tixu-motion (обычный случай).
#   Если открываешь Claude в РОДИТЕЛЬСКОЙ папке — перемести memory/ в её sanitized-путь
#   (см. README). Sanitize = каждый символ вне [a-zA-Z0-9-] → '-'.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
KN="$REPO/docs/knowledge"
TS="$(date +%Y%m%d-%H%M%S)"

[ -d "$KN/memory" ] || { echo "ОШИБКА: нет $KN/memory — запусти из корня репо после git pull"; exit 1; }

SANITIZED="$(printf '%s' "$REPO" | sed 's#[^a-zA-Z0-9-]#-#g')"
DEST_MEM="$HOME/.claude/projects/$SANITIZED/memory"
mkdir -p "$DEST_MEM"
echo "→ Память tixu-motion → $DEST_MEM"
for f in "$KN"/memory/*.md; do
  base="$(basename "$f")"
  if [ -f "$DEST_MEM/$base" ] && ! cmp -s "$f" "$DEST_MEM/$base"; then
    cp "$DEST_MEM/$base" "$DEST_MEM/$base.bak-$TS"
    echo "   бэкап существующего $base → $base.bak-$TS"
  fi
  cp "$f" "$DEST_MEM/$base"
done
echo "   готово: $(ls "$KN"/memory/*.md | wc -l | tr -d ' ') файлов"
echo ""
echo "ℹ Глобальная память Егора + личный ~/.claude/CLAUDE.md едут с репо quiz-funnel-runner-mvp"
echo "  (docs/knowledge/global-memory/ + global-CLAUDE.reference.md там). Здесь только память проекта."
echo ""
echo "✅ Готово. Дальше — docs/knowledge/README.md § Setup (npm install → npm run dev)."
