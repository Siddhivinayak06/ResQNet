# ─────────────────────────────────────────────────────────────
# ResQNet Frontend — Multi-stage Dockerfile
# ─────────────────────────────────────────────────────────────

# ─── Base ─────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ─── Development ──────────────────────────────────────────────
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000
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

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN addgroup -g 1001 -S resqnet && \
    adduser -S resqnet -u 1001
USER resqnet

EXPOSE 3000
CMD ["node", "server.js"]
