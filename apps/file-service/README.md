# File Service

Manages file CRUD operations, enforces pessimistic file locking via Redis,
and stores file content in Cloudflare R2 object storage.

---

## Responsibilities

- Create, read, update, and delete files within projects
- Acquire and release Redis-based file locks to prevent concurrent edits
- Store file content as blobs in Cloudflare R2
- Notify collaboration-service of lock status changes via WebSocket broadcast
- Publish lock conflict events to QStash for user notification

---

## Endpoints

### Files

#### POST `/projects/:projectId/files`
Create a new file in a project.

**Request:**
```json
{
  "name": "main.ts",
  "content": "console.log('hello')"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "name": "main.ts",
    "size": 21,
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

#### GET `/projects/:projectId/files`
List all files in a project.

**Response `200`:**
```json
{
  "data": {
    "files": [
      {
        "id": "uuid",
        "name": "main.ts",
        "size": 21,
        "lockedBy": null,
        "lockedAt": null
      }
    ]
  },
  "error": null
}
```

---

#### GET `/projects/:projectId/files/:fileId`
Get file metadata and content.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "main.ts",
    "content": "console.log('hello')",
    "size": 21,
    "lockedBy": null,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

#### PATCH `/projects/:projectId/files/:fileId`
Update file content. Requires the caller to hold the lock.

**Request:**
```json
{
  "content": "console.log('updated')"
}
```

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "main.ts",
    "size": 26,
    "updatedAt": "2025-01-01T00:01:00Z"
  },
  "error": null
}
```

---

#### DELETE `/projects/:projectId/files/:fileId`
Delete a file. Requires no active lock on the file.

**Response `200`:**
```json
{
  "data": { "success": true },
  "error": null
}
```

---

### Locks

#### POST `/projects/:projectId/files/:fileId/lock`
Acquire a lock on a file. Uses Redis SET NX — atomic acquisition.
Returns 409 if file is already locked by another user.

**Response `200`:**
```json
{
  "data": {
    "fileId": "uuid",
    "lockedBy": "uuid",
    "lockedAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-01-01T00:00:30Z"
  },
  "error": null
}
```

**Response `409` (already locked):**
```json
{
  "data": null,
  "error": {
    "code": "FILE_LOCKED",
    "message": "File is locked by another user",
    "statusCode": 409,
    "lockedBy": "uuid",
    "expiresAt": "2025-01-01T00:00:30Z"
  }
}
```

---

#### DELETE `/projects/:projectId/files/:fileId/lock`
Release a lock. Only the user who holds the lock can release it.

**Response `200`:**
```json
{
  "data": { "success": true },
  "error": null
}
```

---

#### POST `/projects/:projectId/files/:fileId/lock/renew`
Renew lock TTL by another 30 seconds. Called every 15 seconds by the client.

**Response `200`:**
```json
{
  "data": {
    "expiresAt": "2025-01-01T00:01:00Z"
  },
  "error": null
}
```

---

### GET `/health`
Health check endpoint.

---

## Service Communication

### Outbound — QStash (async)
Publishes lock conflict events when a user tries to lock an already-locked file.

**Event: `file.lock.conflict`**
```json
{
  "type": "file.lock.conflict",
  "fileId": "uuid",
  "fileName": "main.ts",
  "requestedBy": "uuid",
  "lockedBy": "uuid",
  "expiresAt": "2025-01-01T00:00:30Z",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Inbound — API Gateway (sync)
All requests arrive via the API Gateway. `userId` is forwarded in
`x-user-id` header.

---

## Concurrency Control

File locking uses **atomic Redis SET NX** (set if not exists):
```
Key:   lock:file:{fileId}
Value: {userId}:{lockedAt}
TTL:   30 seconds
```

- Acquisition is atomic — two simultaneous lock requests resolve to exactly
  one success and one 409
- Locks auto-expire after 30 seconds if the client disconnects
- Clients must renew every 15 seconds to keep the lock alive
- Only the lock holder can write to the file or release the lock
- Lock holder is verified on every PATCH request before writing

---

## Low Level Design

### Folder Structure
```
src/
├── config/
│   └── index.ts              — Zod env schema, typed config export
│   └── storage.ts            — R2 S3 client initialisation
├── controllers/
│   └── file.controller.ts    — File CRUD HTTP handlers
│   └── lock.controller.ts    — Lock acquire, release, renew handlers
├── services/
│   └── file.service.ts       — File business logic, delegates to R2 and DB
│   └── lock.service.ts       — Redis lock acquisition, renewal, release
├── repositories/
│   └── file.repository.ts    — Prisma queries for file metadata
│   └── lock.repository.ts    — Redis lock operations (SET NX, GET, DEL, EXPIRE)
├── events/
│   └── producer.ts           — QStash publish for lock conflict events
├── middleware/
│   └── auth.middleware.ts    — Extracts userId from x-user-id header
│   └── validate.middleware.ts — Zod request validation
│   └── error.middleware.ts   — Global error handler
├── routes/
│   └── file.route.ts         — File and lock route registration
│   └── health.route.ts       — Health check route
├── utils/
│   └── catch-async.ts        — Async handler wrapper
└── index.ts                  — Server bootstrap
```

### Controllers
| Name | Description |
|---|---|
| `FileController.create` | Creates file metadata and uploads content to R2 |
| `FileController.list` | Returns all files in project with lock status |
| `FileController.getById` | Returns file metadata and content from R2 |
| `FileController.update` | Verifies lock, updates content in R2 and metadata in DB |
| `FileController.delete` | Verifies no active lock, deletes from R2 and DB |
| `LockController.acquire` | Attempts Redis SET NX, returns 409 on conflict |
| `LockController.release` | Verifies ownership, deletes Redis key |
| `LockController.renew` | Verifies ownership, resets Redis TTL to 30s |

### Services
| Name | Description |
|---|---|
| `FileService.create` | Generates R2 key, uploads content, saves metadata |
| `FileService.list` | Fetches file metadata, enriches with lock status from Redis |
| `FileService.getById` | Fetches metadata from DB, content from R2 |
| `FileService.update` | Verifies lock ownership, uploads new content to R2 |
| `FileService.delete` | Checks no lock exists, deletes from R2 and DB |
| `LockService.acquire` | Calls SET NX, publishes conflict event on failure |
| `LockService.release` | Verifies userId matches lock value, deletes key |
| `LockService.renew` | Verifies ownership, resets TTL via EXPIRE command |
| `LockService.getLockStatus` | Returns current lock holder and expiry for a file |

### Repositories
| Name | Description |
|---|---|
| `FileRepository.create` | Insert file metadata record |
| `FileRepository.findAllByProject` | List all file metadata for a project |
| `FileRepository.findById` | Find file metadata by ID |
| `FileRepository.update` | Update file size and updatedAt timestamp |
| `FileRepository.delete` | Delete file metadata record |
| `LockRepository.acquire` | Redis SET NX with 30s TTL |
| `LockRepository.get` | Redis GET to read lock holder |
| `LockRepository.release` | Redis DEL to remove lock |
| `LockRepository.renew` | Redis EXPIRE to reset TTL |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the service listens on |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Upstash Redis TLS connection string |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `QSTASH_URL` | QStash endpoint URL |
| `QSTASH_TOKEN` | QStash auth token |
| `LOGTAIL_SOURCE_TOKEN` | Logtail token for log shipping |