FROM node:lts-alpine

WORKDIR /opt/app

COPY .output ./

ENV NITRO_PRESET=node_cluster

ENTRYPOINT ["node", "./server/index.mjs"]
