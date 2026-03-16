# =============================================================================
# execution-service.Dockerfile
# Handles: Sandboxed code execution via Docker-in-Docker
# Runtime: Go 1.22
# IMPORTANT: This service spawns Docker containers to run user code.
#            It requires access to the Docker socket — handled via
#            Render's environment configuration, NOT baked into the image.
#
# Security constraints enforced per .cursor/rules:
#   - Execution containers: no network, 0.5 CPU, 128MB RAM, 10s timeout
#   - Non-root user in spawned containers
#   - Containers destroyed immediately after execution
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Build
# -----------------------------------------------------------------------------
    FROM golang:1.25-alpine AS builder

    # git + ca-certificates + docker CLI (needed to call Docker API at runtime)
    RUN apk add --no-cache git ca-certificates tzdata

    # Install air for hot reload in dev mode
    RUN go install github.com/air-verse/air@latest
    
    WORKDIR /app
    
    COPY apps/execution-service/go.mod ./
    COPY apps/execution-service/go.sum ./
    
    RUN go mod download
    RUN go mod verify
    
    COPY apps/execution-service ./
    
    # Build static binary
    RUN CGO_ENABLED=0 GOOS=linux go build \
        -ldflags="-w -s" \
        -trimpath \
        -o /app/server \
        ./cmd/server

    # Build the healthcheck binary
    RUN CGO_ENABLED=0 GOOS=linux go build -o /app/healthcheck ./cmd/healthcheck
    
    # -----------------------------------------------------------------------------
    # Stage 2 — Production
    # Uses alpine (not distroless) because the Docker CLI must be available
    # at runtime to spawn sandboxed execution containers.
    # Still uses non-root user — Docker socket access is granted via group
    # membership, not by running as root.
    # -----------------------------------------------------------------------------
    FROM alpine:3.19 AS production
    
    # Security updates + Docker CLI + dumb-init for signal handling
    RUN apk update && apk upgrade && \
        apk add --no-cache \
        ca-certificates \
        tzdata \
        docker-cli \
        dumb-init
    
    # Create non-root user
    RUN addgroup -S appgroup && adduser -S appuser -G appgroup
    
    # Add appuser to docker group so it can access the Docker socket
    # The socket itself is mounted at runtime — not baked into the image
    RUN addgroup docker || true && adduser appuser docker
    
    WORKDIR /app
    
    # Copy compiled binary
    COPY --from=builder --chown=appuser:appgroup /app/server /server

    # Copy the health check binary
    COPY --from=builder --chown=appuser:appgroup /app/healthcheck /healthcheck
    
    # Copy CA certs
    COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
    
    USER appuser
    
    EXPOSE $PORT
    
    # dumb-init ensures SIGTERM is forwarded to the Go process
    # This allows graceful shutdown — in-flight executions are allowed to finish
    CMD ["dumb-init", "/server"]
    