# Build context: repository root (client.ui). Example:
#   docker build -f apps/web/Dockerfile -t lp-web .
# ============================================
# Stage 1: Install dependencies
# ============================================
ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages ./packages

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build the Next.js application
# ============================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

COPY --from=dependencies /repo/node_modules ./node_modules
COPY --from=dependencies /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env vars — override with --build-arg
ARG NEXT_PUBLIC_SENTRY_DISABLED=true
ARG CORE_API_URL=http://core-api:8080

ENV BUILD_STANDALONE=true

RUN pnpm --filter @lp/web build

# ============================================
# Stage 3: Production runner
# ============================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /repo/apps/web/public ./apps/web/public
RUN mkdir -p apps/web/.next && chown -R node:node apps

# standalone output of a workspace app keeps the monorepo layout
COPY --from=builder --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
