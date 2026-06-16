FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/file-service/package.json ./services/file-service/
RUN npm install --workspace=packages/shared --workspace=services/file-service
COPY packages/shared/ ./packages/shared/
COPY services/file-service/ ./services/file-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/file-service
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/file-service/dist ./services/file-service/dist
COPY --from=builder /app/services/file-service/package.json ./services/file-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/file-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3008
CMD ["node", "services/file-service/dist/server.js"]
