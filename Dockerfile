FROM node:lts-alpine

WORKDIR /opt/app

COPY .output ./

ENTRYPOINT ["node", "./server/index.mjs"]
