FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm && corepack install -g pnpm@latest-9

WORKDIR /app

FROM base AS build

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpx nuxi cleanup
RUN pnpx nuxi build

FROM base

COPY --from=build /app/.output/ ./

EXPOSE 3000

CMD ["node", "server/index.mjs"]
