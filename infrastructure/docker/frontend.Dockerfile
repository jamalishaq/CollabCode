# =============================================================================
# Handles: React SPA with Monaco Editor — served as static files via Nginx
# Runtime: Vite build → Nginx static server
# Note: Vercel is the primary frontend host. This Dockerfile exists for:
#       - Local docker-compose development
#       - Fallback self-hosted deployment if needed
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Dependencies
# -----------------------------------------------------------------------------
    FROM node:20-alpine AS deps

    # Install pnpm globally
    RUN npm install -g pnpm@9
    
    WORKDIR /app
    
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
    COPY packages/shared-types/package.json ./packages/shared-types/
    COPY packages/shared-utils/package.json ./packages/shared-utils/
    COPY packages/shared-config/package.json ./packages/shared-config/
    COPY apps/frontend/package.json ./apps/frontend/

    # Install all dependencies including shared packages
    RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --shamefully-hoist
    
    # -----------------------------------------------------------------------------
    # Stage 2 — Build
    # Vite produces a static dist/ folder containing HTML, CSS, and JS bundles.
    # Build args are injected at build time for environment-specific API URLs.
    # VITE_ prefixed variables are embedded into the bundle at build time —
    # they are NOT secret. Real secrets must NEVER be VITE_ prefixed.
    # -----------------------------------------------------------------------------
    FROM deps AS builder
    
    # Build args for environment-specific config
    # These are set in the docker build command or CI pipeline
    ARG VITE_API_URL
    ARG VITE_WS_URL
    ARG BUILD_SHA=unknown
    
    ENV VITE_API_URL=$VITE_API_URL
    ENV VITE_WS_URL=$VITE_WS_URL
    ENV VITE_BUILD_SHA=$BUILD_SHA

    # Build shared packages
    COPY tsconfig.json ./
    COPY packages/shared-types ./packages/shared-types
    COPY packages/shared-utils ./packages/shared-utils
    COPY packages/shared-config ./packages/shared-config
    RUN pnpm --filter shared-types build
    RUN pnpm --filter shared-utils build
    RUN pnpm --filter shared-config build
    
    # Copy frontend source and build
    COPY apps/frontend ./apps/frontend
    RUN pnpm --filter frontend build
    # Output is at apps/frontend/dist/


    # Stage 2.5 — Dev
    # Serves the frontend with Vite dev server and HMR
    FROM deps AS dev

    WORKDIR /app

    # Copy shared packages source (needed for TypeScript resolution)
    COPY tsconfig.json ./
    COPY packages/shared-types ./packages/shared-types
    COPY packages/shared-utils ./packages/shared-utils
    COPY packages/shared-config ./packages/shared-config

    # Build shared packages so imports resolve
    RUN pnpm --filter shared-types build
    RUN pnpm --filter shared-utils build
    RUN pnpm --filter shared-config build

    # Copy frontend source
    COPY apps/frontend ./apps/frontend

    # Default command — runs Vite dev server
    CMD ["pnpm", "--filter", "frontend", "dev"]
    
    # -----------------------------------------------------------------------------
    # Stage 3 — Production (Nginx)
    # Serves the compiled static assets via Nginx.
    # The nginx.conf.template file is COPY'd in — no heredoc needed.
    # envsubst replaces ${PORT} in the template at container startup.
    # -----------------------------------------------------------------------------
    FROM nginx:1.25-alpine AS production
    
    # Install envsubst (ships in gettext package) for dynamic PORT substitution
    RUN apk add --no-cache gettext
    
    # Remove default Nginx config
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Copy the nginx config template from the build context.
    # This file lives at: infrastructure/docker/nginx.conf.template
    # envsubst replaces ${PORT} with the actual value at container startup.
    COPY infrastructure/docker/nginx.conf.template /etc/nginx/templates/app.conf.template
    
    # Copy compiled frontend assets from builder stage
    COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
    
    EXPOSE $PORT
    
    # At container startup:
    # 1. envsubst replaces ${PORT} in the template → writes final config
    # 2. nginx starts in foreground (daemon off; required for Docker PID 1)
    CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/app.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]    