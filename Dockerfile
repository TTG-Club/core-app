FROM node:lts-alpine

WORKDIR /app

COPY .output/ ./

ENTRYPOINT ["node", "server/index.mjs"]
