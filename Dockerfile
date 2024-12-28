FROM node:lts-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm && corepack install -g pnpm@latest-9

WORKDIR /app

FROM base AS build

COPY .npmrc package.json pnpm-lock.yaml ./
COPY server/prisma/schema ./server/prisma/schema

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpx prisma generate
RUN pnpm run build

FROM base

COPY --from=build /app/.output/ ./
COPY --from=build /app/server/prisma/ ./prisma/
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

CMD ["node", "server/index.mjs"]

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
