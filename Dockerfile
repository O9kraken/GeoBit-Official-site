# Сборка идёт в GitHub Actions; на сервер приезжает готовый образ (~250 МБ),
# поэтому VPS с 1–2 ГБ памяти не нужно ничего компилировать.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_SERVER_URL=https://getgeobit.ru
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    # база при сборке не нужна: все страницы рендерятся по запросу
    DATABASE_URI=postgres://build:build@127.0.0.1:1/build \
    PAYLOAD_SECRET=build-time-placeholder-secret
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# основной CSS собирается из style.css + geobit.css (убираются неиспользуемые правила)
RUN node scripts/build-css.mjs && NODE_OPTIONS=--max-old-space-size=3072 npx next build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 MEDIA_DIR=/app/media
RUN groupadd -g 1001 app && useradd -u 1001 -g app -m app && mkdir -p /app/media && chown app:app /app/media
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
