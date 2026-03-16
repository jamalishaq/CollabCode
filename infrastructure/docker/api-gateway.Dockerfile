# =============================================================================
# api-gateway.Dockerfile
# Handles: JWT validation, rate limiting, request routing
# Runtime: Node.js (TypeScript / Fastify)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Dependencies
# Installs only production dependencies using pnpm workspaces.
# Shared packages (shared-types, shared-utils, shared-config) are resolved
# here so the build stage has access to them.
# -----------------------------------------------------------------------------
    FROM node:20-alpine AS deps

    # OpenSSL required by Prisma engine
    RUN apk add --no-cache openssl

    # Install pnpm globally
    RUN npm install -g pnpm@9 nodemon ts-node
    
    WORKDIR /app

    # Tell Prisma which engine to use — avoids runtime download
    ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
    
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
    COPY packages/shared-types/package.json ./packages/shared-types/
    COPY packages/shared-utils/package.json ./packages/shared-utils/
    COPY packages/shared-config/package.json ./packages/shared-config/
    COPY apps/api-gateway/package.json ./apps/api-gateway/
    
    # Install all dependencies including shared packages
    RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --shamefully-hoist
    
    # -----------------------------------------------------------------------------
    # Stage 2 — Build
    # Compiles TypeScript to JavaScript.
    # Builds shared packages first, then the service itself.
    # -----------------------------------------------------------------------------
    FROM deps AS builder

    # Copy shared package source and build them
    COPY tsconfig.json ./
    COPY packages/shared-types ./packages/shared-types
    COPY packages/shared-utils ./packages/shared-utils
    COPY packages/shared-config ./packages/shared-config
    RUN pnpm --filter shared-types build
    RUN pnpm --filter shared-utils build
    RUN pnpm --filter shared-config build
    
    # Copy service source and build
    COPY apps/api-gateway ./apps/api-gateway
    RUN pnpm --filter api-gateway build
    
    # Prune dev dependencies — keep only production deps for the final image
    RUN pnpm --filter api-gateway --prod deploy /app/pruned
    
    # -----------------------------------------------------------------------------
    # Stage 3 — Production
    # Minimal image containing only the compiled output and production deps.
    # -----------------------------------------------------------------------------
    FROM node:20-alpine AS production
    
    # Install security updates
    RUN apk update && apk upgrade && apk add --no-cache dumb-init
    
    # Create non-root user and group
    RUN addgroup -S appgroup && adduser -S appuser -G appgroup
    
    WORKDIR /app
    
    COPY --from=builder --chown=appuser:appgroup /app/pruned/node_modules ./node_modules
    COPY --from=builder --chown=appuser:appgroup /app/apps/api-gateway/dist ./dist
    COPY --from=builder --chown=appuser:appgroup /app/packages/shared-types/dist ./node_modules/shared-types/dist
    COPY --from=builder --chown=appuser:appgroup /app/packages/shared-utils/dist ./node_modules/shared-utils/dist
    COPY --from=builder --chown=appuser:appgroup /app/packages/shared-config/dist ./node_modules/shared-config/dist
    
    USER appuser
    
    EXPOSE $PORT
    
    # dumb-init ensures proper signal handling (SIGTERM for graceful shutdown)
    CMD ["dumb-init", "node", "dist/index.js"]
    