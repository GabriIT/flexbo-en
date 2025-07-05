# ---------- Build stage ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    RUN npm run build         # creates dist/
    
    # ---------- Runtime stage ----------
    FROM nginx:stable-alpine
    
    # Remove default Nginx site
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Copy custom Nginx config (see below)
    COPY nginx.conf /etc/nginx/conf.d/app.conf
    
    # Copy Vite build output to html root
    COPY --from=builder /app/dist /usr/share/nginx/html
    