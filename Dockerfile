# Самодостаточный образ: сборка и запуск происходят в Docker, отдельный шаг сборки на хосте не нужен.
# Используется и на Render (сборка из git-репозитория), и на VPS (см. deploy.sh).

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Все страницы отмечены `dynamic = 'force-dynamic'`, поэтому сборка не должна обращаться к базе.
# Секрет и путь к базе здесь на случай, если Payload всё же что-то инициализирует во время сборки:
# они одноразовые, не совпадают с боевыми и ни на что в готовом образе не влияют.
ENV PAYLOAD_SECRET=build-time-only-not-used-in-production
ENV DATABASE_URL=file:./build-time-placeholder.db
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Демо-данные: готовая база и фото дверей, собранные заранее (npm run seed). Каждый деплой начинает с них заново —
# значит, заявки, оставленные во время демонстрации, при следующем деплое пропадут. Для боевого сайта тут нужен
# постоянный диск (Render: платный план + Disk) или отдельная база вместо SQLite.
COPY --from=builder --chown=nextjs:nodejs /app/deploy/doors.db ./data/doors.db
COPY --from=builder --chown=nextjs:nodejs /app/deploy/media ./media
RUN mkdir -p data media && chown -R nextjs:nodejs data media

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
