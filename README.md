# CollabCode

> A real-time collaborative online code editor. Write, share, and run code together — from anywhere.

---

## What is CollabCode?

CollabCode is an open, browser-based code editor built for teams. It lets developers create shared workspaces, organize code into projects, edit files collaboratively in real time, and execute code directly in the browser — without installing anything.

Whether you are pair programming, conducting a technical interview, running a workshop, or reviewing code with a teammate across the world, CollabCode keeps everyone in sync.

---

## Features

- **Workspaces & Projects** — Organize work into workspaces. Create multiple projects inside each workspace. Share either with your team in seconds.
- **Real-Time Collaboration** — Multiple users can work in the same file simultaneously. Cursor positions and changes are synced instantly using CRDT (Conflict-free Replicated Data Types).
- **File Locking** — When a collaborator is actively editing a file, it is locked to prevent conflicts. Others are notified in real time and the file becomes read-only until the edit is complete.
- **Role-Based Access Control** — Control who can view, edit, or manage every workspace and project. Three roles are supported: `Owner`, `Editor`, and `Viewer`.
- **In-Browser Code Execution** — Run code directly in the editor. Each execution runs in an isolated, sandboxed container with strict resource limits. No setup required.
- **Monaco Editor** — Powered by the same engine that drives VS Code. Syntax highlighting, IntelliSense, and keybindings work exactly as you expect.

---

## Architecture Overview

CollabCode is built as a **microservices monorepo** using Turborepo. Each service is independently deployable and communicates over REST (synchronous) and QStash (asynchronous).

```
apps/
├── frontend/                 # React + TypeScript SPA (Monaco Editor)
├── api-gateway/              # Request routing, JWT validation, rate limiting
├── auth-service/             # Authentication & authorization (JWT, OAuth2)
├── workspace-service/        # Workspaces, projects, and RBAC
├── file-service/             # File CRUD, locking (Redis), version history
├── collaboration-service/    # WebSocket server, real-time CRDT sync (Go)
├── execution-service/        # Sandboxed code execution via Docker (Go)
└── notification-service/     # Event-driven notifications (QStash consumer)

packages/
├── shared-types/             # TypeScript interfaces shared across all services
├── shared-utils/             # Common utilities (logger, response builders)
└── shared-config/            # Shared constants and environment schema
```

**Key technology decisions:**

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + TypeScript + Monaco Editor | Rich editor UI, type safety |
| Node.js Services | TypeScript + Fastify + Prisma | I/O-bound, shared types with frontend |
| Collaboration & Execution | Go | High concurrency, low-latency WebSockets, container control |
| Primary Database | PostgreSQL | Relational data, RBAC, strong consistency |
| Cache & Locks | Redis | Atomic file lock acquisition (SET NX), presence, sessions |
| File Storage | S3-compatible Object Storage | Versioned file content blobs |
| Async Messaging | QStash | Decoupled event-driven notifications |
| Real-Time Sync | Yjs (CRDT) | Conflict-free collaborative editing |
| Code Execution | Docker (gVisor) | Isolated, resource-limited sandboxes |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Go](https://go.dev/) 1.22+
- [Docker](https://www.docker.com/) + Docker Compose
- [pnpm](https://pnpm.io/) v9+

### Local Development

**1. Clone the repository**

```bash
git clone https://github.com/your-org/collabcode.git
cd collabcode
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment variables**

Copy the example env files for each service and fill in the values:

```bash
cp apps/auth-service/.env.example apps/auth-service/.env
cp apps/workspace-service/.env.example apps/workspace-service/.env
cp apps/file-service/.env.example apps/file-service/.env
# repeat for each service...
```

**4. Start all infrastructure and services**

```bash
docker-compose up
```

This starts PostgreSQL, Redis, and all application services. The frontend is available at `http://localhost:5173`.

**5. Run database migrations**

```bash
pnpm --filter auth-service exec prisma migrate dev
pnpm --filter workspace-service exec prisma migrate dev
pnpm --filter file-service exec prisma migrate dev
```

---

## Running Tests

```bash
# Run all tests across all services
pnpm turbo run test

# Run tests for a specific service
pnpm --filter file-service test

# Run end-to-end tests
pnpm --filter frontend test:e2e
```

---

## Service Health Checks

Every service exposes a health endpoint:

| Service | Port | Health URL |
|---|---|---|
| API Gateway | 3000 | http://localhost:3000/health |
| Auth Service | 3001 | http://localhost:3001/health |
| Workspace Service | 3002 | http://localhost:3002/health |
| File Service | 3003 | http://localhost:3003/health |
| Notification Service | 3004 | http://localhost:3004/health |
| Collaboration Service | 4000 | http://localhost:4000/health |
| Execution Service | 4001 | http://localhost:4001/health |
| Frontend | 5173 | http://localhost:5173 |

---

## Project Structure

```
collabcode/
├── .cursor/
│   └── rules                 # Cursor AI rules — architecture, conventions, codegen guardrails
├── apps/                     # All application services and frontend
├── packages/                 # Shared packages (types, utils, config)
├── infrastructure/
│   ├── docker/               # Per-service Dockerfiles (multi-stage)
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Cloud infrastructure as code
├── docs/
│   ├── architecture.md       # System design deep dive
│   ├── api-contracts/        # OpenAPI specs per service
│   └── adr/                  # Architecture Decision Records
├── scripts/                  # Dev, build, and deployment scripts
├── docker-compose.yml        # Local development orchestration
└── turbo.json                # Turborepo pipeline configuration
```

---

## API Documentation

OpenAPI specs for each service are maintained in `docs/api-contracts/`. When running locally, each service also serves interactive Swagger docs:

- Auth Service: http://localhost:3001/docs
- Workspace Service: http://localhost:3002/docs
- File Service: http://localhost:3003/docs
- Execution Service: http://localhost:4001/docs

---

## Security

Code execution is sandboxed with strict constraints per run:

- **No network access** inside execution containers
- **CPU limit:** 0.5 core
- **Memory limit:** 128 MB
- **Execution timeout:** 10 seconds
- **Non-root user** inside every container
- Containers are **destroyed immediately** after execution

File locking uses **atomic Redis SET NX** operations to guarantee that two clients can never acquire a lock simultaneously. Locks auto-expire after 30 seconds if not renewed.

JWT tokens are stored in **httpOnly cookies only** — never in localStorage.

All user input is validated against strict **Zod schemas** before reaching business logic.

---

## Contributing

Contributions are welcome. Please read the guidelines before submitting a pull request.

**Branch naming:**
```
feat/{ticket-id}-short-description
fix/{ticket-id}-short-description
chore/{description}
docs/{description}
```

**Commit format** (Conventional Commits):
```
feat(file-service): add Redis-based file lock acquisition
fix(auth-service): resolve JWT expiry edge case on refresh
```

All pull requests must pass linting, type checking, and unit tests before review.

---

## Architecture Decision Records

Major technical decisions are documented in `docs/adr/`:

- [ADR-001](docs/adr/001-microservices-architecture.md) — Microservices over monolith
- [ADR-002](docs/adr/002-file-locking-with-redis.md) — Pessimistic file locking with Redis
- [ADR-003](docs/adr/003-crdt-for-collaboration.md) — CRDT (Yjs) for conflict-free editing
- [ADR-004](docs/adr/004-go-for-execution-and-collaboration.md) — Go for execution and collaboration services

---

## License

MIT License. See [LICENSE](LICENSE) for details.t e s t  
 