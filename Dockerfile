FROM node:lts-alpine

WORKDIR /app

COPY . .

ENTRYPOINT ["node", ".output/server/index.mjs"]
