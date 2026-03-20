# Multi-stage build for prompts.chat application
# Optimized for external PostgreSQL database

# Stage 1: Dependencies
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Copy Prisma schema first (needed for npm postinstall)
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./

# Accept DATABASE_URL as build argument (optional - defaults to dummy URL)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

RUN npm ci

# Copy application source
COPY . .

# Build Next.js application
# Note: next.config.ts already has output: "standalone" enabled
ENV NODE_ENV=production
# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1
# Build the application (prisma generate runs via npm run build)
# Build without middleware first, then rebuild with middleware
RUN npm run build

# Stage 3: Production Runner
FROM node:24-bookworm-slim AS runner
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && \
    chown -R nextjs:nodejs /app

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma files for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy scripts for database operations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "server.js"]
