FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/investment-service/package.json ./services/investment-service/
RUN npm install --workspace=packages/shared --workspace=services/investment-service
COPY packages/shared/ ./packages/shared/
COPY services/investment-service/ ./services/investment-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/investment-service
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/investment-service/dist ./services/investment-service/dist
COPY --from=builder /app/services/investment-service/package.json ./services/investment-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/investment-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3004
CMD ["node", "services/investment-service/dist/server.js"]
