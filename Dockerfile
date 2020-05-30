FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["node", "lib/index.js"]
