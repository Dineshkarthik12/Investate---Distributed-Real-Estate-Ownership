FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/token-service/package.json ./services/token-service/
RUN npm install --workspace=packages/shared --workspace=services/token-service
COPY packages/shared/ ./packages/shared/
COPY services/token-service/ ./services/token-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/token-service

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/token-service/dist ./services/token-service/dist
COPY --from=builder /app/services/token-service/package.json ./services/token-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/token-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3003
CMD ["node", "services/token-service/dist/server.js"]
