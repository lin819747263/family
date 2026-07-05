FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/uploads/photos /app/uploads/receipts /app/backups

EXPOSE 3000

CMD ["node", "app.js"]
