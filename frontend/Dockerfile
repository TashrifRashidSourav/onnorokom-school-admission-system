# syntax=docker/dockerfile:1

# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Generates config.js from API_URL each time the container starts.
COPY --chmod=755 docker-entrypoint.d/40-write-config.sh /docker-entrypoint.d/
ENV API_URL=http://localhost:8080
EXPOSE 80
