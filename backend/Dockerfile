# ─────────────────────────────────────────────────────────────
# ResQNet Backend — Multi-stage Dockerfile
# ─────────────────────────────────────────────────────────────

# ─── Base ─────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ─── Development ──────────────────────────────────────────────
FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# ─── Build ────────────────────────────────────────────────────
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ─── Production ───────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Run as non-root user
RUN addgroup -g 1001 -S resqnet && \
    adduser -S resqnet -u 1001
USER resqnet

EXPOSE 5001
CMD ["node", "dist/server.js"]
