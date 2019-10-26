FROM node:12
WORKDIR /app
COPY . .
RUN npm install
ENV DB_HOST=${DB_HOST}
EXPOSE 5432
CMD ["node", "main.js"]
