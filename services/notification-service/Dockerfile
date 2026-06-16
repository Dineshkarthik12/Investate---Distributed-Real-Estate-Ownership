FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/notification-service/package.json ./services/notification-service/
RUN npm install --workspace=packages/shared --workspace=services/notification-service
COPY packages/shared/ ./packages/shared/
COPY services/notification-service/ ./services/notification-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/notification-service
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/notification-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3007
CMD ["node", "services/notification-service/dist/server.js"]
