FROM node:lts-alpine

ENV NPM_CONFIG_LOGLEVEL info

WORKDIR /app

COPY . .

ENTRYPOINT ["npm", "--loglevel=warn", "start", " --verbose"]
