# ─── Build Stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
# install exact deps
COPY package.json package-lock.json ./
RUN npm ci

# copy source & build
COPY . .
RUN npm run build

# ─── Production Stage ──────────────────────────────────────────────────────────
FROM nginx:stable-alpine

# remove default content
# RUN rm -rf /usr/share/nginx/html/*

# copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# optional: copy a custom nginx.conf if you need rewrites, SPA fallback, etc.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s CMD wget --quiet --spider http://localhost/ || exit 1

# CMD ["nginx", "-g", "daemon off;"]
