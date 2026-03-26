# Execution Service

Executes user-submitted code in isolated Docker containers with strict
resource limits. Each execution is ephemeral — the container is created,
runs once, and is immediately destroyed.

---

## Responsibilities

- Accept code execution requests with language and source code
- Spawn an ephemeral Docker container per execution
- Enforce resource limits: no network, 0.5 CPU, 128MB RAM, 10s timeout
- Capture stdout, stderr, and exit code from the container
- Destroy the container immediately after execution completes
- Publish execution result to QStash for notification-service delivery

---

## Supported Languages

| Language | Docker Image |
|---|---|
| Python | `python:3.12-alpine` |
| JavaScript | `node:20-alpine` |
| TypeScript | `node:20-alpine` (with ts-node) |
| Go | `golang:1.22-alpine` |
| Rust | `rust:1.76-alpine` |

---

## Endpoints

### POST `/execute`
Submit code for execution.

**Request:**
```json
{
  "language": "python",
  "code": "print('Hello, World!')",
  "executionId": "uuid"
}
```

**Response `200`:**
```json
{
  "data": {
    "executionId": "uuid",
    "stdout": "Hello, World!\n",
    "stderr": "",
    "exitCode": 0,
    "durationMs": 342,
    "language": "python",
    "timedOut": false
  },
  "error": null
}
```

**Response `200` (timeout):**
```json
{
  "data": {
    "executionId": "uuid",
    "stdout": "",
    "stderr": "Execution timed out after 10 seconds",
    "exitCode": 1,
    "durationMs": 10000,
    "language": "python",
    "timedOut": true
  },
  "error": null
}
```

**Response `400` (unsupported language):**
```json
{
  "data": null,
  "error": {
    "code": "UNSUPPORTED_LANGUAGE",
    "message": "Language 'cobol' is not supported",
    "statusCode": 400
  }
}
```

---

### GET `/health`
Health check endpoint.

**Response `200`:**
```json
{ "status": "ok", "uptime": 3600 }
```

---

## Service Communication

### Outbound — QStash (async)
After execution completes, the result is published to QStash for
notification-service to deliver to the user.

**Event: `execution.completed`**
```json
{
  "type": "execution.completed",
  "executionId": "uuid",
  "userId": "uuid",
  "language": "python",
  "stdout": "Hello, World!\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 342,
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Docker Socket
The service communicates with the host Docker daemon via the mounted
socket at `/var/run/docker.sock`. This is required to spawn execution
containers and must be mounted at runtime.

---

## Security Constraints

Every execution container is created with these constraints — no exceptions:
```go
HostConfig{
    NetworkMode:  "none",           // no network access
    Memory:       128 * 1024 * 1024, // 128MB RAM
    NanoCPUs:     500_000_000,       // 0.5 CPU
    AutoRemove:   true,              // destroyed after exit
    ReadonlyRootfs: true,            // read-only filesystem
    SecurityOpt:  ["no-new-privileges"],
}
```

A 10-second execution timeout is enforced via `context.WithTimeout`.
If the container exceeds this, it is forcefully killed and `timedOut: true`
is returned.

---

## Concurrency Control

- Each execution request spawns its own container — completely isolated
- A semaphore limits concurrent executions to prevent resource exhaustion:
  `maxConcurrent = 10` (configurable via env)
- Requests that exceed the semaphore limit return `503 Service Unavailable`
  immediately rather than queuing
- Container names use `executionId` as suffix to prevent naming collisions

---

## Low Level Design

### Folder Structure
```
internal/
├── config/
│   └── config.go          — Env loading and typed config struct
├── domain/
│   └── execution.go       — Execution request and result structs
│   └── language.go        — Supported language definitions and Docker images
├── handler/
│   └── execute.go         — HTTP handler for POST /execute
│   └── health.go          — Health check HTTP handler
├── service/
│   └── execution.service.go — Orchestrates container lifecycle
│   └── sandbox.service.go   — Docker container creation, run, capture, destroy
│   └── publisher.service.go — QStash event publishing
├── repository/
│   └── sandbox.repo.go    — Docker API calls via docker/docker client
├── middleware/
│   └── auth.go            — JWT validation middleware
└── cmd/
    ├── server/
    │   └── main.go        — Server bootstrap, router setup
    └── healthcheck/
        └── main.go        — Standalone health check binary for Docker
```

### Handlers
| Name | Description |
|---|---|
| `ExecuteHandler.Handle` | Validates request, acquires semaphore, delegates to service |
| `HealthHandler.Check` | Returns service status and uptime |

### Services
| Name | Description |
|---|---|
| `ExecutionService.Run` | Orchestrates full execution lifecycle |
| `SandboxService.Create` | Creates Docker container with security constraints |
| `SandboxService.Start` | Starts the container and attaches log stream |
| `SandboxService.Wait` | Waits for container exit with 10s timeout context |
| `SandboxService.Capture` | Reads stdout and stderr from container logs |
| `SandboxService.Destroy` | Force removes container after execution |
| `PublisherService.Publish` | Posts execution result to QStash |

### Repositories
| Name | Description |
|---|---|
| `SandboxRepository.CreateContainer` | Docker API ContainerCreate with security config |
| `SandboxRepository.StartContainer` | Docker API ContainerStart |
| `SandboxRepository.WaitContainer` | Docker API ContainerWait with context deadline |
| `SandboxRepository.Logs` | Docker API ContainerLogs for stdout/stderr |
| `SandboxRepository.RemoveContainer` | Docker API ContainerRemove with force flag |

### Domain Structs
| Name | Description |
|---|---|
| `ExecutionRequest` | Language, code, executionId, and userId |
| `ExecutionResult` | Stdout, stderr, exitCode, durationMs, timedOut flag |
| `Language` | Language name, Docker image, and file extension |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the service listens on |
| `JWT_SECRET` | For validating incoming request tokens |
| `QSTASH_URL` | QStash endpoint URL |
| `QSTASH_TOKEN` | QStash auth token |
| `MAX_CONCURRENT_EXECUTIONS` | Semaphore limit for parallel executions (default 10) |