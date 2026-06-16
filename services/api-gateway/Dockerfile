FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY services/api-gateway/package.json ./services/api-gateway/
RUN npm install --workspace=services/api-gateway
COPY services/api-gateway/ ./services/api-gateway/
RUN npm run build --workspace=services/api-gateway
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/api-gateway --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "services/api-gateway/dist/server.js"]
