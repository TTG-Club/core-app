FROM node:lts-alpine

WORKDIR /opt/app

COPY .output ./

ENV NITRO_PRESET=node_cluster
ENV NITRO_NODE_KEEPALIVE_TIMEOUT=60000

ENTRYPOINT ["node", "./server/index.mjs"]
