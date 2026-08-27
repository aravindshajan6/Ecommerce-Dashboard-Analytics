# syntax=docker/dockerfile:1
# Analytics API. Serves only /api/* in the compose setup — nginx serves the SPA.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Production dependencies only; nodemon and friends stay out of the runtime image.
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3010
WORKDIR /app

# curl is used by the container HEALTHCHECK below.
RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY src ./src
COPY scripts ./scripts

# node:20-alpine ships an unprivileged `node` user (uid 1000) — never run as root.
USER node

EXPOSE 3010

# Compose gates the frontend on this becoming healthy.
HEALTHCHECK --interval=15s --timeout=4s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3010/api/health || exit 1

CMD ["node", "server.js"]
