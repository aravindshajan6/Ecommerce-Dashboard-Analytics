# syntax=docker/dockerfile:1
# Stage 1 — build the SPA. VITE_BACKEND_URL is intentionally left empty so the app
# calls same-origin /api, which nginx proxies to the API container (no CORS involved).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_BACKEND_URL=""
RUN npm run build

# Stage 2 — serve. Final image contains nginx + static files only, no node/npm.
FROM nginx:alpine AS runtime
RUN apk add --no-cache curl
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=4s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
