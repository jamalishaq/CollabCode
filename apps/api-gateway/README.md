# api-gateway

Single entrypoint service for CollabCode. It performs JWT verification, request hardening,
and forwards traffic to downstream services.

## Endpoints

- `GET /health`

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies with `pnpm install`.
3. Start in dev mode with `pnpm run dev`.
