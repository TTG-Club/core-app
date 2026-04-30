FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY --link package.json pnpm-lock.yaml ./
COPY --link .npmrc* pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
COPY --link . .
RUN pnpm nuxt prepare
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm nuxt build

FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S nodeapp && adduser -u 1001 -S nodeapp -G nodeapp
USER nodeapp

COPY --from=build --chown=1001:1001 --link /app/.output ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
