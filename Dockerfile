FROM node:14

ENV NODE_ENV='production'

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV DB_HOST=${DB_HOST}
ENV JWT_SECRET=${JWT_SECRET}

EXPOSE 5432

CMD ["npm", "start"]
