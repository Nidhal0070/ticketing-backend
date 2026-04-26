# ╔════════════════════════════════════════════════════════════════╗
# ║           Backend Dockerfile - Multi-stage (Optimisé)            ║
# ║  Build: node:20-alpine | Production: node:20-slim (stable)       ║
# ╚════════════════════════════════════════════════════════════════╝

# ─────────────────────────────────────────────────────────────────
# STAGE 1: Builder
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app



# ⚙️ Configuration npm pour éviter les timeouts réseau
RUN npm config set fetch-timeout=120000 && \
    npm config set fetch-retry-mintimeout=20000 && \
    npm config set fetch-retry-maxtimeout=120000


# 📦 Copier package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# 📥 Installer les dépendances
RUN npm ci && \
    npm cache clean --force && \
    rm -rf /tmp/* /root/.npm

# 🔨 Copier et compiler la source
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# STAGE 2: Production (node:20-slim = stable et petit)
# ─────────────────────────────────────────────────────────────────
FROM node:20-slim

LABEL maintainer="ticketing@example.com"
LABEL version="1.0"
LABEL description="Backend NestJS - API Ticketing"

# 🔐 Créer un utilisateur non-root (sécurité)
RUN groupadd -r -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# 📍 Dossier de travail
WORKDIR /app

# 📥 Installer uniquement curl pour healthcheck (stable qu'Alpine)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# 📂 Copier depuis le builder (avec ownership correct)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 🔒 Changer l'utilisateur (avant CMD et HEALTHCHECK)
USER nodejs

# 🌐 Exposer le port
EXPOSE 3000

# ❤️ Healthcheck - teste la disponibilité de l'API
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/users || exit 1

# 🚀 Démarrer l'application
CMD ["node", "dist/main"]
