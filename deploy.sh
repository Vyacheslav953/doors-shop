#!/usr/bin/env bash
# Деплой Doors M на VPS. Запуск из корня проекта в Git Bash: ./deploy.sh
# Первый запуск дополнительно создаёт .env на сервере и кладёт туда демо-базу (deploy/doors.db).
set -euo pipefail

HOST="${DEPLOY_HOST:-root@150.251.153.107}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/id_ed25519_doors}"
DIR=/opt/doors-shop
SITE_URL="${SITE_URL:-http://150.251.153.107:3100}"
SSH=(ssh -i "$KEY" -o BatchMode=yes -o ServerAliveInterval=30 "$HOST")

echo "→ загружаю исходники"
"${SSH[@]}" "mkdir -p $DIR/data $DIR/media"
# ./deploy (демо-база и фото) нужен: Dockerfile сам собирает образ и запекает его в /app/data, /app/media.
# На хосте эти пути перекрыты постоянными томами ./data, ./media (см. docker-compose.yml), поэтому
# на запущенный сайт запечённые демо-данные не влияют, они нужны только чтобы сборка образа прошла.
tar czf - \
  --exclude='./node_modules' --exclude='./.next' --exclude='./.env' --exclude='./.env.*' \
  --exclude='./data' --exclude='./media' --exclude='./.claude' \
  --exclude='./tests' --exclude='./doors.db' --exclude='./doors.db-*' --exclude='*.tsbuildinfo' --exclude='./.git' . \
  | "${SSH[@]}" "tar xzf - -C $DIR"

echo "→ первичная настройка (если ещё не сделана)"
if ! "${SSH[@]}" "test -f $DIR/.env"; then
  TG_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' .env | cut -d= -f2-)
  TG_CHAT=$(grep '^TELEGRAM_CHAT_ID=' .env | cut -d= -f2-)
  "${SSH[@]}" "cd $DIR && printf 'PAYLOAD_SECRET=%s\nNEXT_PUBLIC_SITE_URL=%s\nTELEGRAM_BOT_TOKEN=%s\nTELEGRAM_CHAT_ID=%s\n' \"\$(openssl rand -hex 24)\" '$SITE_URL' '$TG_TOKEN' '$TG_CHAT' > .env && chmod 600 .env"
fi
if ! "${SSH[@]}" "test -f $DIR/data/doors.db"; then
  scp -i "$KEY" -o BatchMode=yes deploy/doors.db "$HOST:$DIR/data/doors.db"
fi
"${SSH[@]}" "chown -R 1000:1000 $DIR/data $DIR/media"

echo "→ сборка и запуск (Dockerfile сам делает npm ci и next build)"
"${SSH[@]}" "cd $DIR && docker compose build && docker compose up -d && docker image prune -f >/dev/null"
"${SSH[@]}" "docker ps --filter name=doors-shop --format '{{.Names}}  {{.Status}}  {{.Ports}}'"
echo "Готово: $SITE_URL"
