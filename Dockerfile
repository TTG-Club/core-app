FROM node:lts-alpine

WORKDIR /opt/app

RUN sed -i -e "/server\.listen/i server.keepAliveTimeout = 62 * 1000;\nserver.headersTimeout = 63 * 1000;" .output/server/chunks/runtime.mjs

COPY .output ./

ENV NITRO_PRESET=node_cluster

ENTRYPOINT ["node", "./server/index.mjs"]
