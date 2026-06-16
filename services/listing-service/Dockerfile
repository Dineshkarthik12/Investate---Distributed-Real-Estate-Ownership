FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/listing-service/package.json ./services/listing-service/
RUN npm install --workspace=packages/shared --workspace=services/listing-service
COPY packages/shared/ ./packages/shared/
COPY services/listing-service/ ./services/listing-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/listing-service

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/listing-service/dist ./services/listing-service/dist
COPY --from=builder /app/services/listing-service/package.json ./services/listing-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/listing-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "services/listing-service/dist/server.js"]
