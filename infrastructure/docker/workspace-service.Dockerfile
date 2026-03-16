# =============================================================================
# workspace-service.Dockerfile
# Handles: Workspace and project CRUD, membership, RBAC roles
# Runtime: Node.js (TypeScript / Fastify)
# Extra: Prisma client generated at build time
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Dependencies
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
    COPY apps/workspace-service/package.json ./apps/workspace-service/
    
    # Install all dependencies including shared packages
    RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --shamefully-hoist
    
    # -----------------------------------------------------------------------------
    # Stage 2 — Build
    # -----------------------------------------------------------------------------
    FROM deps AS builder

    COPY tsconfig.json ./
    COPY packages/shared-types ./packages/shared-types
    COPY packages/shared-utils ./packages/shared-utils
    COPY packages/shared-config ./packages/shared-config
    RUN pnpm --filter shared-types build
    RUN pnpm --filter shared-utils build
    RUN pnpm --filter shared-config build
    
    COPY apps/workspace-service ./apps/workspace-service
    
    # Generate Prisma client
    RUN cd apps/workspace-service && /app/node_modules/.bin/prisma generate
    
    # Compile TypeScript
    RUN pnpm --filter workspace-service build
    
    # Prune to production deps only
    RUN pnpm --filter workspace-service --prod deploy /app/pruned
    
    # -----------------------------------------------------------------------------
    # Stage 3 — Production
    # -----------------------------------------------------------------------------
    FROM node:20-alpine AS production
    
    RUN apk update && apk upgrade && apk add --no-cache dumb-init
    
    RUN addgroup -S appgroup && adduser -S appuser -G appgroup
    
    WORKDIR /app
    
    COPY --from=builder --chown=appuser:appgroup /app/pruned/node_modules ./node_modules
    COPY --from=builder --chown=appuser:appgroup /app/apps/workspace-service/dist ./dist
    COPY --from=builder --chown=appuser:appgroup /app/apps/workspace-service/prisma ./prisma
    COPY --from=builder --chown=appuser:appgroup /app/packages/shared-types/dist ./node_modules/shared-types/dist
    COPY --from=builder --chown=appuser:appgroup /app/packages/shared-utils/dist ./node_modules/shared-utils/dist
    COPY --from=builder --chown=appuser:appgroup /app/packages/shared-config/dist ./node_modules/shared-config/dist
    
    USER appuser
    
    EXPOSE $PORT
    
    CMD ["dumb-init", "node", "dist/index.js"]
    