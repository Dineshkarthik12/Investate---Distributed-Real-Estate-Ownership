FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/marketplace-service/package.json ./services/marketplace-service/
RUN npm install --workspace=packages/shared --workspace=services/marketplace-service
COPY packages/shared/ ./packages/shared/
COPY services/marketplace-service/ ./services/marketplace-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/marketplace-service
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/marketplace-service/dist ./services/marketplace-service/dist
COPY --from=builder /app/services/marketplace-service/package.json ./services/marketplace-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/marketplace-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3006
CMD ["node", "services/marketplace-service/dist/server.js"]
