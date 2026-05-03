FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
COPY wait-for-services.mjs ./wait-for-services.mjs

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/wait-for-services.mjs ./wait-for-services.mjs

EXPOSE 4001
CMD ["npm", "run", "start:prod"]