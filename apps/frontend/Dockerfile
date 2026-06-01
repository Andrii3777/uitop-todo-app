# ---- builder ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --filter frontend --frozen-lockfile

COPY apps/frontend/ ./apps/frontend/
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter frontend build

# ---- production ----
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/frontend/package.json ./apps/frontend/
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --filter frontend --prod --frozen-lockfile

COPY --from=builder --chown=app:app /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=app:app /app/apps/frontend/public ./apps/frontend/public

ENV NODE_ENV=production
ENV PORT=3001
USER app
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "--port", "3001"]
