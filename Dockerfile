FROM node:lts-alpine

WORKDIR /app

COPY . .

ENTRYPOINT ["npm", "start"]
