# Auth Service

Handles user registration, login, JWT issuance, token refresh, and OAuth2
authentication via GitHub and Google.

---

## Responsibilities

- Register new users with email and password
- Authenticate users and issue signed JWT access and refresh tokens
- Refresh access tokens using valid refresh tokens
- Revoke refresh tokens on logout
- OAuth2 login flow via GitHub and Google
- Validate JWT tokens on behalf of the API gateway

---

## Endpoints

### POST `/auth/register`
Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "Jamal Ishaq"
}
```

**Response `201`:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jamal Ishaq",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "error": null
}
```

---

### POST `/auth/login`
Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response `200`:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jamal Ishaq"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "error": null
}
```

---

### POST `/auth/refresh`
Issue a new access token using a valid refresh token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**
```json
{
  "data": {
    "accessToken": "eyJ..."
  },
  "error": null
}
```

---

### POST `/auth/logout`
Revoke the current refresh token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**
```json
{
  "data": { "success": true },
  "error": null
}
```

---

### GET `/auth/me`
Return the currently authenticated user. Requires `Authorization: Bearer <token>`.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jamal Ishaq",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

### GET `/auth/github`
Initiate GitHub OAuth2 flow. Redirects to GitHub authorization page.

### GET `/auth/github/callback`
GitHub OAuth2 callback. Exchanges code for tokens and returns JWT.

### GET `/auth/google`
Initiate Google OAuth2 flow.

### GET `/auth/google/callback`
Google OAuth2 callback.

---

### GET `/health`
Health check endpoint.

**Response `200`:**
```json
{
  "data": { "status": "ok", "uptime": 3600 },
  "error": null
}
```

---

## Service Communication

Auth service is called by the **API Gateway** to validate JWT tokens on
incoming requests. It does not call any other service.
```
Client
  │
  ▼
API Gateway ──► POST /auth/validate ──► Auth Service
                                             │
                                             ▼
                                        Returns decoded
                                        JWT payload or 401
```

### POST `/auth/validate` (internal — called by API Gateway only)

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

---

## Concurrency Control

Auth service is stateless between requests. Concurrent login attempts for the
same user are handled safely because:

- Password comparison uses `bcryptjs.compare` which is non-mutating
- Refresh token rotation uses a database transaction with a unique constraint
  on the token value — concurrent refresh attempts will result in one success
  and one `409 Conflict`
- Redis is used to store revoked tokens (blocklist) with TTL matching token
  expiry — checked on every `/auth/validate` call

---

## Low Level Design

### Folder Structure
```
src/
├── config/
│   └── index.ts          — Zod env schema, typed config export
├── controllers/
│   └── auth.controller.ts — HTTP handler, delegates to service, returns response
├── services/
│   └── auth.service.ts   — Business logic: register, login, refresh, logout
├── repositories/
│   └── user.repository.ts — Prisma queries for user CRUD
│   └── token.repository.ts — Prisma queries for refresh token storage
├── middleware/
│   └── auth.middleware.ts — JWT verification middleware
│   └── validate.middleware.ts — Zod request body validation
│   └── error.middleware.ts — Global error handler
├── routes/
│   └── auth.route.ts     — Route registration
│   └── health.route.ts   — Health check route
├── utils/
│   └── catch-async.ts    — Wraps async handlers to forward errors
└── index.ts              — Server bootstrap, plugin registration
```

### Controllers
| Name | Description |
|---|---|
| `AuthController.register` | Validates body, calls service, returns 201 with tokens |
| `AuthController.login` | Validates credentials, calls service, returns 200 with tokens |
| `AuthController.refresh` | Validates refresh token, returns new access token |
| `AuthController.logout` | Revokes refresh token, returns 200 |
| `AuthController.me` | Returns authenticated user from JWT payload |
| `AuthController.validate` | Internal endpoint for API Gateway JWT validation |

### Services
| Name | Description |
|---|---|
| `AuthService.register` | Hashes password, creates user, issues token pair |
| `AuthService.login` | Verifies password hash, issues token pair |
| `AuthService.refresh` | Validates refresh token, rotates it, issues new access token |
| `AuthService.logout` | Adds refresh token to Redis blocklist |
| `AuthService.validateToken` | Verifies JWT signature, checks Redis blocklist |
| `AuthService.generateTokenPair` | Creates signed access and refresh tokens |

### Repositories
| Name | Description |
|---|---|
| `UserRepository.create` | Insert new user record |
| `UserRepository.findByEmail` | Find user by email for login |
| `UserRepository.findById` | Find user by ID for /me endpoint |
| `TokenRepository.create` | Store refresh token with expiry |
| `TokenRepository.findByToken` | Look up refresh token for rotation |
| `TokenRepository.revoke` | Delete refresh token on logout |
| `TokenRepository.revokeAllForUser` | Revoke all tokens for a user |

---

## Database Schema
```prisma
model User {
  id           String         @id @default(uuid())
  email        String         @unique
  passwordHash String?
  name         String
  provider     String         @default("local")
  providerId   String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the service listens on |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Upstash Redis TLS connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_EXPIRY` | Access token expiry e.g. `15m` |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry e.g. `7d` |
| `LOGTAIL_SOURCE_TOKEN` | Logtail token for log shipping |