FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    DELAY_MS=400 \
    DELAY_JITTER=200 \
    FAILURE_RATE=0 \
    OFFLINE_MODE=false

CMD ["node", "src/app.js"]
