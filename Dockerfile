FROM node:14.4.0 as builder

WORKDIR /usr/src

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --production && rm -r src && rm tsconfig.json

FROM node:14.4.0-stretch-slim as runtime

WORKDIR /nodeapp
ENV NODE_ENV=production

COPY --from=builder /usr/src /nodeapp

EXPOSE 5000

CMD ["node", "app/index.js"]
