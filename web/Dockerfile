# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps · dependencies only, cached on the lockfile
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# dev · hot reload. The source arrives via bind mount; node_modules is kept
# alive by the anonymous volume declared in docker-compose.yml.
# ---------------------------------------------------------------------------
FROM deps AS dev
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

# ---------------------------------------------------------------------------
# builder · production build
# ---------------------------------------------------------------------------
FROM deps AS builder
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# runner · standalone output, non-root
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ---------------------------------------------------------------------------
# fonts · one-off tool that downloads and subsets the typefaces of §02.
# Not part of any build: the .woff2 it produces are committed (ADR-0006).
# ---------------------------------------------------------------------------
FROM python:3.13-slim AS fonts
WORKDIR /app
RUN pip install --no-cache-dir fonttools==4.60.1 brotli==1.1.0
CMD ["python", "scripts/fetch_fonts.py"]

# ---------------------------------------------------------------------------
# e2e · Playwright with browsers preinstalled. Kept apart from the dev stage on
# purpose: this image is ~2GB and has no business in the daily build loop.
# The tag must track the @playwright/test version in package.json.
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS e2e
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    CI=true
COPY package.json package-lock.json ./
RUN npm ci
CMD ["npx", "playwright", "test"]
