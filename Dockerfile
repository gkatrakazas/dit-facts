FROM node:22-bullseye-slim AS builder-base

RUN apt-get update -y && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

COPY package.json yarn.lock .
RUN yarn cache clean -f && yarn install --frozen-lockfile

FROM node:22-bullseye-slim AS builder

RUN apt-get update -y && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app
COPY --from=builder-base /home/node/app/node_modules/ ./node_modules/
COPY . .
RUN yarn build

FROM nginx:alpine AS deploy

WORKDIR /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /home/node/app/build/ .

EXPOSE 80

CMD nginx -g "daemon off;"
