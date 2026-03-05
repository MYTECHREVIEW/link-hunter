# ── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Runtime Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S hunter && adduser -S hunter -G hunter

COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN chown -R hunter:hunter /app
USER hunter

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3100/api/health || exit 1

CMD ["node", "server.js"]
