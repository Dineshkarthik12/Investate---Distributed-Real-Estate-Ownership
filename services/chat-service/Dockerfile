FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/chat-service/package.json ./services/chat-service/
RUN npm install --workspace=packages/shared --workspace=services/chat-service
COPY packages/shared/ ./packages/shared/
COPY services/chat-service/ ./services/chat-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/chat-service
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/chat-service/dist ./services/chat-service/dist
COPY --from=builder /app/services/chat-service/package.json ./services/chat-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/chat-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3005
CMD ["node", "services/chat-service/dist/server.js"]
