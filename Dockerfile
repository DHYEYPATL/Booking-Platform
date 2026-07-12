# ==========================================
# 1. BUILD STAGE
# ==========================================
FROM node:20-alpine AS build

# Create application directory
WORKDIR /usr/src/app

# Set ownership to node user
RUN chown -R node:node /usr/src/app

# Copy dependency manifests
COPY --chown=node:node package*.json ./

# Install development & build dependencies
RUN npm ci

# Copy source bundle
COPY --chown=node:node . .

# Compile TypeScript code to JS
RUN npm run build

# Remove development dependencies to keep output light
RUN npm prune --production

# ==========================================
# 2. RUNTIME STAGE
# ==========================================
FROM node:20-alpine AS production

# Create application directory
WORKDIR /usr/src/app

# Set ownership to node user
RUN chown -R node:node /usr/src/app

# Copy production node_modules and built code
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Run as non-root user for security
USER node

# Expose server port
EXPOSE 3000

# Container Healthcheck referencing the Terminus health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the NestJS application
CMD ["node", "dist/main.js"]
