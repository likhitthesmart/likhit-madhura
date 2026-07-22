FROM node:24-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

FROM node:24-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4000
# sync schema, seed demo data on first boot, start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/seed.js --if-empty; node dist/index.js"]
