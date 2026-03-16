# =============================================================================
# collaboration-service.Dockerfile
# Handles: WebSocket connections, real-time CRDT sync (Yjs), presence tracking
# Runtime: Go 1.22
# Note: Go produces a single statically linked binary — final image is minimal
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — Build
# Uses the official Go image to compile the service into a static binary.
# CGO is disabled to produce a fully static binary that runs on scratch/alpine
# without needing shared C libraries.
# -----------------------------------------------------------------------------
    FROM golang:1.25-alpine AS builder

    # Install git (required by some go modules) and ca-certificates
    RUN apk add --no-cache git ca-certificates tzdata

    # Install air for hot reload in dev mode
    RUN go install github.com/air-verse/air@latest
    
    WORKDIR /app
    
    COPY apps/collaboration-service/go.mod ./
    COPY apps/collaboration-service/go.sum ./
    
    RUN go mod download
    RUN go mod verify
    
    COPY apps/collaboration-service ./
    
    # Build the static binary
    # CGO_ENABLED=0   — fully static binary, no C dependencies
    # GOOS=linux      — target Linux (Render runs Linux containers)
    # -ldflags        — strip debug info to reduce binary size
    # -trimpath       — remove local file paths from the binary
    RUN CGO_ENABLED=0 GOOS=linux go build \
        -ldflags="-w -s" \
        -trimpath \
        -o /app/server \
        ./cmd/server

    # Build the healthcheck binary
    RUN CGO_ENABLED=0 GOOS=linux go build -o /app/healthcheck ./cmd/healthcheck
    
    # -----------------------------------------------------------------------------
    # Stage 2 — Production
    # Uses distroless/static — no shell, no package manager, minimal attack surface.
    # Only the compiled binary and CA certificates are included.
    # distroless runs as nonroot by default
    # -----------------------------------------------------------------------------
    FROM gcr.io/distroless/static-debian12:nonroot AS production
    
    # Copy CA certificates for HTTPS outbound calls (Upstash Redis TLS)
    COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
    
    # Copy timezone data
    COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
    
    # Copy the compiled binary only
    COPY --from=builder --chown=nonroot:nonroot /app/server /server

    # Copy the health check binary
    COPY --from=builder --chown=nonroot:nonroot /app/healthcheck /healthcheck
    
    EXPOSE $PORT
    
    ENTRYPOINT ["/server"]
    