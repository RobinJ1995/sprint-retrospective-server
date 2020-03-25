FROM node:13
WORKDIR /app
COPY . .
RUN npm install
ENV DB_HOST=${DB_HOST}
ENV JWT_SECRET=${JWT_SECRET}
EXPOSE 5432
CMD ["node", "main.js"]
