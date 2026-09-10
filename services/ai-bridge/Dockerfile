FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json tsconfig.json ./
COPY services/ai-bridge/package.json ./services/ai-bridge/
COPY services/ai-bridge ./services/ai-bridge
COPY config ./config

RUN npm install --prefix services/ai-bridge

ENV NODE_ENV=production
ENV AI_BRIDGE_PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "services/ai-bridge/src/server.ts"]
