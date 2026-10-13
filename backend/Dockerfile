# Rice Hub backend (Experiment 7) — single-stage production image.
# Deps are pure JS (bcryptjs, not bcrypt), so alpine needs no build toolchain.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000

# Install dependencies first so source changes don't bust the npm cache layer.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# Run as the non-root user shipped with the node image.
USER node

EXPOSE 5000

# server.js exits(1) without JWT_SECRET and when MongoDB is unreachable —
# the container restart policy + compose healthcheck handle both.
CMD ["node", "server.js"]
