FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

FROM base AS build

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm nuxt cleanup
RUN pnpm nuxt build

FROM base

COPY --from=build /app/.output/ ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
