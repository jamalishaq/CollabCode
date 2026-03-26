# API Gateway

Single entry point for all client HTTP requests. Responsible for JWT
validation, rate limiting, request routing, and proxying to downstream
services. No business logic lives here.

---

## Responsibilities

- Validate JWT tokens on every incoming authenticated request
- Rate limit requests per authenticated user and per IP address
- Proxy validated requests to the correct downstream service
- Inject `x-user-id` and `x-user-email` headers so downstream services
  know the caller without re-validating the token
- Centralise CORS policy, security headers, and request logging
- Exempt public routes (register, login, OAuth) from JWT validation

---

## Routing Table

| Method | Path Pattern | Proxied To | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | auth-service | No |
| `POST` | `/auth/login` | auth-service | No |
| `POST` | `/auth/refresh` | auth-service | No |
| `GET` | `/auth/github` | auth-service | No |
| `GET` | `/auth/github/callback` | auth-service | No |
| `GET` | `/auth/google` | auth-service | No |
| `GET` | `/auth/google/callback` | auth-service | No |
| `GET` | `/auth/me` | auth-service | Yes |
| `POST` | `/auth/logout` | auth-service | Yes |
| `*` | `/workspaces/*` | workspace-service | Yes |
| `*` | `/projects/*` | file-service | Yes |
| `POST` | `/execute` | execution-service | Yes |
| `GET` | `/health` | gateway itself | No |

WebSocket connections to `/collaborate/:documentId` connect directly to
collaboration-service from the frontend — they do not go through the
API Gateway.

---

## Endpoints

### GET `/health`
Gateway liveness check. Does not check downstream service health.

**Response `200`:**
```json
{
  "data": {
    "status": "ok",
    "uptime": 3600,
    "service": "api-gateway"
  },
  "error": null
}
```

---

### All Proxied Routes

**On successful JWT validation**, the gateway forwards the original request
to the target service with two additional headers injected:
```
x-user-id:    <userId from JWT payload>
x-user-email: <email from JWT payload>
```

**On JWT validation failure**, the gateway returns immediately without
forwarding:
```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "statusCode": 401
  }
}
```

**On rate limit exceeded:**
```json
{
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 60 seconds.",
    "statusCode": 429,
    "retryAfter": 60
  }
}
```

---

## Service Communication
```
                        ┌─────────────────┐
Client Request          │   API Gateway   │
─────────────────────►  │                 │
                        │ 1. Validate JWT  │──► auth-service POST /auth/validate
                        │ 2. Rate limit    │──► Redis
                        │ 3. Inject userId │
                        │ 4. Proxy request │──► target service
                        └─────────────────┘
```

### JWT Validation Call (internal)

The gateway calls auth-service to validate tokens before proxying:

**POST `{AUTH_SERVICE_URL}/auth/validate`**

**Request:**
```json
{
  "token": "eyJ..."
}
```

**Response `200`:**
```json
{
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "iat": 1700000000,
    "exp": 1700003600
  },
  "error": null
}
```

**Response `401`:**
```json
{
  "data": null,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired",
    "statusCode": 401
  }
}
```

---

## Rate Limiting

Uses Redis sliding window algorithm. Two separate limits are enforced:

| Scope | Limit | Window |
|---|---|---|
| Authenticated user | 100 requests | 60 seconds |
| Unauthenticated IP | 30 requests | 60 seconds |
| `/execute` endpoint | 10 requests | 60 seconds |

**Redis key patterns:**
```
ratelimit:user:{userId}:{windowMinute}
ratelimit:ip:{ipAddress}:{windowMinute}
ratelimit:execute:{userId}:{windowMinute}
```

Each key uses INCR with a 60-second TTL. If the counter exceeds the
limit the request is rejected with 429 and a `Retry-After` header.

---

## Concurrency Control

- Rate limiting uses atomic Redis INCR — concurrent increments from the
  same user are handled correctly without race conditions
- The gateway itself is stateless — all state lives in Redis
- JWT validation results are not cached — every request validates freshly
  to ensure revoked tokens are caught immediately

---

## Low Level Design

### Folder Structure
```
src/
├── config/
│   └── index.ts                — Zod env schema, service URLs, rate limit config
├── controllers/
│   └── health.controller.ts    — Returns gateway status and uptime
├── services/
│   └── proxy.service.ts        — Forwards requests to downstream services
│   └── auth.service.ts         — Calls auth-service to validate JWT tokens
│   └── ratelimit.service.ts    — Redis sliding window rate limiter
├── middleware/
│   └── auth.middleware.ts      — JWT validation, injects x-user-id header
│   └── ratelimit.middleware.ts — Rate limit check per user and IP
│   └── error.middleware.ts     — Global error handler, formats error response
├── routes/
│   └── index.ts                — Proxy route registration for all services
│   └── health.route.ts         — Health check route
├── utils/
│   └── catch-async.ts          — Wraps async handlers to forward errors
└── index.ts                    — Server bootstrap, plugin registration
```

### Controllers
| Name | Description |
|---|---|
| `HealthController.check` | Returns `{ status: ok, uptime }` |

### Middleware
| Name | Description |
|---|---|
| `AuthMiddleware` | Extracts Bearer token, calls auth-service, injects x-user-id, returns 401 on failure |
| `RateLimitMiddleware` | Increments Redis counter, returns 429 with retryAfter if exceeded |
| `ErrorMiddleware` | Catches all thrown errors, maps to standard error response shape |

### Services
| Name | Description |
|---|---|
| `ProxyService.forward` | Copies request method, headers, and body to target URL |
| `ProxyService.getTargetUrl` | Maps incoming path to downstream service base URL |
| `AuthService.validate` | POST to auth-service /auth/validate, returns decoded payload |
| `RateLimitService.check` | INCR Redis key, compares to limit, returns allow or deny |
| `RateLimitService.buildKey` | Constructs rate limit Redis key from userId or IP and window |

---

## Security

- All responses include security headers via `helmet`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
- CORS is configured to allow only the frontend origin
- JWT tokens are never logged — only the decoded `userId` is logged
- Downstream service URLs are internal Docker network hostnames —
  never exposed to clients

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the gateway listens on (default 3000) |
| `REDIS_URL` | Upstash Redis TLS connection string (`rediss://`) |
| `JWT_SECRET` | Used as fallback for local JWT verification |
| `AUTH_SERVICE_URL` | Internal URL of auth-service |
| `WORKSPACE_SERVICE_URL` | Internal URL of workspace-service |
| `FILE_SERVICE_URL` | Internal URL of file-service |
| `NOTIFICATION_SERVICE_URL` | Internal URL of notification-service |
| `COLLABORATION_SERVICE_URL` | Internal WebSocket URL of collaboration-service |
| `EXECUTION_SERVICE_URL` | Internal URL of execution-service |
| `LOGTAIL_SOURCE_TOKEN` | Logtail token for structured log shipping |