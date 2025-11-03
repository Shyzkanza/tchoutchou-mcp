# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY web/package*.json ./web/

# Installer toutes les dépendances (y compris dev pour le build)
RUN npm ci
RUN cd web && npm ci

# Copier le code source
COPY . .

# Build du projet (serveur TypeScript + UI React)
RUN npm run build

# Stage production - Image finale minimale
FROM node:18-alpine

WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package*.json ./
COPY web/package*.json ./web/

# Installer uniquement les dépendances de production (sans exécuter les scripts de build)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
RUN cd web && npm ci --only=production --ignore-scripts && npm cache clean --force

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/dist ./web/dist

# Exposer le port de l'application
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck pour Docker/Traefik
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Utilisateur non-root pour la sécurité
USER node

# Démarrer le serveur HTTP
CMD ["node", "dist/http-server.js"]
