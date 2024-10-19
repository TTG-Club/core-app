FROM node:lts-alpine

WORKDIR /app

COPY . .

ENTRYPOINT ["dumb-init", "npm", "start"]
