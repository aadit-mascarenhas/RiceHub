# Rice Hub frontend (Experiment 7) — multi-stage build.
# Stage 1: build the Vite bundle with Node. Stage 2: serve it with nginx.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite bakes import.meta.env at build time, so the API base URL is a build ARG.
# Default matches the dev seam in src/data/mockApi.js: the browser calls the
# backend directly on the host-published port 5000 (CORS_ORIGIN allows 5173).
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Stage 2: static file server with SPA history fallback.
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
