FROM node:17

ENV NODE_ENV='production'

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5432

CMD ["npm", "start"]
