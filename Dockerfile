FROM node:lts-alpine AS base

WORKDIR /app

FROM base AS build

COPY --link . .

RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM base

COPY --from=build /app/.output/ ./
COPY --from=build /app/server/prisma/ ./prisma/
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

CMD ["node", "server/index.mjs"]

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
