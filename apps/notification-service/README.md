# Notification Service

Consumes asynchronous events from QStash and delivers notifications to users.
Acts as the single notification hub for all event-driven communication.

---

## Responsibilities

- Receive QStash webhook deliveries and verify request signatures
- Send email notifications for workspace invitations
- Send in-app notifications for lock conflicts and execution results
- Acknowledge successful delivery to QStash to prevent redelivery

---

## Endpoints

All endpoints are QStash webhook receivers — they are not called directly
by clients or other services. QStash calls them after receiving a published
event.

### POST `/notifications/member-invited`
Receives `workspace.member.invited` event from QStash.

**Request (from QStash):**
```json
{
  "type": "workspace.member.invited",
  "workspaceId": "uuid",
  "workspaceName": "My Team",
  "invitedEmail": "newmember@example.com",
  "invitedByName": "Jamal Ishaq",
  "role": "editor",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**Response `200`:**
```json
{
  "data": { "delivered": true },
  "error": null
}
```

---

### POST `/notifications/workspace-created`
Receives `workspace.created` event from QStash.

**Request:**
```json
{
  "type": "workspace.created",
  "workspaceId": "uuid",
  "workspaceName": "My Team",
  "ownerId": "uuid",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**Response `200`:**
```json
{
  "data": { "delivered": true },
  "error": null
}
```

---

### POST `/notifications/lock-conflict`
Receives `file.lock.conflict` event from QStash.

**Request:**
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

**Response `200`:**
```json
{
  "data": { "delivered": true },
  "error": null
}
```

---

### POST `/notifications/execution-completed`
Receives `execution.completed` event from QStash.

**Request:**
```json
{
  "type": "execution.completed",
  "executionId": "uuid",
  "userId": "uuid",
  "language": "python",
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 342,
  "timestamp": "2025-01-01T00:00:00Z"
}
```

**Response `200`:**
```json
{
  "data": { "delivered": true },
  "error": null
}
```

---

### GET `/health`
Health check endpoint.

---

## Service Communication

Notification service is a **pure consumer** — it never calls other services.
```
workspace-service  ──► QStash ──► POST /notifications/member-invited
workspace-service  ──► QStash ──► POST /notifications/workspace-created
file-service       ──► QStash ──► POST /notifications/lock-conflict
execution-service  ──► QStash ──► POST /notifications/execution-completed
```

QStash signature verification is performed on every incoming request using
`QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` to ensure
requests genuinely originate from QStash.

---

## Concurrency Control

Notification service is stateless and idempotent by design:

- Each webhook handler is idempotent — processing the same event twice
  produces the same outcome with no side effects
- QStash guarantees at-least-once delivery — idempotency prevents
  duplicate notifications on retry
- No shared mutable state between requests

---

## Low Level Design

### Folder Structure
```
src/
├── config/
│   └── index.ts                    — Zod env schema, typed config export
├── controllers/
│   └── notification.controller.ts  — Webhook HTTP handlers per event type
├── services/
│   └── notification.service.ts     — Dispatches events to correct handler
│   └── email.service.ts            — Sends emails via provider
│   └── inapp.service.ts            — Sends in-app notifications
├── middleware/
│   └── qstash.middleware.ts        — Verifies QStash request signature
│   └── validate.middleware.ts      — Zod payload validation
│   └── error.middleware.ts         — Global error handler
├── routes/
│   └── notification.route.ts       — Webhook route registration
│   └── health.route.ts             — Health check route
├── utils/
│   └── catch-async.ts              — Async handler wrapper
└── index.ts                        — Server bootstrap
```

### Controllers
| Name | Description |
|---|---|
| `NotificationController.memberInvited` | Handles workspace invitation event |
| `NotificationController.workspaceCreated` | Handles workspace creation event |
| `NotificationController.lockConflict` | Handles file lock conflict event |
| `NotificationController.executionCompleted` | Handles code execution result event |

### Services
| Name | Description |
|---|---|
| `NotificationService.dispatch` | Routes event to correct handler by type |
| `NotificationService.handleMemberInvited` | Sends invitation email |
| `NotificationService.handleWorkspaceCreated` | Sends welcome notification |
| `NotificationService.handleLockConflict` | Sends lock conflict in-app notification |
| `NotificationService.handleExecutionCompleted` | Sends execution result to user |
| `EmailService.send` | Sends transactional email via email provider |
| `InAppService.send` | Stores in-app notification for user retrieval |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the service listens on |
| `QSTASH_TOKEN` | QStash auth token |
| `QSTASH_CURRENT_SIGNING_KEY` | Current key for signature verification |
| `QSTASH_NEXT_SIGNING_KEY` | Next key for signature verification (rotation) |
| `LOGTAIL_SOURCE_TOKEN` | Logtail token for log shipping |