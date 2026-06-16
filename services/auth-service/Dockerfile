FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth-service/package.json ./services/auth-service/
RUN npm install --workspace=packages/shared --workspace=services/auth-service
COPY packages/shared/ ./packages/shared/
COPY services/auth-service/ ./services/auth-service/
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/auth-service

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/
COPY --from=builder /app/package.json ./
RUN npm install --workspace=services/auth-service --omit=dev
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "services/auth-service/dist/server.js"]
