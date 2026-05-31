# ---- builder ----
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --filter backend --frozen-lockfile

COPY apps/backend/ ./apps/backend/
RUN pnpm --filter backend build

# ---- production ----
FROM node:20-alpine AS production
RUN apk add --no-cache libstdc++
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

WORKDIR /app
COPY --from=builder --chown=app:app /app/apps/backend/dist ./dist
COPY --from=builder --chown=app:app /app/apps/backend/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/backend/package.json ./
RUN mkdir -p /app/data && chown app:app /app/data

ENV NODE_ENV=production
USER app
EXPOSE 3000
CMD ["node", "dist/main"]
